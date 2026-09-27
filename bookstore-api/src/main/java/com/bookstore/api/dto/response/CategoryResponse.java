package com.bookstore.api.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CategoryResponse {
    private Long id;
    private String name;
    private String slug;
    private Long parentId;
    private String description;
    private String image;
    private Integer sortOrder;
    private String status;
}