package com.bookstore.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class PublisherRequest {

    @NotBlank(message = "Tên NXB không được để trống")
    private String name;

    private String address;
    private String phone;
    private String email;
    private String website;
    private String logo;
    private String description;
}