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
        BigDecimal price = cart.getBook().getSalePrice();
        BigDecimal itemSubtotal = price.multiply(BigDecimal.valueOf(cart.getQuantity()));
        boolean inStock = cart.getBook().getStockQuantity() >= cart.getQuantity() && cart.getBook().getStatus() == com.bookstore.api.entity.Book.Status.AVAILABLE;

        return CartItemResponse.builder()
                .id(cart.getId())
                .bookId(cart.getBook().getId())
                .bookTitle(cart.getBook().getTitle())
                .bookSlug(cart.getBook().getSlug())
                .bookCoverImage(cart.getBook().getCoverImage())
                .authorName((cart.getBook().getAuthors() != null && !cart.getBook().getAuthors().isEmpty()) ? cart.getBook().getAuthors().iterator().next().getAuthor().getName() : null)
                .originalPrice(cart.getBook().getPrice())
                .salePrice(cart.getBook().getSalePrice())
                .discountPercent(0)
                .quantity(cart.getQuantity())
                .subtotal(itemSubtotal)
                .stockQuantity(cart.getBook().getStockQuantity())
                .inStock(inStock)
                .build();
    }
}
