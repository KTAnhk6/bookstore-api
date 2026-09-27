package com.bookstore.api.service;

import com.bookstore.api.dto.response.UserResponse;
import java.util.List;

public interface UserService {
    List<UserResponse> getAll();
    UserResponse updateRole(Long userId, String role);
    UserResponse updateStatus(Long userId, String status);
}