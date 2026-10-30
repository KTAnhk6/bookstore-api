package com.bookstore.api;

import com.bookstore.api.dto.request.LoginRequest;
import com.bookstore.api.dto.request.RegisterRequest;
import com.bookstore.api.dto.response.AuthResponse;
import com.bookstore.api.entity.User;
import com.bookstore.api.exception.BadRequestException;
import com.bookstore.api.repository.UserRepository;
import com.bookstore.api.security.JwtUtil;
import com.bookstore.api.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
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
    private AuthenticationManager authenticationManager;

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
        when(jwtUtil.generateToken(1L, "testuser", "test@example.com", "CUSTOMER")).thenReturn("mocked_jwt_token");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("mocked_jwt_token", response.getToken());
        assertEquals("testuser", response.getUser().getUsername());
        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }
}
