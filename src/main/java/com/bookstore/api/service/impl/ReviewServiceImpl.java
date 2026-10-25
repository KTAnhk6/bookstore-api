package com.bookstore.api.service.impl;

import com.bookstore.api.dto.request.ReviewRequest;
import com.bookstore.api.dto.response.ReviewResponse;
import com.bookstore.api.dto.response.ReviewSummaryResponse;
import com.bookstore.api.entity.Book;
import com.bookstore.api.entity.Review;
import com.bookstore.api.entity.User;
import com.bookstore.api.exception.BadRequestException;
import com.bookstore.api.exception.ResourceNotFoundException;
import com.bookstore.api.repository.BookRepository;
import com.bookstore.api.repository.OrderRepository;
import com.bookstore.api.repository.ReviewRepository;
import com.bookstore.api.repository.UserRepository;
import com.bookstore.api.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    private void updateBookRatingStats(Long bookId) {
        Book book = bookRepository.findById(bookId).orElse(null);
        if (book != null) {
            long count = reviewRepository.countByBookId(bookId);
            Double avg = reviewRepository.getAverageRatingByBookId(bookId);
            // book.setReviewCount((int) count);
            // book.setAverageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
            // bookRepository.save(book);
        }
    }

    @Override
    @Transactional
    public ReviewResponse createReview(Long userId, ReviewRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new ResourceNotFoundException("Book", "id", request.getBookId()));

        Optional<Review> existingReview = reviewRepository.findByBookIdAndUserId(request.getBookId(), userId);
        if (existingReview.isPresent()) {
            throw new BadRequestException("Bạn đã đánh giá sản phẩm này rồi. Vui lòng cập nhật đánh giá hiện tại nếu muốn thay đổi.");
        }

        boolean isVerified = orderRepository.hasPurchasedAndReceivedBook(userId, book.getId());

        Review review = Review.builder()
                .user(user)
                .book(book)
                .rating(request.getRating())
                .title(request.getTitle())
                .comment(request.getComment())
                .isVerifiedPurchase(isVerified)
                .build();

        review = reviewRepository.save(review);
        updateBookRatingStats(book.getId());

        return ReviewResponse.fromEntity(review);
    }

    @Override
    @Transactional
    public ReviewResponse updateReview(Long userId, Long reviewId, ReviewRequest request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));

        if (!review.getUser().getId().equals(userId)) {
            throw new BadRequestException("Bạn không thể chỉnh sửa đánh giá của người khác");
        }

        review.setRating(request.getRating());
        review.setTitle(request.getTitle());
        review.setComment(request.getComment());

        review = reviewRepository.save(review);
        updateBookRatingStats(review.getBook().getId());

        return ReviewResponse.fromEntity(review);
    }

    @Override
    @Transactional
    public void deleteReview(Long userId, Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));

        if (!review.getUser().getId().equals(userId)) {
            throw new BadRequestException("Bạn không thể xóa đánh giá của người khác");
        }

        Long bookId = review.getBook().getId();
        reviewRepository.delete(review);
        updateBookRatingStats(bookId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getBookReviews(Long bookId, Pageable pageable) {
        return reviewRepository.findByBookIdOrderByCreatedAtDesc(bookId, pageable)
                .map(ReviewResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewSummaryResponse getBookReviewSummary(Long bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book", "id", bookId));

        long totalReviews = reviewRepository.countByBookId(bookId);
        Double avgRating = reviewRepository.getAverageRatingByBookId(bookId);

        Map<Integer, Long> starCounts = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            starCounts.put(i, 0L);
        }

        List<Object[]> ratingCounts = reviewRepository.getRatingCountsByBookId(bookId);
        for (Object[] row : ratingCounts) {
            Integer star = (Integer) row[0];
            Long count = (Long) row[1];
            starCounts.put(star, count);
        }

        return ReviewSummaryResponse.builder()
                .bookId(bookId)
                .averageRating(avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0)
                .totalReviews(totalReviews)
                .starCounts(starCounts)
                .build();
    }
}
