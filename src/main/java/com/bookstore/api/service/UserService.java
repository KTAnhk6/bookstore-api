package com.bookstore.api.service;

import com.bookstore.api.dto.request.ChangePasswordRequest;
import com.bookstore.api.dto.request.FavoriteCategoriesRequest;
import com.bookstore.api.dto.request.UpdateProfileRequest;
import com.bookstore.api.dto.response.CategoryResponse;
import com.bookstore.api.dto.response.UserResponse;

import java.util.List;

public interface UserService {

    UserResponse getProfile(Long userId);

    UserResponse updateProfile(Long userId, UpdateProfileRequest request);

    void changePassword(Long userId, ChangePasswordRequest request);

    List<CategoryResponse> saveFavoriteCategories(Long userId, FavoriteCategoriesRequest request);

    List<CategoryResponse> getFavoriteCategories(Long userId);

    List<UserResponse> getAll();

    UserResponse updateRole(Long userId, String role);

    UserResponse updateStatus(Long userId, String status);
}
