package com.bookstore.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResetPasswordRequest {

    @NotBlank(message = "Email hoặc tên đăng nhập không được để trống")
    private String emailOrUsername;

    @NotBlank(message = "Mã xác nhận không được để trống")
    @Pattern(regexp = "\\d{6}", message = "Mã xác nhận phải gồm đúng 6 chữ số")
    private String token;

    @NotBlank(message = "Mật khẩu mới không được để trống")
    @Size(min = 6, message = "Mật khẩu mới phải từ 6 ký tự trở lên")
    private String newPassword;
}
