package com.bookstore.api.service;

import com.bookstore.api.dto.request.AuthorRequest;
import com.bookstore.api.dto.response.AuthorResponse;

import java.util.List;

public interface AuthorService {

    List<AuthorResponse> getAllAuthors();

    AuthorResponse getAuthorById(Long id);

    AuthorResponse getAuthorBySlug(String slug);

    AuthorResponse createAuthor(AuthorRequest request);

    AuthorResponse updateAuthor(Long id, AuthorRequest request);

    void deleteAuthor(Long id);
}
