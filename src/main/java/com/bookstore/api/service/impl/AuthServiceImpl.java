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
import com.bookstore.api.service.MailService;
import com.bookstore.api.service.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final MailService mailService;
    private final RefreshTokenService refreshTokenService;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String trimmedUsername = request.getUsername() != null ? request.getUsername().trim().toLowerCase() : "";
        String trimmedEmail = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";

        if (userRepository.existsByUsername(trimmedUsername) || userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Tên đăng nhập '" + request.getUsername() + "' đã được sử dụng");
        }

        if (userRepository.existsByEmail(trimmedEmail) || userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email '" + request.getEmail() + "' đã được sử dụng");
        }

        if (request.getPhone() != null && !request.getPhone().trim().isEmpty()
                && userRepository.existsByPhone(request.getPhone().trim())) {
            throw new BadRequestException("Số điện thoại '" + request.getPhone() + "' đã được sử dụng bởi tài khoản khác");
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

        return buildAuthResponse(user, refreshTokenService.issue(user));
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        String input = request.getUsernameOrEmail().trim();

        User user = userRepository.findByUsernameOrEmail(input, input)
                .orElseThrow(() -> new BadRequestException("Sai tên đăng nhập hoặc mật khẩu"));

        // Kiểm tra mật khẩu trước: người không biết mật khẩu không dò được tài khoản nào bị khóa
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Sai tên đăng nhập hoặc mật khẩu");
        }

        if (user.getStatus() == User.Status.BANNED) {
            throw new BadRequestException("Tài khoản của bạn đã bị khóa");
        }

        if (user.getStatus() == User.Status.INACTIVE) {
            throw new BadRequestException("Tài khoản của bạn chưa được kích hoạt");
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        return buildAuthResponse(user, refreshTokenService.issue(user));
    }

    @Override
    @Transactional
    public AuthResponse refresh(String refreshToken) {
        RefreshTokenService.Rotation rotation = refreshTokenService.rotate(refreshToken);
        return buildAuthResponse(rotation.user(), rotation.refreshToken());
    }

    @Override
    public void logout(String refreshToken) {
        refreshTokenService.revoke(refreshToken);
    }

    @Override
    public void logoutAll(Long userId) {
        refreshTokenService.revokeAll(userId);
    }

    private AuthResponse buildAuthResponse(User user, String refreshToken) {
        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getEmail(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .user(UserResponse.fromEntity(user))
                .build();
    }

    @Override
    @Transactional
    public String forgotPassword(ForgotPasswordRequest request) {
        String input = request.getEmailOrUsername().trim();
        // Trả cùng một thông báo dù có tài khoản hay không, tránh bị dò email/username
        User user = userRepository.findByUsernameOrEmail(input, input).orElse(null);
        if (user == null) {
            return FORGOT_PASSWORD_MESSAGE;
        }

        passwordResetTokenRepository.invalidateUnusedByUserId(user.getId());
        String resetToken = generateResetToken();

        PasswordResetToken tokenEntity = PasswordResetToken.builder()
                .user(user)
                .token(resetToken)
                .expiredAt(LocalDateTime.now().plusHours(1))
                .used(false)
                .build();
        passwordResetTokenRepository.save(tokenEntity);

        mailService.send(user.getEmail(), "[BookNest] Mã đặt lại mật khẩu",
                "Xin chào " + (user.getFullName() != null ? user.getFullName() : user.getUsername()) + ",\n\n"
                        + "Mã đặt lại mật khẩu của bạn là: " + resetToken + "\n"
                        + "Mã có hiệu lực trong 1 giờ và chỉ dùng được một lần.\n\n"
                        + "Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.");
        return FORGOT_PASSWORD_MESSAGE;
    }

    private static final String FORGOT_PASSWORD_MESSAGE =
            "Nếu thông tin khớp với một tài khoản, mã đặt lại mật khẩu đã được gửi tới email của tài khoản đó";
    private static final int RESET_TOKEN_LENGTH = 6;
    private static final int MAX_RESET_TOKEN_ATTEMPTS = 5;
    private static final SecureRandom RANDOM = new SecureRandom();

    private String generateResetToken() {
        String resetToken;
        do {
            int value = RANDOM.nextInt(1_000_000);
            StringBuilder code = new StringBuilder(RESET_TOKEN_LENGTH);
            for (int divisor = 100_000; divisor > 0; divisor /= 10) {
                code.append((char) ('0' + (value / divisor) % 10));
            }
            resetToken = code.toString();
        } while (passwordResetTokenRepository.existsByToken(resetToken));
        return resetToken;
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String input = request.getEmailOrUsername().trim();
        User user = userRepository.findByUsernameOrEmail(input, input)
                .orElseThrow(() -> new BadRequestException("Mã xác thực không hợp lệ hoặc đã hết hạn"));
        PasswordResetToken tokenEntity = passwordResetTokenRepository
                .findFirstByUserIdAndUsedFalseOrderByIdDesc(user.getId())
                .orElseThrow(() -> new BadRequestException("Mã xác thực không hợp lệ hoặc đã hết hạn"));

        if (tokenEntity.getUsed() || tokenEntity.getExpiredAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Mã xác thực đã hết hạn, vui lòng yêu cầu lại");
        }

        if (tokenEntity.getFailedAttempts() >= MAX_RESET_TOKEN_ATTEMPTS) {
            throw new BadRequestException("Mã xác thực không hợp lệ hoặc đã hết hạn");
        }

        if (!tokenEntity.getToken().equals(request.getToken().trim())) {
            int failedAttempts = tokenEntity.getFailedAttempts() + 1;
            tokenEntity.setFailedAttempts(failedAttempts);
            if (failedAttempts >= MAX_RESET_TOKEN_ATTEMPTS) {
                tokenEntity.setUsed(true);
            }
            passwordResetTokenRepository.save(tokenEntity);
            throw new BadRequestException("Mã xác thực không hợp lệ hoặc đã hết hạn");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Mật khẩu mới phải khác mật khẩu hiện tại");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        
        tokenEntity.setUsed(true);
        passwordResetTokenRepository.save(tokenEntity);

        // Đổi mật khẩu qua email thì đăng xuất mọi thiết bị (phòng trường hợp tài khoản bị chiếm)
        refreshTokenService.revokeAll(user.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        return UserResponse.fromEntity(user);
    }
}
