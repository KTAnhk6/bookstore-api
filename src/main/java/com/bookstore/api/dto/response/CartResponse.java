package com.bookstore.api.dto.response;

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

    public static CartResponse fromItems(List<CartItemResponse> items) {
        int totalItems = items.stream().mapToInt(CartItemResponse::getQuantity).sum();
        BigDecimal subtotal = items.stream()
                .map(CartItemResponse::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Free shipping for orders over 300,000 VND
        BigDecimal shippingFee = (subtotal.compareTo(new BigDecimal("300000")) >= 0 || subtotal.compareTo(BigDecimal.ZERO) == 0)
                ? BigDecimal.ZERO
                : new BigDecimal("30000");

        BigDecimal totalAmount = subtotal.add(shippingFee);

        return CartResponse.builder()
                .items(items)
                .totalItems(totalItems)
                .subtotal(subtotal)
                .estimatedShippingFee(shippingFee)
                .totalAmount(totalAmount)
                .build();
    }
}
