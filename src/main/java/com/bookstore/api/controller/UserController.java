package com.bookstore.api.controller;

import com.bookstore.api.common.ApiResponse;
import com.bookstore.api.dto.request.ChangePasswordRequest;
import com.bookstore.api.dto.request.FavoriteCategoriesRequest;
import com.bookstore.api.dto.request.UpdateProfileRequest;
import com.bookstore.api.dto.response.CategoryResponse;
import com.bookstore.api.dto.response.UserResponse;
import com.bookstore.api.security.CustomUserDetails;
import com.bookstore.api.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getProfile(@AuthenticationPrincipal CustomUserDetails userDetails) {
        UserResponse response = userService.getProfile(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        UserResponse response = userService.updateProfile(userDetails.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin cá nhân thành công", response));
    }

    @PutMapping("/me/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        userService.changePassword(userDetails.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công", null));
    }

    @PostMapping("/me/favorite-categories")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> saveFavoriteCategories(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody FavoriteCategoriesRequest request
    ) {
        List<CategoryResponse> response = userService.saveFavoriteCategories(userDetails.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Đã lưu sở thích thể loại sách thành công", response));
    }

    @GetMapping("/me/favorite-categories")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getFavoriteCategories(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        List<CategoryResponse> response = userService.getFavoriteCategories(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
