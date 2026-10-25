package com.bookstore.api.repository;

import com.bookstore.api.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {

    List<Cart> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Cart> findByUserIdAndBookId(Long userId, Long bookId);

    Optional<Cart> findByIdAndUserId(Long id, Long userId);

    @Modifying
    @Query("DELETE FROM Cart c WHERE c.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM Cart c WHERE c.user.id = :userId AND c.book.id = :bookId")
    void deleteByUserIdAndBookId(@Param("userId") Long userId, @Param("bookId") Long bookId);

    @Modifying
    @Query("DELETE FROM Cart c WHERE c.user.id = :userId AND c.book.id IN :bookIds")
    void deleteByUserIdAndBookIdIn(@Param("userId") Long userId, @Param("bookIds") List<Long> bookIds);

    long countByUserId(Long userId);
}
