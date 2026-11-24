package com.bookstore.api.dto.response;

import lombok.*;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewSummaryResponse {

    private Long bookId;
    private Double averageRating;
    private Long totalReviews;
    private Map<Integer, Long> starCounts; // star (1-5) -> count
}
