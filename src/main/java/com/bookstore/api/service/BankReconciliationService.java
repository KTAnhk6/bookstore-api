package com.bookstore.api.service;

import com.bookstore.api.config.PaymentQrProperties;
import com.bookstore.api.entity.BankTransaction;
import com.bookstore.api.entity.PaymentSession;
import com.bookstore.api.repository.BankTransactionRepository;
import com.bookstore.api.repository.PaymentSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Xác nhận thanh toán phía server: định kỳ đọc sao kê tài khoản nhận tiền,
 * tìm giao dịch có nội dung chứa mã phiên, cộng tiền vào phiên và chốt đơn.
 * Sau đó hết hạn các phiên quá 10 phút (hủy đơn, hoàn kho).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BankReconciliationService {

    // Phiên tạo trong khoảng này vẫn được dò tiền về (kể cả đã hết hạn, để phát hiện tiền về trễ)
    private static final int MATCH_WINDOW_MINUTES = 60;
    // API ngân hàng lỗi thì chưa biết khách đã chuyển hay chưa -> cho thêm thời gian trước khi hủy đơn
    private static final int EXPIRE_GRACE_WHEN_BANK_DOWN_MINUTES = 5;
    private static final long MIN_MANUAL_SYNC_INTERVAL_MS = 5000;

    private final BankHistoryClient bankHistoryClient;
    private final PaymentSessionRepository sessionRepository;
    private final BankTransactionRepository bankTransactionRepository;
    private final PaymentSessionService paymentSessionService;
    private final PaymentQrProperties qrProperties;

    private volatile long lastSyncAt;

    @Scheduled(fixedDelayString = "${payment.bank.poll-interval-ms:15000}",
            initialDelayString = "${payment.bank.poll-interval-ms:15000}")
    public void scheduledRun() {
        boolean bankOk = true;
        if (sessionRepository.existsByCreatedAtAfter(LocalDateTime.now().minusMinutes(MATCH_WINDOW_MINUTES))) {
            bankOk = syncNow().ok();
        }
        expireOverdue(bankOk ? 0 : EXPIRE_GRACE_WHEN_BANK_DOWN_MINUTES);
    }

    /** Khách bấm "Tôi đã chuyển khoản": đối soát ngay, tối đa 1 lần / 5 giây để không spam API ngân hàng. */
    public void syncIfStale() {
        if (System.currentTimeMillis() - lastSyncAt >= MIN_MANUAL_SYNC_INTERVAL_MS) {
            syncNow();
        }
    }

    public synchronized SyncResult syncNow() {
        lastSyncAt = System.currentTimeMillis();
        List<PaymentSession> candidates = sessionRepository.findByCreatedAtAfter(LocalDateTime.now().minusMinutes(MATCH_WINDOW_MINUTES));
        if (candidates.isEmpty()) {
            return new SyncResult(true, 0, 0, null);
        }
        Map<String, Long> sessionIdByCode = new HashMap<>();
        candidates.forEach(s -> sessionIdByCode.put(s.getPaymentCode(), s.getId()));

        List<BankHistoryClient.IncomingTransaction> incoming;
        try {
            incoming = bankHistoryClient.fetchIncoming();
        } catch (BankHistoryClient.BankApiException e) {
            log.warn("[BANK] Đối soát thất bại: {}", e.getMessage());
            return new SyncResult(false, 0, 0, e.getMessage());
        }

        int matched = 0;
        for (BankHistoryClient.IncomingTransaction txn : incoming) {
            if (txn.accountNo() != null && !txn.accountNo().isBlank()
                    && !txn.accountNo().trim().equals(qrProperties.getAccountNo())) {
                continue; // giao dịch của tài khoản khác
            }
            Long sessionId = findSession(txn.description(), sessionIdByCode);
            if (sessionId == null || bankTransactionRepository.existsByRefNo(txn.refNo())) {
                continue;
            }
            try {
                BankTransaction.Result result = paymentSessionService.applyBankTransaction(sessionId, txn);
                if (result != null) matched++;
            } catch (DataIntegrityViolationException e) {
                log.debug("[BANK] Giao dịch {} đã được xử lý", txn.refNo());
            } catch (Exception e) {
                log.error("[BANK] Lỗi xử lý giao dịch {}: {}", txn.refNo(), e.getMessage(), e);
            }
        }
        return new SyncResult(true, incoming.size(), matched, null);
    }

    public int expireOverdue(int graceMinutes) {
        List<Long> ids = sessionRepository.findIdsByStatusAndExpiresAtBefore(
                PaymentSession.Status.PENDING, LocalDateTime.now().minusMinutes(graceMinutes));
        int expired = 0;
        for (Long id : ids) {
            try {
                if (paymentSessionService.expireSession(id)) expired++;
            } catch (Exception e) {
                log.error("[QR] Lỗi hết hạn phiên #{}: {}", id, e.getMessage(), e);
            }
        }
        return expired;
    }

    /** Nội dung CK bị app ngân hàng thêm tên, dấu cách, ký tự lạ -> chuẩn hóa rồi tìm mã phiên bên trong. */
    static Long findSession(String description, Map<String, Long> sessionIdByCode) {
        String normalized = description == null ? "" : description.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]", "");
        for (Map.Entry<String, Long> e : sessionIdByCode.entrySet()) {
            if (normalized.contains(e.getKey())) {
                return e.getValue();
            }
        }
        return null;
    }

    public record SyncResult(boolean ok, int fetched, int matched, String error) {
    }
}
