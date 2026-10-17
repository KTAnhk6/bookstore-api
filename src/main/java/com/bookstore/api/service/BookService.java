package com.bookstore.api.service;

import com.bookstore.api.dto.request.BookRequest;
import com.bookstore.api.dto.response.BookDetailResponse;
import com.bookstore.api.dto.response.BookResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface BookService {

    Page<BookResponse> searchAndFilterBooks(
            String keyword,
            Long categoryId,
            String categorySlug,
            Long authorId,
            String authorSlug,
            Long publisherId,
            String publisherSlug,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Double minRating,
            Boolean inStock,
            Boolean featured,
            String sortBy,
            Pageable pageable
    );

    BookDetailResponse getBookById(Long id);

    BookDetailResponse getBookBySlug(String slug);

    List<BookResponse> getFeaturedBooks(int limit);

    List<BookResponse> getBestSellers(int limit);

    List<BookResponse> getNewestBooks(int limit);

    List<BookResponse> getRelatedBooks(Long bookId, int limit);

    BookResponse createBook(BookRequest request);

    BookResponse updateBook(Long id, BookRequest request);

    void deleteBook(Long id);

    List<BookResponse> getAll();

    BookResponse getById(Long id);

    BookResponse create(BookRequest request);

    BookResponse update(Long id, BookRequest request);

    void delete(Long id);
}
