package com.bookstore.api.service;

import com.bookstore.api.dto.response.BookDetailResponse;
import com.bookstore.api.dto.response.BookResponse;
import com.bookstore.api.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** Gắn điểm đánh giá trung bình và số lượt đánh giá vào danh sách sách bằng 1 truy vấn gộp. */
@Component
@RequiredArgsConstructor
public class BookRatingEnricher {

    private final ReviewRepository reviewRepository;

    public <T extends Iterable<BookResponse>> T enrich(T books) {
        List<Long> ids = new java.util.ArrayList<>();
        books.forEach(b -> ids.add(b.getId()));
        if (ids.isEmpty()) return books;

        Map<Long, double[]> stats = new HashMap<>();
        for (Object[] row : reviewRepository.getRatingStatsByBookIds(ids)) {
            stats.put((Long) row[0], new double[]{((Number) row[1]).doubleValue(), ((Number) row[2]).doubleValue()});
        }
        books.forEach(b -> apply(stats.get(b.getId()), b));
        return books;
    }

    public BookDetailResponse enrich(BookDetailResponse detail) {
        Map<Long, double[]> stats = reviewRepository.getRatingStatsByBookIds(List.of(detail.getId())).stream()
                .collect(Collectors.toMap(r -> (Long) r[0],
                        r -> new double[]{((Number) r[1]).doubleValue(), ((Number) r[2]).doubleValue()}));
        double[] s = stats.get(detail.getId());
        detail.setAverageRating(s == null ? 0.0 : Math.round(s[0] * 10.0) / 10.0);
        detail.setReviewCount(s == null ? 0L : (long) s[1]);
        if (detail.getRelatedBooks() != null) enrich(detail.getRelatedBooks());
        return detail;
    }

    private void apply(double[] s, BookResponse b) {
        b.setAverageRating(s == null ? 0.0 : Math.round(s[0] * 10.0) / 10.0);
        b.setReviewCount(s == null ? 0L : (long) s[1]);
    }
}
