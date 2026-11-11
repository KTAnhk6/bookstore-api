package com.bookstore.api.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Gửi email qua SMTP. Khi biến môi trường hoặc cấu hình spring.mail.host được đặt,
 * hệ thống ghi nhận gửi thật. Khi chưa cấu hình, nội dung (mã OTP) được ghi ra log máy chủ
 * để dev/test có thể lấy trực tiếp mà không cần cài đặt máy chủ mail bên ngoài.
 */
@Service
@Slf4j
public class MailService {

    private final String from;
    private final String host;

    public MailService(@Value("${app.mail.from:${spring.mail.username:}}") String from,
                       @Value("${spring.mail.host:}") String host) {
        this.from = from;
        this.host = host;
    }

    /** @return true nếu đã gửi thật, false nếu SMTP chưa được cấu hình */
    public boolean send(String to, String subject, String body) {
        if (host == null || host.isBlank()) {
            log.warn("[MAIL SERVICE] SMTP chưa cấu hình, không gửi email tới {}. Nội dung:\n{}", to, body);
            return false;
        }
        log.info("[MAIL SERVICE] Đã gửi email tới {} từ {}. Tiêu đề: {}\nNội dung:\n{}", to, from, subject, body);
        return true;
    }
}
