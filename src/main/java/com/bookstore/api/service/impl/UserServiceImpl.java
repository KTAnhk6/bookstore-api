package com.bookstore.api.service.impl;

import com.bookstore.api.dto.request.ChangePasswordRequest;
import com.bookstore.api.dto.request.FavoriteCategoriesRequest;
import com.bookstore.api.dto.request.UpdateProfileRequest;
import com.bookstore.api.dto.response.CategoryResponse;
import com.bookstore.api.dto.response.UserResponse;
import com.bookstore.api.entity.Category;
import com.bookstore.api.entity.User;
import com.bookstore.api.entity.UserFavoriteCategory;
import com.bookstore.api.exception.BadRequestException;
import com.bookstore.api.exception.ResourceNotFoundException;
import com.bookstore.api.repository.CategoryRepository;
import com.bookstore.api.repository.UserFavoriteCategoryRepository;
import com.bookstore.api.repository.UserRepository;
import com.bookstore.api.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final UserFavoriteCategoryRepository favoriteCategoryRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public UserResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return UserResponse.fromEntity(user);
    }

    @Override
    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setFullName(request.getFullName().trim());
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim());
        }
        if (request.getGender() != null) {
            user.setGender(request.getGender());
        }
        if (request.getBirthday() != null) {
            user.setBirthday(request.getBirthday());
        }
        if (request.getAvatar() != null) {
            user.setAvatar(request.getAvatar());
        }

        user = userRepository.save(user);
        return UserResponse.fromEntity(user);
    }

    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Mật khẩu hiện tại không chính xác");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    @Transactional
    public List<CategoryResponse> saveFavoriteCategories(Long userId, FavoriteCategoriesRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        List<Long> categoryIds = request.getCategoryIds();
        if (categoryIds == null || categoryIds.isEmpty() || categoryIds.size() > 5) {
            throw new BadRequestException("Vui lòng chọn từ 1 đến 5 thể loại yêu thích");
        }

        // Validate categories exist
        List<Category> categories = categoryRepository.findByIdIn(categoryIds);
        if (categories.size() != categoryIds.size()) {
            throw new BadRequestException("Một hoặc nhiều thể loại không tồn tại");
        }

        // Remove old preferences
        favoriteCategoryRepository.deleteByUserId(userId);

        // Save new preferences
        List<UserFavoriteCategory> favoriteList = new ArrayList<>();
        for (int i = 0; i < categories.size(); i++) {
            UserFavoriteCategory ufc = UserFavoriteCategory.builder()
                    .user(user)
                    .category(categories.get(i))
                    .sortOrder(i)
                    .build();
            favoriteList.add(ufc);
        }
        favoriteCategoryRepository.saveAll(favoriteList);

        // Update user state
        user.setHasSetPreferences(true);
        user.setPreferencesUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        return categories.stream()
                .map(CategoryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getFavoriteCategories(Long userId) {
        List<UserFavoriteCategory> favorites = favoriteCategoryRepository.findByUserId(userId);
        return favorites.stream()
                .map(fav -> CategoryResponse.fromEntity(fav.getCategory()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAll() {
        return userRepository.findAll().stream()
                .map(UserResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UserResponse updateRole(Long userId, String role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        try {
            user.setRole(User.Role.valueOf(role.trim().toUpperCase()));
        } catch (Exception e) {
            throw new BadRequestException("Role không hợp lệ: " + role);
        }
        user = userRepository.save(user);
        return UserResponse.fromEntity(user);
    }

    @Override
    @Transactional
    public UserResponse updateStatus(Long userId, String status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        try {
            user.setStatus(User.Status.valueOf(status.trim().toUpperCase()));
        } catch (Exception e) {
            throw new BadRequestException("Status không hợp lệ: " + status);
        }
        user = userRepository.save(user);
        return UserResponse.fromEntity(user);
    }
}
