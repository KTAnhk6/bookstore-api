package com.bookstore.api.controller;

import com.bookstore.api.common.ApiResponse;
import com.bookstore.api.entity.Payment;
import com.bookstore.api.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {
    
    private final PaymentService paymentService;

    // API tạo phiên thanh toán mới cho đơn hàng
    @PostMapping("/create-session/{orderId}")
    public ApiResponse<Payment> createPaymentSession(
            @PathVariable Long orderId,
            @RequestParam String paymentMethod) {
        
        Payment payment = paymentService.createPaymentSession(orderId, paymentMethod);
        return ApiResponse.success("Tạo phiên thanh toán thành công", payment);
    }

    // API xem lịch sử giao dịch của một đơn hàng
    @GetMapping("/history/{orderId}")
    public ApiResponse<List<Payment>> getPaymentHistory(@PathVariable Long orderId) {
        List<Payment> history = paymentService.getPaymentHistoryByOrderId(orderId);
        return ApiResponse.success(history);
    }

    // API cập nhật trạng thái thanh toán (thường gọi qua Webhook từ cổng thanh toán)
    @PutMapping("/{paymentId}/status")
    public ApiResponse<Payment> updatePaymentStatus(
            @PathVariable Long paymentId,
            @RequestParam String status,
            @RequestParam(required = false) String transactionId) {
        
        Payment payment = paymentService.updatePaymentStatus(paymentId, status, transactionId);
        return ApiResponse.success("Cập nhật trạng thái thanh toán thành công", payment);
    }
}
