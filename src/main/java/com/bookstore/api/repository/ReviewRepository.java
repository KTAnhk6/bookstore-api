package com.bookstore.api.repository;

import com.bookstore.api.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    /** Trang sách: đánh giá đã duyệt, cộng thêm đánh giá của chính người xem (chờ duyệt / bị từ chối). */
    @Query("SELECT r FROM Review r WHERE r.book.id = :bookId " +
            "AND (r.status = com.bookstore.api.entity.Review$Status.APPROVED OR r.user.id = :viewerId) " +
            "ORDER BY r.createdAt DESC")
    Page<Review> findVisibleByBookId(@Param("bookId") Long bookId, @Param("viewerId") Long viewerId, Pageable pageable);

    Page<Review> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Optional<Review> findByBookIdAndUserId(Long bookId, Long userId);

    boolean existsByBookIdAndUserId(Long bookId, Long userId);

    long countByBookIdAndStatus(Long bookId, Review.Status status);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.book.id = :bookId AND r.status = com.bookstore.api.entity.Review$Status.APPROVED")
    Double getAverageRatingByBookId(@Param("bookId") Long bookId);

    @Query("SELECT r.book.id, AVG(r.rating), COUNT(r) FROM Review r WHERE r.book.id IN :bookIds AND r.status = com.bookstore.api.entity.Review$Status.APPROVED GROUP BY r.book.id")
    List<Object[]> getRatingStatsByBookIds(@Param("bookIds") java.util.Collection<Long> bookIds);

    @Query("SELECT r.rating, COUNT(r) FROM Review r WHERE r.book.id = :bookId AND r.status = com.bookstore.api.entity.Review$Status.APPROVED GROUP BY r.rating")
    List<Object[]> getRatingCountsByBookId(@Param("bookId") Long bookId);

    /** Danh sách cho admin kiểm duyệt: lọc theo từ khoá (tên sách / tài khoản / nội dung), số sao, trạng thái duyệt. */
    @Query("SELECT r FROM Review r JOIN r.book b JOIN r.user u WHERE " +
            "(:keyword IS NULL OR LOWER(b.title) LIKE :keyword OR LOWER(u.username) LIKE :keyword " +
            "OR LOWER(u.fullName) LIKE :keyword OR LOWER(r.title) LIKE :keyword OR LOWER(r.comment) LIKE :keyword) " +
            "AND (:rating IS NULL OR r.rating = :rating) " +
            "AND (:status IS NULL OR r.status = :status)")
    Page<Review> searchForAdmin(@Param("keyword") String keyword, @Param("rating") Integer rating,
                                @Param("status") Review.Status status, Pageable pageable);
}
