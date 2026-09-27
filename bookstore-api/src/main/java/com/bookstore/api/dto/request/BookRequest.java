package com.bookstore.api.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class BookRequest {

    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;

    private String description;
    private String coverImage;

    private Long publisherId;
    private Integer publishYear;
    private Integer pageCount;
    private String language;
    private String dimensions;
    private Integer weight;

    @NotNull(message = "Giá không được để trống")
    @Positive(message = "Giá phải > 0")
    private BigDecimal price;

    private BigDecimal salePrice;
    private Integer stockQuantity;

    /** Danh sách ID thể loại — phần tử đầu là thể loại chính */
    private List<Long> categoryIds;
}