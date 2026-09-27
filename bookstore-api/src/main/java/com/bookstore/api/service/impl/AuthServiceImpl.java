package com.bookstore.api.service.impl;

import com.bookstore.api.dto.request.LoginRequest;
import com.bookstore.api.dto.response.AuthResponse;
import com.bookstore.api.entity.User;
import com.bookstore.api.exception.BadRequestException;
import com.bookstore.api.repository.UserRepository;
import com.bookstore.api.security.JwtUtil;
import com.bookstore.api.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadRequestException("Sai username hoặc password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Sai username hoặc password");
        }

        if (user.getStatus() != User.Status.ACTIVE) {
            throw new BadRequestException("Tài khoản đã bị khóa");
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .username(user.getUsername())
                .role(user.getRole().name())
                .userId(user.getId())
                .build();
    }
}