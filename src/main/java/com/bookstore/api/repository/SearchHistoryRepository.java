package com.bookstore.api.repository;

import com.bookstore.api.entity.SearchHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SearchHistoryRepository extends JpaRepository<SearchHistory, Long> {
    List<SearchHistory> findTop10ByUserIdOrderByCreatedAtDesc(Long userId);
    void deleteByUserId(Long userId);
}
