package com.bookstore.api.dto.request;

import com.bookstore.api.entity.User;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProfileRequest {

    @NotBlank(message = "Họ và tên không được để trống")
    private String fullName;

    private String phone;
    private User.Gender gender;
    private LocalDate birthday;
    private String avatar;
}
