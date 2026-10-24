package com.bookstore.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublisherRequest {

    @NotBlank(message = "Tên nhà xuất bản không được để trống")
    private String name;

    private String slug;
    private String address;
    private String phone;
    private String email;
    private String website;
    private String logo;
    private String description;
}
