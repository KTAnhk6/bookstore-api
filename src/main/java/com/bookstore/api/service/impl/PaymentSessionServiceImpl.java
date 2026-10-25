package com.bookstore.api.service.impl;

import com.bookstore.api.common.VietQrGenerator;
import com.bookstore.api.config.PaymentQrProperties;
import com.bookstore.api.dto.request.CancelOrderRequest;
import com.bookstore.api.dto.request.CartRequest;
import com.bookstore.api.dto.request.OrderRequest;
import com.bookstore.api.dto.response.BankTransactionResponse;
import com.bookstore.api.dto.response.OrderResponse;
import com.bookstore.api.dto.response.PaymentSessionResponse;
import com.bookstore.api.entity.*;
import com.bookstore.api.exception.BadRequestException;
import com.bookstore.api.exception.ResourceNotFoundException;
import com.bookstore.api.repository.*;
import com.bookstore.api.service.BankHistoryClient;
import com.bookstore.api.service.OrderService;
import com.bookstore.api.service.PaymentService;
import com.bookstore.api.service.PaymentSessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.TreeMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentSessionServiceImpl implements PaymentSessionService {

    // Bỏ các ký tự dễ nhầm (0/O, 1/I) để khách gõ tay nội dung cũng không sai
    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_RANDOM_LENGTH = 8;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final PaymentSessionRepository sessionRepository;
    private final BankTransactionRepository bankTransactionRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final PaymentRepository paymentRepository;
    private final OrderService orderService;
    private final PaymentService paymentService;
    private final PaymentQrProperties qrProperties;

    @Override
    @Transactional
    public PaymentSessionResponse createSession(Long userId, OrderRequest request) {
        // Khóa user: hai request tạo phiên cùng lúc của một khách sẽ chạy lần lượt
        userRepository.lockById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        request.setPaymentMethod(Order.PaymentMethod.QR_CODE);
        if (request.getDirectItems() != null) {
            for (CartRequest item : request.getDirectItems()) {
                if (item.getBookId() == null || item.getQuantity() == null || item.getQuantity() < 1) {
                    throw new BadRequestException("Sản phẩm hoặc số lượng không hợp lệ");
                }
            }
        }

        LocalDateTime now = LocalDateTime.now();
        List<PaymentSession> pending = sessionRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, PaymentSession.Status.PENDING);
        boolean fromCart = request.getDirectItems() == null || request.getDirectItems().isEmpty();

        // Thanh toán từ giỏ: giỏ đã chuyển thành đơn của phiên đang chờ -> trả lại phiên đó
        if (fromCart && cartRepository.countByUserId(userId) == 0) {
            for (PaymentSession s : pending) {
                if (s.getExpiresAt().isAfter(now)) {
                    return toResponse(s, true);
                }
            }
        }

        String signature = signature(userId, request);
        for (PaymentSession s : pending) {
            if (s.getItemsSignature().equals(signature) && s.getExpiresAt().isAfter(now)) {
                return toResponse(s, true); // cùng sản phẩm, còn hạn -> giữ QR cũ
            }
        }

        for (PaymentSession s : pending) {
            boolean expired = !s.getExpiresAt().isAfter(now);
            close(s, expired ? PaymentSession.Status.EXPIRED : PaymentSession.Status.CANCELLED,
                    expired ? "Hết hạn thanh toán" : "Khách chọn sản phẩm khác, đã tạo phiên mới");
        }

        OrderResponse created = orderService.createOrder(userId, request);
        Order order = orderRepository.findById(created.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", created.getId()));

        long amount = order.getTotalAmount().setScale(0, RoundingMode.CEILING).longValueExact();
        if (amount <= 0) {
            throw new BadRequestException("Đơn hàng 0đ không cần thanh toán QR");
        }

        String code = generatePaymentCode();
        String payload = VietQrGenerator.buildPayload(qrProperties.getBankBin(), qrProperties.getAccountNo(), amount, code);
        LocalDateTime expiresAt = now.plusMinutes(qrProperties.getSessionMinutes());

        PaymentSession session = sessionRepository.save(PaymentSession.builder()
                .user(order.getUser())
                .order(order)
                .paymentCode(code)
                .amount(BigDecimal.valueOf(amount))
                .itemsSignature(signature)
                .qrPayload(payload)
                .expiresAt(expiresAt)
                .build());

        paymentRepository.findByOrderId(order.getId()).ifPresent(payment -> {
            payment.setQrData(payload);
            payment.setQrExpiredAt(expiresAt);
            payment.setBankCode(qrProperties.getBankBin());
            payment.setAccountNumber(qrProperties.getAccountNo());
            paymentRepository.save(payment);
        });

        log.info("[QR] Tạo phiên #{} user={} order={} số tiền={} nội dung={}",
                session.getId(), userId, order.getOrderCode(), amount, code);
        return toResponse(session, true);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentSessionResponse getSession(Long userId, Long sessionId) {
        PaymentSession session = sessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("PaymentSession", "id", sessionId));
        return toResponse(session, true);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentSessionResponse getActiveSession(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        return sessionRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, PaymentSession.Status.PENDING).stream()
                .filter(s -> s.getExpiresAt().isAfter(now))
                .findFirst()
                .map(s -> toResponse(s, true))
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentSessionResponse> getMySessions(Long userId) {
        return sessionRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, 20)).stream()
                .map(s -> toResponse(s, false))
                .toList();
    }

    @Override
    @Transactional
    public PaymentSessionResponse cancelSession(Long userId, Long sessionId) {
        sessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("PaymentSession", "id", sessionId));
        PaymentSession session = sessionRepository.lockById(sessionId).orElseThrow();
        if (session.getStatus() != PaymentSession.Status.PENDING) {
            throw new BadRequestException("Phiên thanh toán đã kết thúc (" + session.getStatus() + "), không thể hủy");
        }
        close(session, PaymentSession.Status.CANCELLED, "Khách hủy thanh toán");
        return toResponse(session, false);
    }

    @Override
    @Transactional
    public BankTransaction.Result applyBankTransaction(Long sessionId, BankHistoryClient.IncomingTransaction txn) {
        if (bankTransactionRepository.existsByRefNo(txn.refNo())) {
            return null;
        }
        PaymentSession session = sessionRepository.lockById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("PaymentSession", "id", sessionId));
        Order order = session.getOrder();

        BankTransaction.Result result;
        String note;
        if (session.getStatus() == PaymentSession.Status.PAID) {
            result = BankTransaction.Result.DUPLICATE;
            note = "Phiên đã thanh toán trước đó, khách chuyển thừa -> cần hoàn tiền";
        } else if (session.getStatus() != PaymentSession.Status.PENDING || order.getStatus() == Order.OrderStatus.CANCELLED) {
            result = BankTransaction.Result.LATE;
            note = "Tiền về khi phiên đã " + session.getStatus() + " -> cần hoàn tiền thủ công";
        } else {
            session.setReceivedAmount(session.getReceivedAmount().add(txn.amount()));
            if (session.getReceivedAmount().compareTo(session.getAmount()) >= 0) {
                result = BankTransaction.Result.PAID;
                note = "Đủ tiền, đã xác nhận thanh toán";
                session.setStatus(PaymentSession.Status.PAID);
                session.setPaidAt(LocalDateTime.now());
                session.setBankRefNo(txn.refNo());
                paymentService.processPayment(order.getId(), txn.refNo(),
                        "Chuyển khoản QR " + session.getPaymentCode() + ", đã nhận " + session.getReceivedAmount().toPlainString() + "đ");
            } else {
                result = BankTransaction.Result.PARTIAL;
                note = "Chưa đủ tiền: đã nhận " + session.getReceivedAmount().toPlainString()
                        + "/" + session.getAmount().toPlainString() + "đ";
            }
            sessionRepository.save(session);
        }

        bankTransactionRepository.save(BankTransaction.builder()
                .refNo(txn.refNo())
                .accountNo(txn.accountNo())
                .amount(txn.amount())
                .description(truncate(txn.description(), 500))
                .transactionDate(txn.transactionDate())
                .session(session)
                .result(result)
                .note(note)
                .build());

        log.info("[QR] Giao dịch {} {}đ -> phiên #{} ({}): {}", txn.refNo(), txn.amount().toPlainString(),
                session.getId(), session.getPaymentCode(), result);
        return result;
    }

    @Override
    @Transactional
    public boolean expireSession(Long sessionId) {
        PaymentSession session = sessionRepository.lockById(sessionId).orElse(null);
        if (session == null || session.getStatus() != PaymentSession.Status.PENDING
                || session.getExpiresAt().isAfter(LocalDateTime.now())) {
            return false;
        }
        close(session, PaymentSession.Status.EXPIRED, "Hết hạn thanh toán (" + qrProperties.getSessionMinutes() + " phút)");
        log.info("[QR] Phiên #{} ({}) hết hạn, đã hủy đơn {}", session.getId(), session.getPaymentCode(),
                session.getOrder().getOrderCode());
        return true;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentSessionResponse> getAllSessions(PaymentSession.Status status) {
        PageRequest page = PageRequest.of(0, 100);
        List<PaymentSession> sessions = status == null
                ? sessionRepository.findAllByOrderByCreatedAtDesc(page)
                : sessionRepository.findByStatusOrderByCreatedAtDesc(status, page);
        return sessions.stream().map(s -> toResponse(s, false)).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BankTransactionResponse> getBankTransactions() {
        return bankTransactionRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 100)).stream()
                .map(BankTransactionResponse::fromEntity)
                .toList();
    }

    /** Kết thúc phiên và hủy đơn chưa thanh toán (hoàn kho, payment -> FAILED). */
    private void close(PaymentSession session, PaymentSession.Status status, String reason) {
        session.setStatus(status);
        session.setCancelReason(reason);
        sessionRepository.save(session);

        Order order = session.getOrder();
        boolean cancellable = order.getStatus() == Order.OrderStatus.PENDING || order.getStatus() == Order.OrderStatus.CONFIRMED;
        if (cancellable && order.getPaymentStatus() != Order.PaymentStatus.SUCCESS) {
            orderService.cancelOrder(session.getUser().getId(), order.getId(), new CancelOrderRequest(reason));
        }
    }

    private String generatePaymentCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder(qrProperties.getCodePrefix());
            for (int i = 0; i < CODE_RANDOM_LENGTH; i++) {
                sb.append(CODE_ALPHABET.charAt(RANDOM.nextInt(CODE_ALPHABET.length())));
            }
            code = sb.toString();
        } while (sessionRepository.existsByPaymentCode(code));
        return code;
    }

    /** Dấu vân tay của nội dung đơn: sản phẩm + số lượng + mã giảm giá + điểm + địa chỉ. */
    private String signature(Long userId, OrderRequest request) {
        Map<Long, Integer> items = new TreeMap<>();
        String source;
        if (request.getDirectItems() != null && !request.getDirectItems().isEmpty()) {
            source = "DIRECT";
            for (CartRequest item : request.getDirectItems()) {
                items.merge(item.getBookId(), item.getQuantity(), Integer::sum);
            }
        } else {
            source = "CART";
            for (Cart cart : cartRepository.findByUserIdOrderByCreatedAtDesc(userId)) {
                items.merge(cart.getBook().getId(), cart.getQuantity(), Integer::sum);
            }
        }
        String raw = String.join("|", source, items.toString(),
                Objects.toString(request.getCouponCode(), "").trim().toUpperCase(),
                Objects.toString(request.getUsePoints(), "0"),
                Objects.toString(request.getAddressId(), ""),
                Objects.toString(request.getRecipientName(), ""), Objects.toString(request.getPhone(), ""),
                Objects.toString(request.getProvince(), ""), Objects.toString(request.getDistrict(), ""),
                Objects.toString(request.getWard(), ""), Objects.toString(request.getDetailAddress(), ""));
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private PaymentSessionResponse toResponse(PaymentSession s, boolean withImage) {
        Order order = s.getOrder();
        boolean pending = s.getStatus() == PaymentSession.Status.PENDING;
        long remaining = pending ? Math.max(0, Duration.between(LocalDateTime.now(), s.getExpiresAt()).getSeconds()) : 0;
        return PaymentSessionResponse.builder()
                .sessionId(s.getId())
                .status(s.getStatus())
                .orderId(order.getId())
                .orderCode(order.getOrderCode())
                .items(order.getItems().stream().map(i -> i.getBookTitle() + " x" + i.getQuantity()).toList())
                .bankBin(qrProperties.getBankBin())
                .bankName(qrProperties.getBankName())
                .accountNo(qrProperties.getAccountNo())
                .accountName(qrProperties.getAccountName())
                .amount(s.getAmount())
                .receivedAmount(s.getReceivedAmount())
                .paymentCode(s.getPaymentCode())
                .qrPayload(pending ? s.getQrPayload() : null)
                .qrImage(withImage && pending && remaining > 0 ? VietQrGenerator.toPngDataUri(s.getQrPayload(), 360) : null)
                .createdAt(s.getCreatedAt())
                .expiresAt(s.getExpiresAt())
                .remainingSeconds(remaining)
                .paidAt(s.getPaidAt())
                .bankRefNo(s.getBankRefNo())
                .cancelReason(s.getCancelReason())
                .build();
    }

    private static String truncate(String value, int max) {
        return value == null || value.length() <= max ? value : value.substring(0, max);
    }
}
