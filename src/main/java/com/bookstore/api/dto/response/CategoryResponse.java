package com.bookstore.api.dto.response;

import com.bookstore.api.entity.Category;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryResponse {

    private Long id;
    private String name;
    private String slug;
    private String description;
    private String icon;
    private String image;
    private Integer displayOrder;
    private Boolean active;
    private Long parentId;
    private String parentName;
    private java.util.List<CategoryResponse> children;
    private LocalDateTime createdAt;

    public static CategoryResponse fromEntity(Category category) {
        if (category == null) return null;
        Long pId = category.getParent() != null ? category.getParent().getId() : null;
        String pName = category.getParent() != null ? category.getParent().getName() : null;
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .description(category.getDescription())
                .icon(category.getIcon())
                .image(category.getImage())
                .displayOrder(category.getDisplayOrder())
                .active(category.getActive())
                .parentId(pId)
                .parentName(pName)
                .createdAt(category.getCreatedAt())
                .build();
    }
}
