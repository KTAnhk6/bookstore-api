package com.bookstore.api.dto.request;

import com.bookstore.api.entity.Order;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentRequest {

    @NotNull(message = "Mã đơn hàng (orderId) không được để trống")
    private Long orderId;

    private Order.PaymentMethod paymentMethod;

    private BigDecimal amount;

    private String bankCode;

    private String notes;

    private String returnUrl;
}
