package com.bookstore.api.repository;

import com.bookstore.api.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Page<Order> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<Order> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, Order.OrderStatus status, Pageable pageable);

    Page<Order> findByStatus(Order.OrderStatus status, Pageable pageable);

    Optional<Order> findByIdAndUserId(Long id, Long userId);

    Optional<Order> findByOrderCodeAndUserId(String orderCode, Long userId);

    Optional<Order> findByOrderCode(String orderCode);

    @Query("SELECT DISTINCT ba.author.id FROM OrderItem oi JOIN oi.book b JOIN b.authors ba WHERE oi.order.user.id = :userId")
    List<Long> findPurchasedAuthorIdsByUserId(@Param("userId") Long userId);

    @Query("SELECT DISTINCT bc.category.id FROM Order o JOIN o.items oi JOIN oi.book b JOIN b.bookCategories bc WHERE o.user.id = :userId")
    List<Long> findPurchasedCategoryIdsByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(oi) > 0 FROM OrderItem oi JOIN oi.order o WHERE o.user.id = :userId AND oi.book.id = :bookId AND o.status = com.bookstore.api.entity.Order$OrderStatus.DELIVERED")
    boolean hasPurchasedAndReceivedBook(@Param("userId") Long userId, @Param("bookId") Long bookId);
}
