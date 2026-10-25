package com.bookstore.api.controller;

import com.bookstore.api.common.ApiResponse;
import com.bookstore.api.config.PaymentQrProperties;
import com.bookstore.api.dto.bank.BankHistoryResponse;
import com.bookstore.api.dto.request.MockTransferRequest;
import com.bookstore.api.exception.BadRequestException;
import com.bookstore.api.service.BankHistoryClient;
import com.bookstore.api.service.MockBankStore;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * NGÂN HÀNG GIẢ LẬP để test không mất tiền thật. Chỉ hoạt động khi chưa đặt BANK_HISTORY_URL.
 * /history trả đúng định dạng API lịch sử giao dịch MB Bank.
 */
@RestController
@RequestMapping("/api/test/mock-bank")
@RequiredArgsConstructor
public class MockBankController {

    private final MockBankStore mockBankStore;
    private final BankHistoryClient bankHistoryClient;
    private final PaymentQrProperties qrProperties;

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> status() {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "mode", bankHistoryClient.isMockMode() ? "MOCK" : "REAL",
                "bankName", qrProperties.getBankName(),
                "accountNo", qrProperties.getAccountNo(),
                "accountName", qrProperties.getAccountName(),
                "sessionMinutes", qrProperties.getSessionMinutes())));
    }

    /** Giả lập khách chuyển khoản vào tài khoản nhận tiền. */
    @PostMapping("/transfer")
    public ResponseEntity<ApiResponse<BankHistoryResponse.Tran>> transfer(@Valid @RequestBody MockTransferRequest request) {
        requireMockMode();
        BankHistoryResponse.Tran tran = mockBankStore.addIncoming(qrProperties.getAccountNo(),
                request.getAmount(), request.getSenderName(), request.getDescription());
        return ResponseEntity.ok(ApiResponse.success("Đã ghi nhận chuyển khoản giả lập, server sẽ đối soát trong giây lát", tran));
    }

    @GetMapping("/history")
    public BankHistoryResponse history() {
        requireMockMode();
        return new BankHistoryResponse("success", "Thành công", mockBankStore.list());
    }

    @DeleteMapping("/history")
    public ResponseEntity<ApiResponse<Void>> clear() {
        requireMockMode();
        mockBankStore.clear();
        return ResponseEntity.ok(ApiResponse.success("Đã xóa sao kê giả lập", null));
    }

    private void requireMockMode() {
        if (!bankHistoryClient.isMockMode()) {
            throw new BadRequestException("Server đang đối soát với ngân hàng thật (BANK_HISTORY_URL), ngân hàng giả lập bị tắt");
        }
    }
}
