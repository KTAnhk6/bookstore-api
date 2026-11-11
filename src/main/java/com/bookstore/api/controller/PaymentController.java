package com.bookstore.api.controller;

import com.bookstore.api.common.ApiResponse;
import com.bookstore.api.dto.response.CouponResponse;
import com.bookstore.api.dto.response.PaymentResponse;
import com.bookstore.api.security.CustomUserDetails;
import com.bookstore.api.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping("/order/{orderId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentByOrderId(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long orderId
    ) {
        PaymentResponse response = paymentService.getPaymentByOrderId(userDetails.getId(), orderId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/order/{orderId}/session")
    public ResponseEntity<ApiResponse<PaymentResponse>> createPaymentSession(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long orderId,
            @RequestParam com.bookstore.api.entity.Order.PaymentMethod method
    ) {
        PaymentResponse response = paymentService.createPaymentSession(userDetails.getId(), orderId, method);
        return ResponseEntity.ok(ApiResponse.success("Tạo phiên thanh toán thành công", response));
    }

    @GetMapping("/order/{orderId}/history")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getPaymentHistory(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long orderId
    ) {
        List<PaymentResponse> response = paymentService.getPaymentHistory(userDetails.getId(), orderId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // Chỉ admin được xác nhận tay; khách thanh toán QR được xác nhận tự động qua sao kê ngân hàng
    @PostMapping("/process")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PaymentResponse>> processPayment(
            @RequestParam Long orderId,
            @RequestParam(required = false) String transactionCode,
            @RequestParam(required = false) String notes
    ) {
        PaymentResponse response = paymentService.processPayment(orderId, transactionCode, notes);
        return ResponseEntity.ok(ApiResponse.success("Xử lý thanh toán thành công", response));
    }

    @GetMapping("/coupons/validate")
    public ResponseEntity<ApiResponse<CouponResponse>> validateCoupon(
            @RequestParam String code,
            @RequestParam(required = false) BigDecimal subtotal
    ) {
        CouponResponse response = paymentService.validateCoupon(code, subtotal);
        return ResponseEntity.ok(ApiResponse.success("Áp dụng mã giảm giá thành công", response));
    }
}
