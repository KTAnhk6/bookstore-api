package com.bookstore.api.service;

import com.bookstore.api.dto.request.ChangePasswordRequest;
import com.bookstore.api.dto.request.FavoriteCategoriesRequest;
import com.bookstore.api.dto.request.UpdateProfileRequest;
import com.bookstore.api.dto.response.CategoryResponse;
import com.bookstore.api.dto.response.UserResponse;
import com.bookstore.api.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface UserService {

    UserResponse getProfile(Long userId);

    UserResponse updateProfile(Long userId, UpdateProfileRequest request);

    void changePassword(Long userId, ChangePasswordRequest request);

    List<CategoryResponse> saveFavoriteCategories(Long userId, FavoriteCategoriesRequest request);

    List<CategoryResponse> getFavoriteCategories(Long userId);

    Page<UserResponse> searchForAdmin(String keyword, User.Role role, User.Status status, Pageable pageable);

    UserResponse updateRole(Long userId, String role);

    UserResponse updateStatus(Long userId, String status);
}
