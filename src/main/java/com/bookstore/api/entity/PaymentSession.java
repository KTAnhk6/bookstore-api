package com.bookstore.api.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Phiên thanh toán QR: mỗi khách chỉ có tối đa 1 phiên PENDING, hiệu lực 10 phút.
 * Nội dung chuyển khoản (paymentCode) là duy nhất để đối soát với sao kê ngân hàng.
 */
@Entity
@Table(name = "payment_sessions", indexes = {
        @Index(name = "idx_ps_user_status", columnList = "user_id, status"),
        @Index(name = "idx_ps_status_expires", columnList = "status, expires_at"),
        @Index(name = "idx_ps_created", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "payment_code", nullable = false, unique = true, length = 20)
    private String paymentCode;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "received_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal receivedAmount = BigDecimal.ZERO;

    // SHA-256 của nội dung đơn (sản phẩm, số lượng, mã giảm giá, địa chỉ) để biết khách có đổi sản phẩm không
    @Column(name = "items_signature", nullable = false, length = 64)
    private String itemsSignature;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.PENDING;

    @Column(name = "qr_payload", nullable = false, length = 512)
    private String qrPayload;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "bank_ref_no", length = 50)
    private String bankRefNo;

    @Column(name = "cancel_reason", length = 255)
    private String cancelReason;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum Status {
        PENDING,
        PAID,
        EXPIRED,
        CANCELLED
    }
}
