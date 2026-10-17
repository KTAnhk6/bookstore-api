package com.bookstore.api.service.impl;

import com.bookstore.api.dto.request.PaymentCallbackRequest;
import com.bookstore.api.dto.request.PaymentRequest;
import com.bookstore.api.dto.response.CouponResponse;
import com.bookstore.api.dto.response.PaymentResponse;
import com.bookstore.api.entity.Coupon;
import com.bookstore.api.entity.Order;
import com.bookstore.api.entity.Payment;
import com.bookstore.api.exception.BadRequestException;
import com.bookstore.api.exception.ResourceNotFoundException;
import com.bookstore.api.repository.CouponRepository;
import com.bookstore.api.repository.OrderRepository;
import com.bookstore.api.repository.PaymentRepository;
import com.bookstore.api.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final CouponRepository couponRepository;

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByOrderId(Long userId, Long orderId) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        Payment payment = paymentRepository.findByOrderId(order.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "orderId", orderId));

        return PaymentResponse.fromEntity(payment);
    }

    @Override
    @Transactional
    public PaymentResponse processPayment(Long orderId, String transactionCode, String notes) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        Payment payment = paymentRepository.findByOrderId(order.getId())
                .orElseGet(() -> Payment.builder()
                        .order(order)
                        .amount(order.getTotalAmount())
                        .method(order.getPaymentMethod())
                        .build());

        payment.setStatus(Order.PaymentStatus.SUCCESS);
        payment.setTransactionCode(transactionCode != null ? transactionCode : "TXN-" + System.currentTimeMillis());
        payment.setPaidAt(LocalDateTime.now());
        payment.setNotes(notes);

        payment = paymentRepository.save(payment);

        order.setPaymentStatus(Order.PaymentStatus.SUCCESS);
        if (order.getStatus() == Order.OrderStatus.PENDING) {
            order.setStatus(Order.OrderStatus.CONFIRMED);
        }
        orderRepository.save(order);

        return PaymentResponse.fromEntity(payment);
    }

    @Override
    @Transactional
    public PaymentResponse createPaymentSession(Long userId, Long orderId, Order.PaymentMethod method) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (order.getPaymentStatus() == Order.PaymentStatus.SUCCESS) {
            throw new BadRequestException("Đơn hàng này đã được thanh toán thành công.");
        }

        order.setPaymentMethod(method);
        orderRepository.save(order);

        Payment payment = Payment.builder()
                .order(order)
                .amount(order.getTotalAmount())
                .method(method)
                .status(Order.PaymentStatus.PENDING)
                .build();

        if (method == Order.PaymentMethod.QR_CODE || method == Order.PaymentMethod.BANKING) {
            String orderCode = order.getOrderCode() != null ? order.getOrderCode() : "BK" + order.getId();
            payment.setQrData("2|99|0912345678|BOOKSTORE OFFICIAL|" + order.getTotalAmount() + "|" + orderCode);
            payment.setQrCodeUrl("https://api.vietqr.io/image/970422-0912345678-qrl81a0.jpg?accountName=BOOKSTORE%20OFFICIAL&amount="
                    + order.getTotalAmount() + "&addInfo=" + orderCode);
            payment.setQrExpiredAt(LocalDateTime.now().plusMinutes(15));
            payment.setBankCode("MBBANK");
            payment.setAccountNumber("0912345678");
            payment.setTransactionCode("QR" + System.currentTimeMillis());
        } else if (method == Order.PaymentMethod.VNPAY) {
            payment.setTransactionCode("VNP_" + System.currentTimeMillis());
            payment.setNotes("Chuyển hướng đến VNPay...");
        } else {
            payment.setTransactionCode("COD_" + System.currentTimeMillis());
            payment.setNotes("Thanh toán tiền mặt khi nhận hàng (COD)");
        }

        payment = paymentRepository.save(payment);
        return PaymentResponse.fromEntity(payment);
    }

    @Override
    @Transactional
    public PaymentResponse createPayment(Long userId, PaymentRequest request) {
        Order.PaymentMethod method = request.getPaymentMethod() != null ? request.getPaymentMethod() : Order.PaymentMethod.QR_CODE;
        PaymentResponse response = createPaymentSession(userId, request.getOrderId(), method);

        if (request.getNotes() != null || request.getBankCode() != null) {
            Payment payment = paymentRepository.findById(response.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", response.getId()));
            if (request.getNotes() != null) payment.setNotes(request.getNotes());
            if (request.getBankCode() != null) payment.setBankCode(request.getBankCode());
            payment = paymentRepository.save(payment);
            return PaymentResponse.fromEntity(payment);
        }

        return response;
    }

    @Override
    @Transactional
    public PaymentResponse processCallback(PaymentCallbackRequest request) {
        Payment payment = null;

        if (request.getTransactionCode() != null && !request.getTransactionCode().isBlank()) {
            payment = paymentRepository.findByTransactionCode(request.getTransactionCode()).orElse(null);
        }

        if (payment == null && request.getOrderCode() != null) {
            payment = paymentRepository.findByOrder_OrderCode(request.getOrderCode()).orElse(null);
        }

        if (payment == null && request.getOrderId() != null) {
            payment = paymentRepository.findByOrderId(request.getOrderId()).orElse(null);
        }

        if (payment == null) {
            throw new ResourceNotFoundException("Không tìm thấy giao dịch thanh toán phù hợp để callback");
        }

        Order order = payment.getOrder();
        boolean isSuccess = "00".equals(request.getResponseCode())
                || request.getStatus() == Order.PaymentStatus.SUCCESS
                || (request.getResponseCode() == null && request.getStatus() == null);

        if (isSuccess) {
            payment.setStatus(Order.PaymentStatus.SUCCESS);
            payment.setPaidAt(LocalDateTime.now());
            if (request.getTransactionCode() != null) {
                payment.setTransactionCode(request.getTransactionCode());
            }
            if (request.getNotes() != null) {
                payment.setNotes(request.getNotes());
            }
            if (request.getBankCode() != null) {
                payment.setBankCode(request.getBankCode());
            }

            order.setPaymentStatus(Order.PaymentStatus.SUCCESS);
            if (order.getStatus() == Order.OrderStatus.PENDING) {
                order.setStatus(Order.OrderStatus.CONFIRMED);
            }
        } else {
            payment.setStatus(Order.PaymentStatus.FAILED);
            payment.setNotes("Giao dịch không thành công: " + request.getResponseCode());
            order.setPaymentStatus(Order.PaymentStatus.FAILED);
        }

        paymentRepository.save(payment);
        orderRepository.save(order);

        return PaymentResponse.fromEntity(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentHistory(Long userId, Long orderId) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        return paymentRepository.findByOrderIdOrderByCreatedAtDesc(order.getId())
                .stream()
                .map(PaymentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CouponResponse validateCoupon(String code, BigDecimal subtotal) {
        if (code == null || code.isBlank()) {
            throw new BadRequestException("Vui lòng nhập mã giảm giá");
        }

        Coupon coupon = couponRepository.findByCodeIgnoreCaseAndActiveTrue(code.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Mã giảm giá '" + code + "' không tồn tại hoặc đã hết hạn"));

        if (!coupon.isValid(subtotal != null ? subtotal : BigDecimal.ZERO)) {
            throw new BadRequestException("Đơn hàng chưa đạt điều kiện áp dụng mã giảm giá này");
        }

        BigDecimal discount = coupon.calculateDiscount(subtotal != null ? subtotal : BigDecimal.ZERO);
        CouponResponse response = CouponResponse.fromEntity(coupon);
        response.setCalculatedDiscount(discount);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getAllPayments() {
        return paymentRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(PaymentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PaymentResponse> getPaymentsForAdmin(Order.PaymentStatus status, Order.PaymentMethod method, Pageable pageable) {
        return paymentRepository.searchPayments(status, method, pageable)
                .map(PaymentResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));
        return PaymentResponse.fromEntity(payment);
    }

    @Override
    @Transactional
    public PaymentResponse updatePaymentStatus(Long paymentId, Order.PaymentStatus status, String notes) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        payment.setStatus(status);
        if (notes != null) {
            payment.setNotes(notes);
        }
        if (status == Order.PaymentStatus.SUCCESS) {
            payment.setPaidAt(LocalDateTime.now());
            payment.getOrder().setPaymentStatus(Order.PaymentStatus.SUCCESS);
            if (payment.getOrder().getStatus() == Order.OrderStatus.PENDING) {
                payment.getOrder().setStatus(Order.OrderStatus.CONFIRMED);
            }
        } else if (status == Order.PaymentStatus.REFUNDED) {
            payment.getOrder().setPaymentStatus(Order.PaymentStatus.REFUNDED);
        } else if (status == Order.PaymentStatus.FAILED) {
            payment.getOrder().setPaymentStatus(Order.PaymentStatus.FAILED);
        }

        payment = paymentRepository.save(payment);
        orderRepository.save(payment.getOrder());
        return PaymentResponse.fromEntity(payment);
    }
}
