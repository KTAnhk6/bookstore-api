package com.bookstore.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CancelOrderRequest {

    @NotBlank(message = "Lý do hủy đơn hàng không được để trống")
    private String reason;
}
