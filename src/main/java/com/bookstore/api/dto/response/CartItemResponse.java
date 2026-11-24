package com.bookstore.api.dto.response;

import com.bookstore.api.entity.Cart;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItemResponse {

    private Long id;
    private Long bookId;
    private String bookTitle;
    private String bookSlug;
    private String bookCoverImage;
    private String authorName;
    private BigDecimal originalPrice;
    private BigDecimal salePrice;
    private Integer discountPercent;
    private Integer quantity;
    private BigDecimal subtotal;
    private Integer stockQuantity;
    private Boolean inStock;

    public static CartItemResponse fromEntity(Cart cart) {
        if (cart == null) return null;
        BigDecimal originalPrice = cart.getBook().getPrice();
        BigDecimal salePrice = cart.getBook().getSalePrice();
        BigDecimal effectivePrice = (salePrice != null && salePrice.compareTo(BigDecimal.ZERO) > 0) ? salePrice : originalPrice;
        if (effectivePrice == null) {
            effectivePrice = BigDecimal.ZERO;
        }
        BigDecimal itemSubtotal = effectivePrice.multiply(BigDecimal.valueOf(cart.getQuantity()));
        boolean inStock = cart.getBook().getStockQuantity() >= cart.getQuantity() && cart.getBook().getStatus() == com.bookstore.api.entity.Book.Status.AVAILABLE;

        int discountPercent = 0;
        if (salePrice != null && originalPrice != null && originalPrice.compareTo(BigDecimal.ZERO) > 0 && originalPrice.compareTo(salePrice) > 0) {
            discountPercent = originalPrice.subtract(salePrice)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(originalPrice, 0, java.math.RoundingMode.HALF_UP)
                    .intValue();
        }

        return CartItemResponse.builder()
                .id(cart.getId())
                .bookId(cart.getBook().getId())
                .bookTitle(cart.getBook().getTitle())
                .bookSlug(cart.getBook().getSlug())
                .bookCoverImage(cart.getBook().getCoverImage())
                .authorName((cart.getBook().getAuthors() != null && !cart.getBook().getAuthors().isEmpty()) ? cart.getBook().getAuthors().iterator().next().getAuthor().getName() : null)
                .originalPrice(originalPrice)
                .salePrice(salePrice)
                .discountPercent(discountPercent)
                .quantity(cart.getQuantity())
                .subtotal(itemSubtotal)
                .stockQuantity(cart.getBook().getStockQuantity())
                .inStock(inStock)
                .build();
    }
}
