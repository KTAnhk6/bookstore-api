package com.bookstore.api.dto.response;

import com.bookstore.api.entity.Review;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewResponse {

    private Long id;
    private Long bookId;
    private String bookTitle;
    private Long userId;
    private String username;
    private String userFullName;
    private String userAvatar;
    private Integer rating;
    private String title;
    private String comment;
    private Boolean isVerifiedPurchase;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ReviewResponse fromEntity(Review review) {
        if (review == null) return null;
        return ReviewResponse.builder()
                .id(review.getId())
                .bookId(review.getBook() != null ? review.getBook().getId() : null)
                .bookTitle(review.getBook() != null ? review.getBook().getTitle() : null)
                .userId(review.getUser() != null ? review.getUser().getId() : null)
                .username(review.getUser() != null ? review.getUser().getUsername() : null)
                .userFullName(review.getUser() != null ? review.getUser().getFullName() : null)
                .userAvatar(review.getUser() != null ? review.getUser().getAvatar() : null)
                .rating(review.getRating())
                .title(review.getTitle())
                .comment(review.getComment())
                .isVerifiedPurchase(review.getIsVerifiedPurchase())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}
