package com.bookstore.api.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Gửi email qua SMTP (spring.mail.host, spring.mail.username, spring.mail.password...).
 * Khi chưa cấu hình SMTP, nội dung (mã OTP) được ghi ra log máy chủ
 * để dev/test có thể lấy trực tiếp mà không cần cài đặt máy chủ mail bên ngoài.
 */
@Service
@Slf4j
public class MailService {

    private final String from;
    private final String host;
    private final ObjectProvider<JavaMailSender> mailSender;

    public MailService(@Value("${app.mail.from:${spring.mail.username:}}") String from,
                       @Value("${spring.mail.host:}") String host,
                       ObjectProvider<JavaMailSender> mailSender) {
        this.from = from;
        this.host = host;
        this.mailSender = mailSender;
    }

    /** @return true nếu đã gửi thật, false nếu SMTP chưa được cấu hình hoặc gửi lỗi */
    public boolean send(String to, String subject, String body) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (host == null || host.isBlank() || sender == null) {
            log.warn("[MAIL SERVICE] SMTP chưa cấu hình; không gửi email.");
            return false;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        if (from != null && !from.isBlank()) message.setFrom(from);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        try {
            sender.send(message);
        } catch (MailException e) {
            // Không ghi nội dung (có mã OTP) vào log khi đã cấu hình SMTP thật
            log.error("[MAIL SERVICE] Gửi email tới {} thất bại: {}", to, e.getMessage());
            return false;
        }
        log.info("[MAIL SERVICE] Đã gửi email tới {}. Tiêu đề: {}", to, subject);
        return true;
    }
}
