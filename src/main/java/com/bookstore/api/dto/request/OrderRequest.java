package com.bookstore.api.dto.request;

import com.bookstore.api.entity.Order;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderRequest {

    // Can use saved address or enter custom address
    private Long addressId;

    private String recipientName;
    private String phone;
    private String province;
    private String district;
    private String ward;
    private String detailAddress;

    private String note;

    @NotNull(message = "Phương thức thanh toán không được để trống")
    @Builder.Default
    private Order.PaymentMethod paymentMethod = Order.PaymentMethod.COD;

    private String couponCode;

    @Builder.Default
    private Integer usePoints = 0;

    // Direct purchase or specific items checkout. If empty/null, items are taken from user's active Cart
    private List<CartRequest> directItems;
}
