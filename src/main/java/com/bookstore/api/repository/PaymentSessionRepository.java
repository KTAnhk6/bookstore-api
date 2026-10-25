package com.bookstore.api.repository;

import com.bookstore.api.entity.PaymentSession;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentSessionRepository extends JpaRepository<PaymentSession, Long> {

    List<PaymentSession> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, PaymentSession.Status status);

    Optional<PaymentSession> findByIdAndUserId(Long id, Long userId);

    List<PaymentSession> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    List<PaymentSession> findByStatusOrderByCreatedAtDesc(PaymentSession.Status status, Pageable pageable);

    List<PaymentSession> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // Các phiên có thể nhận tiền: tạo trong khoảng gần đây (gồm cả phiên đã hết hạn/hủy để phát hiện tiền về trễ)
    List<PaymentSession> findByCreatedAtAfter(LocalDateTime time);

    boolean existsByCreatedAtAfter(LocalDateTime time);

    boolean existsByPaymentCode(String paymentCode);

    // Khóa dòng khi đổi trạng thái để tiền về / khách hủy / hết hạn không chạy chồng lên nhau
    // Native "FOR UPDATE": @Lock sinh "FOR UPDATE OF" mà MariaDB (XAMPP) báo lỗi cú pháp
    @Query(value = "SELECT * FROM payment_sessions WHERE id = :id FOR UPDATE", nativeQuery = true)
    Optional<PaymentSession> lockById(@Param("id") Long id);

    @Query("SELECT s.id FROM PaymentSession s WHERE s.status = :status AND s.expiresAt < :time")
    List<Long> findIdsByStatusAndExpiresAtBefore(@Param("status") PaymentSession.Status status,
                                                 @Param("time") LocalDateTime time);
}
