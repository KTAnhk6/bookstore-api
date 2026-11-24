package com.bookstore.api.dto.response;

import com.bookstore.api.entity.PaymentSession;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentSessionResponse {

    private Long sessionId;
    private PaymentSession.Status status;
    private Long orderId;
    private String orderCode;
    private List<String> items;

    // Thông tin chuyển khoản
    private String bankBin;
    private String bankName;
    private String accountNo;
    private String accountName;
    private BigDecimal amount;
    private BigDecimal receivedAmount;
    private String paymentCode;      // nội dung chuyển khoản bắt buộc
    private String qrPayload;        // chuỗi VietQR (EMVCo)
    private String qrImage;          // data:image/png;base64,...

    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private long remainingSeconds;
    private LocalDateTime paidAt;
    private String bankRefNo;
    private String cancelReason;
}
