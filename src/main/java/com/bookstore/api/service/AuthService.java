package com.bookstore.api.service;

import com.bookstore.api.dto.request.*;
import com.bookstore.api.dto.response.AuthResponse;
import com.bookstore.api.dto.response.UserResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    /** Tạo mã đặt lại mật khẩu và gửi tới email tài khoản; trả về thông báo cho người dùng (không chứa mã). */
    String forgotPassword(ForgotPasswordRequest request);

    void resetPassword(ResetPasswordRequest request);

    UserResponse getCurrentUser(String username);

    /** Đổi refresh token lấy access token + refresh token mới. */
    AuthResponse refresh(String refreshToken);

    void logout(String refreshToken);

    void logoutAll(Long userId);
}
