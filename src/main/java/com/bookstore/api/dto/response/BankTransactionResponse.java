package com.bookstore.api.dto.response;

import com.bookstore.api.entity.BankTransaction;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankTransactionResponse {

    private Long id;
    private String refNo;
    private BigDecimal amount;
    private String description;
    private LocalDateTime transactionDate;
    private Long sessionId;
    private String paymentCode;
    private String orderCode;
    private BankTransaction.Result result;
    private String note;
    private LocalDateTime createdAt;

    public static BankTransactionResponse fromEntity(BankTransaction tx) {
        return BankTransactionResponse.builder()
                .id(tx.getId())
                .refNo(tx.getRefNo())
                .amount(tx.getAmount())
                .description(tx.getDescription())
                .transactionDate(tx.getTransactionDate())
                .sessionId(tx.getSession().getId())
                .paymentCode(tx.getSession().getPaymentCode())
                .orderCode(tx.getSession().getOrder().getOrderCode())
                .result(tx.getResult())
                .note(tx.getNote())
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
