package com.bookstore.api.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuthResponse {
    private String token;
    private String tokenType = "Bearer";
    private String username;
    private String role;
    private Long userId;
}