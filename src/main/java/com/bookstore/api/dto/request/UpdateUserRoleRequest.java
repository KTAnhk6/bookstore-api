package com.bookstore.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class UpdateUserRoleRequest {

    @NotBlank(message = "Role không được để trống")
    private String role; // CUSTOMER | STAFF | ADMIN
}