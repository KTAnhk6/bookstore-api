package com.bookstore.api.dto.response;

import com.bookstore.api.common.ShippingFeeCalculator;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartResponse {

    private List<CartItemResponse> items;
    private int totalItems;
    private BigDecimal subtotal;
    private BigDecimal estimatedShippingFee;
    private BigDecimal totalAmount;

    /**
     * province: tỉnh của địa chỉ mặc định để ước tính phí ship; null khi chưa có địa chỉ
     * -> estimatedShippingFee = null (trừ khi đủ điều kiện miễn phí), tính ở bước thanh toán.
     */
    public static CartResponse fromItems(List<CartItemResponse> items, String province) {
        int totalItems = items.stream().mapToInt(CartItemResponse::getQuantity).sum();
        BigDecimal subtotal = items.stream()
                .map(CartItemResponse::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal shippingFee = ShippingFeeCalculator.calculate(subtotal, province);
        if (province == null && shippingFee.signum() > 0) {
            shippingFee = null;
        }

        BigDecimal totalAmount = shippingFee == null ? subtotal : subtotal.add(shippingFee);

        return CartResponse.builder()
                .items(items)
                .totalItems(totalItems)
                .subtotal(subtotal)
                .estimatedShippingFee(shippingFee)
                .totalAmount(totalAmount)
                .build();
    }
}
