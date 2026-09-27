package com.bookstore.api.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String phone;
    private String fullName;
    private String avatar;
    private String role;
    private String status;
    private Integer loyaltyPoints;
    private LocalDateTime createdAt;
}