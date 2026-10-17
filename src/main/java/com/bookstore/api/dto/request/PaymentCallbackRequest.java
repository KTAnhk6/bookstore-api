package com.bookstore.api.dto.request;

import com.bookstore.api.entity.Order;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentCallbackRequest {

    private Long orderId;

    private String orderCode;

    @NotBlank(message = "Mã giao dịch không được để trống")
    private String transactionCode;

    private BigDecimal amount;

    private Order.PaymentStatus status;

    private String responseCode; // e.g., "00" for success

    private String bankCode;

    private String notes;

    private String signature;
}
