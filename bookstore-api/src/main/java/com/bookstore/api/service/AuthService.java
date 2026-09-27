package com.bookstore.api.service;

import com.bookstore.api.dto.request.LoginRequest;
import com.bookstore.api.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse login(LoginRequest request);
}