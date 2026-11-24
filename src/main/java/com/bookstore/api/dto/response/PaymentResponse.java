package com.bookstore.api.dto.response;

import com.bookstore.api.entity.Order;
import com.bookstore.api.entity.Payment;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponse {

    private Long id;
    private Long orderId;
    private String orderCode;
    private BigDecimal amount;
    private Order.PaymentMethod paymentMethod;
    private Order.PaymentStatus status;
    private String transactionCode;
    private String paymentUrl;
    private LocalDateTime paymentDate;
    private String notes;
    private LocalDateTime createdAt;

    public static PaymentResponse fromEntity(Payment payment) {
        if (payment == null) return null;
        return PaymentResponse.builder()
                .id(payment.getId())
                .orderId(payment.getOrder() != null ? payment.getOrder().getId() : null)
                .orderCode(payment.getOrder() != null ? payment.getOrder().getOrderCode() : null)
                .amount(payment.getAmount())
                .paymentMethod(payment.getMethod())
                .status(payment.getStatus())
                .transactionCode(payment.getTransactionCode())
                .paymentUrl(payment.getQrCodeUrl())
                .paymentDate(payment.getPaidAt())
                .notes(payment.getNotes())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
