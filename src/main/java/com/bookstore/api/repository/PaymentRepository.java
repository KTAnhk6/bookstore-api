package com.bookstore.api.repository;

import com.bookstore.api.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByOrderId(Long orderId);

    java.util.List<com.bookstore.api.entity.Payment> findByOrderIdOrderByCreatedAtDesc(Long orderId);


    Optional<Payment> findByTransactionCode(String transactionCode);

    Optional<Payment> findByOrder_OrderCode(String orderCode);
}
