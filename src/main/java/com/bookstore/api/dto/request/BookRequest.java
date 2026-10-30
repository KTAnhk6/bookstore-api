package com.bookstore.api.dto.request;

import com.bookstore.api.entity.Book;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.Set;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookRequest {

    @NotBlank(message = "Tựa sách không được để trống")
    private String title;

    private String slug;
    private String isbn;
    private String description;

    @NotNull(message = "Giá gốc không được để trống")
    private BigDecimal price;

    private BigDecimal salePrice;

    @NotNull(message = "Số lượng tồn kho không được để trống")
    private Integer stockQuantity;

    private Integer publishYear;
    private Integer pageCount;
    private String dimensions;
    private Integer weight;
    private String language;
    private String coverImage;

    private List<Long> authorIds;
    private Long publisherId;
    
    private Long primaryCategoryId;
    private List<Long> subCategoryIds;

    @Builder.Default
    private Book.Status status = Book.Status.AVAILABLE;
}
