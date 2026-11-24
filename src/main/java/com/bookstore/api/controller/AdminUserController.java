package com.bookstore.api.controller;

import com.bookstore.api.common.ApiResponse;
import com.bookstore.api.common.PaginationMetadata;
import com.bookstore.api.common.SortParams;
import com.bookstore.api.dto.request.UpdateUserRoleRequest;
import com.bookstore.api.dto.response.UserResponse;
import com.bookstore.api.entity.User;
import com.bookstore.api.exception.BadRequestException;
import com.bookstore.api.security.CustomUserDetails;
import com.bookstore.api.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    // Cột bảng admin -> thuộc tính entity được phép sắp xếp
    private static final Map<String, String> SORT_FIELDS = Map.of(
            "name", "fullName", "email", "email", "phone", "phone",
            "createdAt", "createdAt", "role", "role", "status", "status");

    private final UserService userService;

    @GetMapping
    public ApiResponse<List<UserResponse>> getAll(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) User.Role role,
            @RequestParam(required = false) User.Status status,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Sort sort = SortParams.parse(sortBy, SORT_FIELDS, Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id")));
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 100), sort);
        Page<UserResponse> userPage = userService.searchForAdmin(keyword, role, status, pageable);
        return ApiResponse.success("Lấy danh sách người dùng thành công", userPage.getContent(), PaginationMetadata.fromPage(userPage));
    }

    @PutMapping("/{id}/role")
    public ApiResponse<UserResponse> updateRole(@PathVariable Long id,
                                                @Valid @RequestBody UpdateUserRoleRequest request,
                                                @AuthenticationPrincipal CustomUserDetails me) {
        rejectSelf(id, me);
        return ApiResponse.success("Cập nhật role thành công",
                userService.updateRole(id, request.getRole()));
    }

    @PutMapping("/{id}/status")
    public ApiResponse<UserResponse> updateStatus(@PathVariable Long id,
                                                  @RequestParam String status,
                                                  @AuthenticationPrincipal CustomUserDetails me) {
        rejectSelf(id, me);
        return ApiResponse.success("Cập nhật trạng thái thành công",
                userService.updateStatus(id, status));
    }

    // Giống giao diện admin: không tự đổi quyền / tự khoá chính mình (tránh mất quyền quản trị)
    private static void rejectSelf(Long id, CustomUserDetails me) {
        if (id.equals(me.getId())) {
            throw new BadRequestException("Bạn không thể đổi quyền hay khoá chính mình");
        }
    }
}
