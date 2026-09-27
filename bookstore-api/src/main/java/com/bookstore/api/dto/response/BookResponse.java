package com.bookstore.api.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BookResponse {
    private Long id;
    private String title;
    private String slug;
    private String isbn;
    private String description;
    private String coverImage;
    private String publisherName;
    private Integer publishYear;
    private Integer pageCount;
    private String language;
    private BigDecimal price;
    private BigDecimal salePrice;
    private Integer stockQuantity;
    private Integer soldQuantity;
    private String status;
    private List<CategoryResponse> categories;
    private LocalDateTime createdAt;
}