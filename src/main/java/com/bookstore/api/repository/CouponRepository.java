package com.bookstore.api.repository;

import com.bookstore.api.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {

    Optional<Coupon> findByCode(String code);

    Optional<Coupon> findByCodeIgnoreCaseAndActiveTrue(String code);

    List<Coupon> findByActiveTrue();

    // Tăng lượt dùng nguyên tử: trả về 0 nếu mã đã hết lượt (hai đơn cùng lúc không vượt usageLimit)
    @Modifying
    @Query("UPDATE Coupon c SET c.usedCount = COALESCE(c.usedCount, 0) + 1 " +
            "WHERE c.id = :id AND (c.usageLimit IS NULL OR COALESCE(c.usedCount, 0) < c.usageLimit)")
    int incrementUsage(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Coupon c SET c.usedCount = c.usedCount - 1 WHERE c.id = :id AND c.usedCount > 0")
    int decrementUsage(@Param("id") Long id);
}
