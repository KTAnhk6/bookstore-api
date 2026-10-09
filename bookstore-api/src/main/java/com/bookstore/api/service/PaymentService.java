package com.bookstore.api.service;

import com.bookstore.api.entity.Payment;
import java.util.List;

public interface PaymentService {
    
    // Tạo phiên thanh toán mới cho đơn hàng (hỗ trợ COD, QR code, Online...)
    Payment createPaymentSession(Long orderId, String paymentMethodCode);
    
    // Lấy lịch sử giao dịch của một đơn hàng
    List<Payment> getPaymentHistoryByOrderId(Long orderId);
    
    // Cập nhật trạng thái thanh toán (PENDING, SUCCESS, FAILED...)
    Payment updatePaymentStatus(Long paymentId, String status, String transactionId);
}
