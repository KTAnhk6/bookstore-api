package com.bookstore.api.service;

import com.bookstore.api.dto.request.*;
import com.bookstore.api.dto.response.AuthResponse;
import com.bookstore.api.dto.response.UserResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    String forgotPassword(ForgotPasswordRequest request);

    void resetPassword(ResetPasswordRequest request);

    UserResponse getCurrentUser(String username);
}
