package com.bookstore.api.repository;

import com.bookstore.api.entity.BankTransaction;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BankTransactionRepository extends JpaRepository<BankTransaction, Long> {

    boolean existsByRefNo(String refNo);

    List<BankTransaction> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<BankTransaction> findBySessionIdOrderByCreatedAtAsc(Long sessionId);
}
