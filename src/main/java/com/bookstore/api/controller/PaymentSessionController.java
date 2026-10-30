package com.bookstore.api.controller;

import com.bookstore.api.common.ApiResponse;
import com.bookstore.api.dto.request.OrderRequest;
import com.bookstore.api.dto.response.BankTransactionResponse;
import com.bookstore.api.dto.response.PaymentSessionResponse;
import com.bookstore.api.entity.PaymentSession;
import com.bookstore.api.security.CustomUserDetails;
import com.bookstore.api.service.BankReconciliationService;
import com.bookstore.api.service.PaymentSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Thanh toán chuyển khoản qua VietQR, mỗi phiên 10 phút, server tự xác nhận qua sao kê ngân hàng. */
@RestController
@RequestMapping("/api/payments/qr")
@RequiredArgsConstructor
public class PaymentSessionController {

    private final PaymentSessionService paymentSessionService;
    private final BankReconciliationService reconciliationService;

    @PostMapping("/session")
    public ResponseEntity<ApiResponse<PaymentSessionResponse>> createSession(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody OrderRequest request // paymentMethod luôn là QR_CODE nên không bắt client gửi
    ) {
        PaymentSessionResponse response = paymentSessionService.createSession(userDetails.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đã tạo mã QR, vui lòng thanh toán trong thời gian quy định", response));
    }

    @GetMapping("/session/active")
    public ResponseEntity<ApiResponse<PaymentSessionResponse>> getActiveSession(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        PaymentSessionResponse response = paymentSessionService.getActiveSession(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(response == null ? "Không có phiên đang chờ thanh toán" : "OK", response));
    }

    @GetMapping("/session/{id}")
    public ResponseEntity<ApiResponse<PaymentSessionResponse>> getSession(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(paymentSessionService.getSession(userDetails.getId(), id)));
    }

    /** "Tôi đã chuyển khoản": đối soát ngân hàng ngay rồi trả trạng thái mới. */
    @PostMapping("/session/{id}/check")
    public ResponseEntity<ApiResponse<PaymentSessionResponse>> checkNow(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id
    ) {
        paymentSessionService.getSession(userDetails.getId(), id); // kiểm tra quyền sở hữu trước khi gọi ngân hàng
        reconciliationService.syncIfStale();
        paymentSessionService.expireSession(id);
        return ResponseEntity.ok(ApiResponse.success(paymentSessionService.getSession(userDetails.getId(), id)));
    }

    @PostMapping("/session/{id}/cancel")
    public ResponseEntity<ApiResponse<PaymentSessionResponse>> cancelSession(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success("Đã hủy phiên thanh toán và đơn hàng",
                paymentSessionService.cancelSession(userDetails.getId(), id)));
    }

    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<List<PaymentSessionResponse>>> getMySessions(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(ApiResponse.success(paymentSessionService.getMySessions(userDetails.getId())));
    }

    @GetMapping("/admin/sessions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<PaymentSessionResponse>>> getAllSessions(
            @RequestParam(required = false) PaymentSession.Status status
    ) {
        return ResponseEntity.ok(ApiResponse.success(paymentSessionService.getAllSessions(status)));
    }

    @GetMapping("/admin/bank-transactions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<BankTransactionResponse>>> getBankTransactions() {
        return ResponseEntity.ok(ApiResponse.success(paymentSessionService.getBankTransactions()));
    }

    @PostMapping("/admin/sync")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BankReconciliationService.SyncResult>> syncNow() {
        BankReconciliationService.SyncResult result = reconciliationService.syncNow();
        reconciliationService.expireOverdue(0);
        return ResponseEntity.ok(ApiResponse.success(result.ok() ? "Đối soát xong" : "Đối soát lỗi", result));
    }
}
