package com.bookstore.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class AuthorRequest {

    @NotBlank(message = "Tên tác giả không được để trống")
    private String name;

    private String bio;
    private String avatar;
    private String nationality;
    private Integer birthYear;
    private Integer deathYear;
}