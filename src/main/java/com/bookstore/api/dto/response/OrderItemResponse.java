package com.bookstore.api.dto.response;

import com.bookstore.api.entity.OrderItem;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItemResponse {

    private Long id;
    private Long bookId;
    private String bookTitle;
    private String bookCoverImage;
    private BigDecimal price;
    private Integer quantity;
    private BigDecimal subtotal;

    public static OrderItemResponse fromEntity(OrderItem item) {
        if (item == null) return null;
        return OrderItemResponse.builder()
                .id(item.getId())
                .bookId(item.getBook() != null ? item.getBook().getId() : null)
                .bookTitle(item.getBookTitle())
                .bookCoverImage(item.getBookCoverImage())
                .price(item.getPrice())
                .quantity(item.getQuantity())
                .subtotal(item.getSubtotal())
                .build();
    }
}
