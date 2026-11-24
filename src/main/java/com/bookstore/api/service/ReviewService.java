package com.bookstore.api.service;

import com.bookstore.api.dto.request.ReviewRequest;
import com.bookstore.api.dto.response.ReviewResponse;
import com.bookstore.api.dto.response.ReviewSummaryResponse;
import com.bookstore.api.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReviewService {

    ReviewResponse createReview(Long userId, ReviewRequest request);

    ReviewResponse updateReview(Long userId, Long reviewId, ReviewRequest request);

    void deleteReview(Long userId, Long reviewId);

    /** viewerId (có thể null): người xem thấy thêm đánh giá chưa duyệt của chính mình. */
    Page<ReviewResponse> getBookReviews(Long bookId, Long viewerId, Pageable pageable);

    ReviewSummaryResponse getBookReviewSummary(Long bookId);

    // Admin kiểm duyệt
    Page<ReviewResponse> searchForAdmin(String keyword, Integer rating, Review.Status status, Pageable pageable);

    ReviewResponse setStatus(Long reviewId, Review.Status status);

    void deleteByAdmin(Long reviewId);
}
