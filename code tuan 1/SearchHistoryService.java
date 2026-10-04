package com.bookstore.api.service;

import com.bookstore.api.dto.response.PopularSearchResponse;
import com.bookstore.api.dto.response.SearchHistoryResponse;

import java.util.List;

public interface SearchHistoryService {

    SearchHistoryResponse saveSearchKeyword(Long userId, String keyword, Integer resultsCount);

    List<SearchHistoryResponse> getUserSearchHistory(Long userId, int limit);

    void deleteSearchHistoryItem(Long userId, Long historyId);

    void clearUserSearchHistory(Long userId);

    List<PopularSearchResponse> getPopularSearches(int limit);
}
