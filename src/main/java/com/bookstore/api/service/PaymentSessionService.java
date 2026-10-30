package com.bookstore.api.service;

import com.bookstore.api.dto.request.OrderRequest;
import com.bookstore.api.dto.response.BankTransactionResponse;
import com.bookstore.api.dto.response.PaymentSessionResponse;
import com.bookstore.api.entity.BankTransaction;
import com.bookstore.api.entity.PaymentSession;

import java.util.List;

public interface PaymentSessionService {

    /**
     * Tạo phiên thanh toán QR (10 phút) cho đơn mới.
     * Cùng sản phẩm và phiên cũ còn hạn -> trả lại phiên cũ (giữ nguyên QR).
     * Khác sản phẩm -> hủy phiên + đơn cũ (hoàn kho), tạo đơn và QR mới với nội dung chuyển khoản mới.
     */
    PaymentSessionResponse createSession(Long userId, OrderRequest request);

    PaymentSessionResponse getSession(Long userId, Long sessionId);

    /** Phiên đang chờ thanh toán của khách, null nếu không có. */
    PaymentSessionResponse getActiveSession(Long userId);

    List<PaymentSessionResponse> getMySessions(Long userId);

    PaymentSessionResponse cancelSession(Long userId, Long sessionId);

    /** Ghi nhận một giao dịch tiền vào đã khớp nội dung với phiên. Trả null nếu giao dịch đã xử lý trước đó. */
    BankTransaction.Result applyBankTransaction(Long sessionId, BankHistoryClient.IncomingTransaction txn);

    /** Hết hạn phiên nếu đã quá giờ: hủy đơn, hoàn kho. */
    boolean expireSession(Long sessionId);

    List<PaymentSessionResponse> getAllSessions(PaymentSession.Status status);

    List<BankTransactionResponse> getBankTransactions();
}
