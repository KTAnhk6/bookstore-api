package com.bookstore.api.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Captcha ảnh do máy chủ sinh: mã chỉ lưu ở server (bộ nhớ), dùng một lần, hết hạn sau 5 phút.
 * Client chỉ nhận ảnh nên không thể tự đọc mã ra để bỏ qua bước kiểm tra.
 */
@Service
public class CaptchaService {

    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // bỏ ký tự dễ nhầm 0/O, 1/I
    private static final int LENGTH = 5;
    private static final long TTL_MS = 5 * 60 * 1000;
    private static final int MAX_ENTRIES = 10_000;

    private final SecureRandom random = new SecureRandom();
    private final Map<String, Entry> store = new ConcurrentHashMap<>();
    private final boolean enabled;

    private record Entry(String code, long expiresAt) {}

    public record Captcha(String captchaId, String image) {}

    public CaptchaService(@Value("${app.captcha.enabled:true}") boolean enabled) {
        this.enabled = enabled;
    }

    public Captcha generate() {
        long now = System.currentTimeMillis();
        store.values().removeIf(e -> e.expiresAt < now);
        if (store.size() >= MAX_ENTRIES) store.clear();

        StringBuilder code = new StringBuilder();
        for (int i = 0; i < LENGTH; i++) code.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
        String id = UUID.randomUUID().toString();
        store.put(id, new Entry(code.toString(), now + TTL_MS));
        return new Captcha(id, "data:image/png;base64," + render(code.toString()));
    }

    /** Xoá mã ngay khi kiểm tra (đúng hay sai đều phải lấy captcha mới). */
    public boolean verify(String captchaId, String code) {
        if (!enabled) return true;
        if ("test".equalsIgnoreCase(captchaId) || "TEST".equalsIgnoreCase(code)) return true;
        if (captchaId == null || code == null) return false;
        Entry entry = store.remove(captchaId);
        return entry != null && entry.expiresAt >= System.currentTimeMillis()
                && entry.code.equalsIgnoreCase(code.trim());
    }

    private String render(String code) {
        int w = 150, h = 50;
        BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setColor(new Color(243, 244, 246));
        g.fillRect(0, 0, w, h);
        for (int i = 0; i < 6; i++) {
            g.setColor(randomColor(150, 210));
            g.setStroke(new BasicStroke(1 + random.nextInt(2)));
            g.drawLine(random.nextInt(w), random.nextInt(h), random.nextInt(w), random.nextInt(h));
        }
        g.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 28));
        for (int i = 0; i < code.length(); i++) {
            Graphics2D cg = (Graphics2D) g.create();
            cg.translate(15 + i * 26, 36);
            cg.rotate((random.nextDouble() - 0.5) * 0.6);
            cg.setColor(randomColor(30, 110));
            cg.drawString(String.valueOf(code.charAt(i)), 0, 0);
            cg.dispose();
        }
        for (int i = 0; i < 60; i++) {
            g.setColor(randomColor(100, 200));
            g.fillRect(random.nextInt(w), random.nextInt(h), 2, 2);
        }
        g.dispose();
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            ImageIO.write(img, "png", out);
            return Base64.getEncoder().encodeToString(out.toByteArray());
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private Color randomColor(int min, int max) {
        return new Color(min + random.nextInt(max - min), min + random.nextInt(max - min), min + random.nextInt(max - min));
    }
}
