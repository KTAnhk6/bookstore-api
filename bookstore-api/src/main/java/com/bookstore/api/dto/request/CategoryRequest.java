package com.bookstore.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CategoryRequest {

    @NotBlank(message = "Tên thể loại không được để trống")
    private String name;

    private Long parentId;
    private String description;
    private String image;
    private Integer sortOrder;
}