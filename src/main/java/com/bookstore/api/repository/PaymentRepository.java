package com.bookstore.api.repository;

import com.bookstore.api.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    java.util.List<com.bookstore.api.entity.Payment> findByOrderIdOrderByCreatedAtDesc(Long orderId);

    // Lấy bản ghi mới nhất: dữ liệu cũ có thể có nhiều payment cho một đơn, Optional thường sẽ ném lỗi
    default Optional<Payment> findByOrderId(Long orderId) {
        return findByOrderIdOrderByCreatedAtDesc(orderId).stream().findFirst();
    }


    Optional<Payment> findByTransactionCode(String transactionCode);

    Optional<Payment> findByOrder_OrderCode(String orderCode);
}
