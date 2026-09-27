package com.bookstore.api.service;

import com.bookstore.api.dto.request.BookRequest;
import com.bookstore.api.dto.response.BookResponse;
import java.util.List;

public interface BookService {
    List<BookResponse> getAll();
    BookResponse getById(Long id);
    BookResponse create(BookRequest request);
    BookResponse update(Long id, BookRequest request);
    void delete(Long id);
}