package com.bookstore.api.service.impl;

import com.bookstore.api.dto.request.ForgotPasswordRequest;
import com.bookstore.api.dto.request.LoginRequest;
import com.bookstore.api.dto.request.RegisterRequest;
import com.bookstore.api.dto.request.ResetPasswordRequest;
import com.bookstore.api.dto.response.AuthResponse;
import com.bookstore.api.dto.response.UserResponse;
import com.bookstore.api.entity.User;
import com.bookstore.api.exception.BadRequestException;
import com.bookstore.api.exception.ResourceNotFoundException;
import com.bookstore.api.repository.UserRepository;
import com.bookstore.api.repository.PasswordResetTokenRepository;
import com.bookstore.api.entity.PasswordResetToken;
import com.bookstore.api.security.JwtUtil;
import com.bookstore.api.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Tên đăng nhập '" + request.getUsername() + "' đã được sử dụng");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email '" + request.getEmail() + "' đã được sử dụng");
        }

        User user = User.builder()
                .username(request.getUsername().trim().toLowerCase())
                .email(request.getEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .phone(request.getPhone())
                .gender(request.getGender())
                .birthday(request.getBirthday())
                .avatar(request.getAvatar())
                .role(User.Role.CUSTOMER)
                .status(User.Status.ACTIVE)
                .loyaltyPoints(0)
                .hasSetPreferences(false)
                .build();

        user = userRepository.save(user);

        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getEmail(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(UserResponse.fromEntity(user))
                .build();
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        String input = request.getUsernameOrEmail().trim();

        User user = userRepository.findByUsernameOrEmail(input, input)
                .orElseThrow(() -> new BadRequestException("Sai tên đăng nhập hoặc mật khẩu"));

        if (user.getStatus() == User.Status.BANNED) {
            throw new BadRequestException("Tài khoản của bạn đã bị khóa");
        }

        if (user.getStatus() == User.Status.INACTIVE) {
            throw new BadRequestException("Tài khoản của bạn chưa được kích hoạt");
        }

        // Authenticate credentials
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getUsername(), request.getPassword())
        );

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getEmail(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(UserResponse.fromEntity(user))
                .build();
    }

    @Override
    @Transactional
    public String forgotPassword(ForgotPasswordRequest request) {
        String input = request.getEmailOrUsername().trim();
        User user = userRepository.findByUsernameOrEmail(input, input)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với thông tin đã cung cấp"));

        String resetToken = UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
        
        PasswordResetToken tokenEntity = PasswordResetToken.builder()
                .user(user)
                .token(resetToken)
                .expiredAt(LocalDateTime.now().plusHours(1))
                .used(false)
                .build();
        passwordResetTokenRepository.save(tokenEntity);

        log.info("Reset password token for user {}: {}", user.getUsername(), resetToken);
        return resetToken;
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken tokenEntity = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new BadRequestException("Mã xác thực không hợp lệ hoặc đã hết hạn"));

        if (tokenEntity.getUsed() || tokenEntity.getExpiredAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Mã xác thực đã hết hạn, vui lòng yêu cầu lại");
        }

        User user = tokenEntity.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        
        tokenEntity.setUsed(true);
        passwordResetTokenRepository.save(tokenEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        return UserResponse.fromEntity(user);
    }
}
