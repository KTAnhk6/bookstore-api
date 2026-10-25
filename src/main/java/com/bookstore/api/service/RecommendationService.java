package com.bookstore.api.service;

import com.bookstore.api.dto.response.BookResponse;

import java.util.List;

public interface RecommendationService {

    List<BookResponse> getPersonalizedRecommendations(Long userId, int limit);

    List<BookResponse> getSimilarBooks(Long bookId, int limit);

    List<BookResponse> getTrendingRecommendations(int limit);
}
