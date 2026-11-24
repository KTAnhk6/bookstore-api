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

    @Size(max = 5, message = "Vui lòng chọn tối đa 5 thể loại yêu thích")
    private List<Long> categoryIds;
}
