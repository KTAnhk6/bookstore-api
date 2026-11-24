package com.bookstore.api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** Cài đặt hệ thống dạng khóa - giá trị, admin chỉnh trên giao diện (ví dụ link API ngân hàng). */
@Entity
@Table(name = "app_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppSetting {

    public static final String BANK_HISTORY_URL = "payment.bank.history-url";

    @Id
    @Column(name = "setting_key", length = 100)
    private String key;

    @Column(name = "setting_value", columnDefinition = "TEXT")
    private String value;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = LocalDateTime.now();
    }
}
