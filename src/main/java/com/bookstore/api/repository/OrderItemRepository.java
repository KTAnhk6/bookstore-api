package com.bookstore.api.repository;

import com.bookstore.api.entity.OrderItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findByOrderId(Long orderId);

    @Query("SELECT c.name, SUM(oi.subtotal) FROM OrderItem oi JOIN oi.order o JOIN oi.book b JOIN b.bookCategories bc JOIN bc.category c "
            + "WHERE bc.isPrimary = true AND o.status NOT IN (com.bookstore.api.entity.Order$OrderStatus.CANCELLED, com.bookstore.api.entity.Order$OrderStatus.RETURNED) "
            + "AND (o.status = com.bookstore.api.entity.Order$OrderStatus.DELIVERED OR o.paymentStatus = com.bookstore.api.entity.Order$PaymentStatus.SUCCESS) "
            + "GROUP BY c.name ORDER BY SUM(oi.subtotal) DESC")
    List<Object[]> revenueByPrimaryCategory(Pageable pageable);
}
