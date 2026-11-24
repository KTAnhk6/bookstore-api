package com.bookstore.api.dto.response;

import com.bookstore.api.entity.User;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private Long id;
    private String username;
    private String email;
    private String phone;
    private String fullName;
    private String avatar;
    private User.Gender gender;
    private LocalDate birthday;
    private User.Role role;
    private Integer loyaltyPoints;
    private Boolean hasSetPreferences;
    private LocalDateTime preferencesUpdatedAt;
    private User.Status status;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;

    public static UserResponse fromEntity(User user) {
        if (user == null) return null;
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .phone(user.getPhone())
                .fullName(user.getFullName())
                .avatar(user.getAvatar())
                .gender(user.getGender())
                .birthday(user.getBirthday())
                .role(user.getRole())
                .loyaltyPoints(user.getLoyaltyPoints())
                .hasSetPreferences(user.getHasSetPreferences())
                .preferencesUpdatedAt(user.getPreferencesUpdatedAt())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .build();
    }
}
