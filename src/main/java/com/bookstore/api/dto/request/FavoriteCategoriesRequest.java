package com.bookstore.api.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FavoriteCategoriesRequest {

    @NotEmpty(message = "Danh sách thể loại yêu thích không được để trống")
    @Size(min = 1, max = 5, message = "Vui lòng chọn từ 1 đến 5 thể loại yêu thích")
    private List<Long> categoryIds;
}
