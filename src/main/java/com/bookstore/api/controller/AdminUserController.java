package com.bookstore.api.controller;

import com.bookstore.api.common.ApiResponse;
import com.bookstore.api.dto.request.UpdateUserRoleRequest;
import com.bookstore.api.dto.response.UserResponse;
import com.bookstore.api.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserService userService;

    @GetMapping
    public ApiResponse<List<UserResponse>> getAll() {
        return ApiResponse.success(userService.getAll());
    }

    @PutMapping("/{id}/role")
    public ApiResponse<UserResponse> updateRole(@PathVariable Long id,
                                                @Valid @RequestBody UpdateUserRoleRequest request) {
        return ApiResponse.success("Cập nhật role thành công",
                userService.updateRole(id, request.getRole()));
    }

    @PutMapping("/{id}/status")
    public ApiResponse<UserResponse> updateStatus(@PathVariable Long id,
                                                  @RequestParam String status) {
        return ApiResponse.success("Cập nhật trạng thái thành công",
                userService.updateStatus(id, status));
    }
}