package com.bookstore.api.service;

import com.bookstore.api.dto.request.ReviewRequest;
import com.bookstore.api.dto.response.ReviewResponse;
import com.bookstore.api.dto.response.ReviewSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReviewService {

    ReviewResponse createReview(Long userId, ReviewRequest request);

    ReviewResponse updateReview(Long userId, Long reviewId, ReviewRequest request);

    void deleteReview(Long userId, Long reviewId);

    Page<ReviewResponse> getBookReviews(Long bookId, Pageable pageable);

    ReviewSummaryResponse getBookReviewSummary(Long bookId);
}
