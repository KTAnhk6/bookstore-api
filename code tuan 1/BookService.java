package com.bookstore.api.service;

import com.bookstore.api.dto.request.BookRequest;
import com.bookstore.api.dto.response.BookResponse;

import java.util.List;

public interface BookService {

    List<BookResponse> getAllBooks();

    BookResponse getBookById(Long id);

    List<BookResponse> searchBooks(String keyword, Long userId);

    BookResponse createBook(BookRequest request);

    BookResponse updateBook(Long id, BookRequest request);

    void deleteBook(Long id);
}
