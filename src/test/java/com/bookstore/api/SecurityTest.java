package com.bookstore.api;

import com.bookstore.api.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

public class SecurityTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970");
        ReflectionTestUtils.setField(jwtUtil, "jwtExpirationMs", 3600000L);
    }

    @Test
    @DisplayName("Tạo và xác thực JWT token")
    void generateAndValidateJwtToken() {
        String token = jwtUtil.generateToken(1L, "customer", "customer@example.com", "CUSTOMER");

        assertNotNull(token);
        assertFalse(token.isEmpty());

        assertEquals("customer", jwtUtil.extractUsername(token));
        assertEquals(1L, jwtUtil.extractUserId(token));
        assertEquals("CUSTOMER", jwtUtil.extractRole(token));
        assertTrue(jwtUtil.validateToken(token, "customer"));
        assertFalse(jwtUtil.validateToken(token, "wronguser"));
    }
}
