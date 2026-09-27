package com.bookstore.api.service.impl;

import com.bookstore.api.dto.response.UserResponse;
import com.bookstore.api.entity.User;
import com.bookstore.api.exception.BadRequestException;
import com.bookstore.api.exception.ResourceNotFoundException;
import com.bookstore.api.repository.UserRepository;
import com.bookstore.api.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public List<UserResponse> getAll() {
        return userRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public UserResponse updateRole(Long userId, String role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));
        try {
            user.setRole(User.Role.valueOf(role.toUpperCase()));
        } catch (Exception e) {
            throw new BadRequestException("Role không hợp lệ");
        }
        return toResponse(userRepository.save(user));
    }

    @Override
    public UserResponse updateStatus(Long userId, String status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));
        try {
            user.setStatus(User.Status.valueOf(status.toUpperCase()));
        } catch (Exception e) {
            throw new BadRequestException("Status không hợp lệ");
        }
        return toResponse(userRepository.save(user));
    }

    private UserResponse toResponse(User u) {
        return UserResponse.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .phone(u.getPhone())
                .fullName(u.getFullName())
                .avatar(u.getAvatar())
                .role(u.getRole().name())
                .status(u.getStatus().name())
                .loyaltyPoints(u.getLoyaltyPoints())
                .createdAt(u.getCreatedAt())
                .build();
    }
}