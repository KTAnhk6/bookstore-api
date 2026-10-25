package com.bookstore.api.service.impl;

import com.bookstore.api.dto.response.BookResponse;
import com.bookstore.api.entity.Book;
import com.bookstore.api.repository.BookRepository;
import com.bookstore.api.repository.OrderRepository;
import com.bookstore.api.repository.UserFavoriteCategoryRepository;
import com.bookstore.api.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecommendationServiceImpl implements RecommendationService {

    private final BookRepository bookRepository;
    private final UserFavoriteCategoryRepository favoriteCategoryRepository;
    private final OrderRepository orderRepository;
    private final com.bookstore.api.service.BookRatingEnricher ratingEnricher;

    @Override
    @Transactional(readOnly = true)
    public List<BookResponse> getPersonalizedRecommendations(Long userId, int limit) {
        if (userId == null) {
            return getTrendingRecommendations(limit);
        }

        Set<Long> targetCategoryIds = new LinkedHashSet<>();

        // 1. Get user favorite categories (priority #1)
        List<Long> userFavCategoryIds = favoriteCategoryRepository.findCategoryIdsByUserId(userId);
        if (userFavCategoryIds != null && !userFavCategoryIds.isEmpty()) {
            targetCategoryIds.addAll(userFavCategoryIds);
        }

        // 2. Get past order categories (priority #2)
        List<Long> orderCategoryIds = orderRepository.findPurchasedCategoryIdsByUserId(userId);
        if (orderCategoryIds != null && !orderCategoryIds.isEmpty()) {
            targetCategoryIds.addAll(orderCategoryIds);
        }

        Map<Long, Book> recommendedBooksMap = new LinkedHashMap<>();

        // Fetch top rated & popular books in preferred categories
        if (!targetCategoryIds.isEmpty()) {
            List<Book> categoryBooks = bookRepository.findByCategoriesIn(
                    targetCategoryIds,
                    Book.Status.AVAILABLE,
                    PageRequest.of(0, limit * 2)
            ).getContent();

            // Sort category books by combination of rating and sales
            categoryBooks.stream()
                    .sorted((b1, b2) -> {
                        double score1 = (b1.getSoldQuantity() != null ? b1.getSoldQuantity() : 0.0) * 10
                                + (b1.getSoldQuantity() != null ? Math.min(b1.getSoldQuantity(), 100) : 0);
                        double score2 = (b2.getSoldQuantity() != null ? b2.getSoldQuantity() : 0.0) * 10
                                + (b2.getSoldQuantity() != null ? Math.min(b2.getSoldQuantity(), 100) : 0);
                        return Double.compare(score2, score1);
                    })
                    .forEach(b -> recommendedBooksMap.put(b.getId(), b));
        }

        // 3. Add books by purchased authors
        List<Long> authorIds = orderRepository.findPurchasedAuthorIdsByUserId(userId);
        if (authorIds != null && !authorIds.isEmpty()) {
            List<Book> authorBooks = bookRepository.findByAuthorIdsIn(
                    authorIds,
                    Book.Status.AVAILABLE,
                    PageRequest.of(0, limit)
            );
            for (Book b : authorBooks) {
                recommendedBooksMap.putIfAbsent(b.getId(), b);
            }
        }

        // 4. If still less than limit, supplement with best sellers and featured books
        if (recommendedBooksMap.size() < limit) {
            List<Book> bestSellers = bookRepository.findTop10ByStatusOrderBySoldQuantityDesc(Book.Status.AVAILABLE);
            for (Book b : bestSellers) {
                recommendedBooksMap.putIfAbsent(b.getId(), b);
                if (recommendedBooksMap.size() >= limit) break;
            }
        }

        if (recommendedBooksMap.size() < limit) {
            List<Book> featured = bookRepository.findTop8ByStatusOrderByCreatedAtDesc(Book.Status.AVAILABLE);
            for (Book b : featured) {
                recommendedBooksMap.putIfAbsent(b.getId(), b);
                if (recommendedBooksMap.size() >= limit) break;
            }
        }

        return ratingEnricher.enrich(recommendedBooksMap.values().stream()
                .limit(limit)
                .map(BookResponse::fromEntity)
                .collect(Collectors.toList()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookResponse> getSimilarBooks(Long bookId, int limit) {
        Book book = bookRepository.findById(bookId).orElse(null);
        if (book == null) {
            return getTrendingRecommendations(limit);
        }

        Map<Long, Book> similarMap = new LinkedHashMap<>();

        // Books from same categories
        if (book.getBookCategories() != null && !book.getBookCategories().isEmpty()) {
            Set<Long> categoryIds = book.getBookCategories().stream().map(c -> c.getCategory().getId()).collect(Collectors.toSet());
            List<Book> related = bookRepository.findRelatedBooksByCategory(
                    categoryIds,
                    Book.Status.AVAILABLE,
                    bookId,
                    PageRequest.of(0, limit)
            );
            related.forEach(b -> similarMap.put(b.getId(), b));
        }

        // Books from same author
        if ((book.getAuthors().isEmpty() ? null : book.getAuthors().iterator().next().getAuthor()) != null && similarMap.size() < limit) {
            List<Book> authorBooks = bookRepository.findByAuthorIdsIn(
                    List.of((book.getAuthors().isEmpty() ? null : book.getAuthors().iterator().next().getAuthor()).getId()),
                    Book.Status.AVAILABLE,
                    PageRequest.of(0, limit)
            );
            for (Book b : authorBooks) {
                if (!b.getId().equals(bookId)) {
                    similarMap.putIfAbsent(b.getId(), b);
                }
            }
        }

        // Fallback
        if (similarMap.size() < limit) {
            List<Book> bestSellers = bookRepository.findTop10ByStatusOrderBySoldQuantityDesc(Book.Status.AVAILABLE);
            for (Book b : bestSellers) {
                if (!b.getId().equals(bookId)) {
                    similarMap.putIfAbsent(b.getId(), b);
                }
                if (similarMap.size() >= limit) break;
            }
        }

        return ratingEnricher.enrich(similarMap.values().stream()
                .limit(limit)
                .map(BookResponse::fromEntity)
                .collect(Collectors.toList()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookResponse> getTrendingRecommendations(int limit) {
        Map<Long, Book> map = new LinkedHashMap<>();

        // 1. Featured books
        bookRepository.findTop8ByStatusOrderByCreatedAtDesc(Book.Status.AVAILABLE)
                .forEach(b -> map.put(b.getId(), b));

        // 2. Best sellers
        bookRepository.findTop10ByStatusOrderBySoldQuantityDesc(Book.Status.AVAILABLE)
                .forEach(b -> map.putIfAbsent(b.getId(), b));

        // 3. Highest rated
        bookRepository.findTop10ByStatusOrderByCreatedAtDesc(Book.Status.AVAILABLE)
                .forEach(b -> map.putIfAbsent(b.getId(), b));

        return ratingEnricher.enrich(map.values().stream()
                .limit(limit)
                .map(BookResponse::fromEntity)
                .collect(Collectors.toList()));
    }
}
