package com.bookstore.api.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Giao dịch tiền vào (từ sao kê ngân hàng) đã khớp với một phiên thanh toán.
 * ref_no duy nhất để không bao giờ xử lý một giao dịch hai lần.
 */
@Entity
@Table(name = "bank_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ref_no", nullable = false, unique = true, length = 50)
    private String refNo;

    @Column(name = "account_no", length = 50)
    private String accountNo;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(length = 500)
    private String description;

    @Column(name = "transaction_date")
    private LocalDateTime transactionDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private PaymentSession session;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Result result;

    @Column(length = 255)
    private String note;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum Result {
        PAID,       // đủ tiền -> xác nhận thanh toán
        PARTIAL,    // chưa đủ tiền, cộng dồn chờ chuyển thêm
        LATE,       // tiền về khi phiên đã hết hạn / bị hủy -> cần hoàn tiền
        DUPLICATE   // phiên đã thanh toán rồi mà khách chuyển thêm -> cần hoàn tiền
    }
}
