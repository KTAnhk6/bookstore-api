package com.bookstore.api;

import com.bookstore.api.dto.request.ForgotPasswordRequest;
import com.bookstore.api.dto.request.LoginRequest;
import com.bookstore.api.dto.request.RegisterRequest;
import com.bookstore.api.dto.request.ResetPasswordRequest;
import com.bookstore.api.dto.response.AuthResponse;
import com.bookstore.api.service.RefreshTokenService;
import com.bookstore.api.entity.PasswordResetToken;
import com.bookstore.api.entity.User;
import com.bookstore.api.exception.BadRequestException;
import com.bookstore.api.repository.UserRepository;
import com.bookstore.api.security.JwtUtil;
import com.bookstore.api.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private com.bookstore.api.repository.PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private com.bookstore.api.service.MailService mailService;

    @InjectMocks
    private AuthServiceImpl authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .username("testuser")
                .email("test@example.com")
                .passwordHash("encoded_password")
                .fullName("Test Customer")
                .role(User.Role.CUSTOMER)
                .status(User.Status.ACTIVE)
                .loyaltyPoints(0)
                .hasSetPreferences(false)
                .build();
    }

    @Test
    @DisplayName("Đăng ký tài khoản thành công")
    void register_Success() {
        RegisterRequest request = RegisterRequest.builder()
                .username("testuser")
                .email("test@example.com")
                .password("password123")
                .fullName("Test Customer")
                .build();

        when(userRepository.existsByUsername("testuser")).thenReturn(false);
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded_password");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(jwtUtil.generateToken(1L, "testuser", "test@example.com", "CUSTOMER")).thenReturn("mocked_jwt_token");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("mocked_jwt_token", response.getToken());
        assertEquals("Bearer", response.getTokenType());
        assertEquals("testuser", response.getUser().getUsername());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Đăng ký thất bại khi username trùng lặp")
    void register_DuplicateUsername_ThrowsBadRequest() {
        RegisterRequest request = RegisterRequest.builder()
                .username("testuser")
                .email("test@example.com")
                .password("password123")
                .fullName("Test Customer")
                .build();

        when(userRepository.existsByUsername("testuser")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Đăng nhập thành công với username")
    void login_Success() {
        LoginRequest request = LoginRequest.builder()
                .usernameOrEmail("testuser")
                .password("password123")
                .build();

        when(userRepository.findByUsernameOrEmail("testuser", "testuser")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("password123", "encoded_password")).thenReturn(true);
        when(jwtUtil.generateToken(1L, "testuser", "test@example.com", "CUSTOMER")).thenReturn("mocked_jwt_token");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("mocked_jwt_token", response.getToken());
        assertEquals("testuser", response.getUser().getUsername());
        verify(passwordEncoder, times(1)).matches("password123", "encoded_password");
    }

    @Test
    @DisplayName("Sai mật khẩu với tài khoản bị khóa không lộ trạng thái khóa")
    void login_BannedWrongPassword_GenericMessage() {
        sampleUser.setStatus(User.Status.BANNED);
        LoginRequest request = LoginRequest.builder()
                .usernameOrEmail("testuser")
                .password("wrong")
                .build();

        when(userRepository.findByUsernameOrEmail("testuser", "testuser")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("wrong", "encoded_password")).thenReturn(false);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> authService.login(request));
        assertEquals("Sai tên đăng nhập hoặc mật khẩu", ex.getMessage());
    }

    private PasswordResetToken activeResetCode(String code) {
        return PasswordResetToken.builder()
                .user(sampleUser)
                .token(code)
                .expiredAt(LocalDateTime.now().plusMinutes(15))
                .build();
    }

    private ResetPasswordRequest resetRequest(String code) {
        return ResetPasswordRequest.builder()
                .emailOrUsername("testuser")
                .token(code)
                .newPassword("newpass123")
                .build();
    }

    @Test void forgotPasswordCreatesSixDigitOneHourCode() {
        when(userRepository.findByUsernameOrEmail("testuser", "testuser")).thenReturn(Optional.of(sampleUser));
        authService.forgotPassword(ForgotPasswordRequest.builder().emailOrUsername("testuser").build());
        ArgumentCaptor<PasswordResetToken> saved = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(passwordResetTokenRepository).save(saved.capture());
        verify(passwordResetTokenRepository).invalidateUnusedByUserId(1L);
        assertTrue(saved.getValue().getToken().matches("\\d{6}"));
        assertTrue(saved.getValue().getExpiredAt().isAfter(LocalDateTime.now().plusMinutes(59)));
        assertTrue(saved.getValue().getExpiredAt().isBefore(LocalDateTime.now().plusMinutes(61)));
        verify(mailService).send(eq("test@example.com"), any(), contains(saved.getValue().getToken()));
    }

    @Test void unknownResetTokenRejected() {
        when(userRepository.findByUsernameOrEmail("testuser", "testuser")).thenReturn(Optional.of(sampleUser));
        assertThrows(BadRequestException.class, () -> authService.resetPassword(resetRequest("UNKNOWN")));
        verify(userRepository, never()).save(any());
    }

    @Test void expiredResetTokenRejected() {
        var token = activeResetCode("012345");
        token.setExpiredAt(LocalDateTime.now().minusMinutes(1));
        when(userRepository.findByUsernameOrEmail("testuser", "testuser")).thenReturn(Optional.of(sampleUser));
        when(passwordResetTokenRepository.findFirstByUserIdAndUsedFalseOrderByIdDesc(1L)).thenReturn(Optional.of(token));
        assertThrows(BadRequestException.class, () -> authService.resetPassword(resetRequest(token.getToken())));
        verify(userRepository, never()).save(any());
    }

    @Test void usedResetTokenRejected() {
        var token = activeResetCode("012345"); token.setUsed(true);
        when(userRepository.findByUsernameOrEmail("testuser", "testuser")).thenReturn(Optional.of(sampleUser));
        when(passwordResetTokenRepository.findFirstByUserIdAndUsedFalseOrderByIdDesc(1L)).thenReturn(Optional.of(token));
        assertThrows(BadRequestException.class, () -> authService.resetPassword(resetRequest(token.getToken())));
    }

    @Test void resetTokenNormalizesAndRevokesSessions() {
        var token = activeResetCode("012345");
        when(userRepository.findByUsernameOrEmail("testuser", "testuser")).thenReturn(Optional.of(sampleUser));
        when(passwordResetTokenRepository.findFirstByUserIdAndUsedFalseOrderByIdDesc(1L)).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("newpass123")).thenReturn("new_hash");
        authService.resetPassword(resetRequest(" 012345 "));
        assertEquals("new_hash", sampleUser.getPasswordHash());
        assertTrue(token.getUsed());
        verify(refreshTokenService).revokeAll(1L);
    }

    @Test void resetPasswordInvalidCodeLocksAfterFiveAttempts() {
        var token = activeResetCode("012345");
        when(userRepository.findByUsernameOrEmail("testuser", "testuser")).thenReturn(Optional.of(sampleUser));
        when(passwordResetTokenRepository.findFirstByUserIdAndUsedFalseOrderByIdDesc(1L)).thenReturn(Optional.of(token));

        for (int attempt = 1; attempt <= 5; attempt++) {
            assertThrows(BadRequestException.class, () -> authService.resetPassword(resetRequest("999999")));
        }

        assertEquals(5, token.getFailedAttempts());
        assertTrue(token.getUsed());
        verify(passwordResetTokenRepository, times(5)).save(token);
    }
}
