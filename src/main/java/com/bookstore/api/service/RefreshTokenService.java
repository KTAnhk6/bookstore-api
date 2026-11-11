package com.bookstore.api.service;

import com.bookstore.api.entity.RefreshToken;
import com.bookstore.api.entity.User;
import com.bookstore.api.exception.UnauthorizedException;
import com.bookstore.api.repository.RefreshTokenRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Refresh token: mỗi lần đăng nhập trên một thiết bị là một phiên (một dòng refresh_tokens).
 * Access token (JWT) sống ngắn; khi hết hạn, frontend đổi refresh token lấy cặp mã mới và
 * phiên được gia hạn thêm jwt.refresh-expiration-days ngày. Không dùng quá thời hạn đó thì phải đăng nhập lại.
 * DB chỉ lưu SHA-256 của mã nên lộ database cũng không dùng lại được phiên.
 */
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final SecureRandom random = new SecureRandom();

    @Value("${jwt.refresh-expiration-days:30}")
    private long refreshExpirationDays;

    public record Rotation(User user, String refreshToken) {}

    /** Tạo phiên mới cho thiết bị đang gửi request; trả về mã gốc để gửi cho client. */
    @Transactional
    public String issue(User user) {
        refreshTokenRepository.deleteExpiredByUserId(user.getId(), LocalDateTime.now());
        String raw = newRawToken();
        HttpServletRequest request = currentRequest();
        refreshTokenRepository.save(RefreshToken.builder()
                .user(user)
                .token(hash(raw))
                .deviceInfo(request != null ? truncate(request.getHeader("User-Agent"), 255) : null)
                .ipAddress(request != null ? request.getRemoteAddr() : null)
                .expiredAt(LocalDateTime.now().plusDays(refreshExpirationDays))
                .build());
        return raw;
    }

    /** Đổi mã cũ lấy mã mới trong cùng phiên; mã cũ không dùng được nữa. */
    @Transactional
    public Rotation rotate(String raw) {
        RefreshToken session = refreshTokenRepository.findByToken(hash(raw))
                .filter(t -> !Boolean.TRUE.equals(t.getRevoked()) && t.getExpiredAt().isAfter(LocalDateTime.now()))
                .orElseThrow(() -> new UnauthorizedException("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!"));

        User user = session.getUser();
        if (user.getStatus() != User.Status.ACTIVE) {
            throw new UnauthorizedException("Tài khoản của bạn đã bị khóa");
        }

        String next = newRawToken();
        session.setToken(hash(next));
        session.setExpiredAt(LocalDateTime.now().plusDays(refreshExpirationDays));
        return new Rotation(user, next);
    }

    /** Đăng xuất thiết bị hiện tại. */
    @Transactional
    public void revoke(String raw) {
        refreshTokenRepository.findByToken(hash(raw)).ifPresent(refreshTokenRepository::delete);
    }

    /** Đăng xuất mọi thiết bị của người dùng. */
    @Transactional
    public void revokeAll(Long userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }

    private String newRawToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String hash(String raw) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static HttpServletRequest currentRequest() {
        return RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs
                ? attrs.getRequest() : null;
    }

    private static String truncate(String s, int max) {
        return s == null || s.length() <= max ? s : s.substring(0, max);
    }
}
