package com.bookstore.api.service.impl;

import com.bookstore.api.dto.request.AuthorRequest;
import com.bookstore.api.dto.response.AuthorResponse;
import com.bookstore.api.entity.Author;
import com.bookstore.api.exception.ResourceNotFoundException;
import com.bookstore.api.repository.AuthorRepository;
import com.bookstore.api.service.AuthorService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthorServiceImpl implements AuthorService {

    private final AuthorRepository authorRepository;

    @Override
    @Transactional(readOnly = true)
    public List<AuthorResponse> getAllAuthors() {
        return authorRepository.findAll().stream()
                .map(AuthorResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AuthorResponse getAuthorById(Long id) {
        Author author = authorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Author", "id", id));
        return AuthorResponse.fromEntity(author);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthorResponse getAuthorBySlug(String slug) {
        Author author = authorRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Author", "slug", slug));
        return AuthorResponse.fromEntity(author);
    }

    @Override
    @Transactional
    public AuthorResponse createAuthor(AuthorRequest request) {
        String slug = request.getSlug() != null && !request.getSlug().isBlank()
                ? CategoryServiceImpl.toSlug(request.getSlug())
                : CategoryServiceImpl.toSlug(request.getName());

        if (authorRepository.existsBySlug(slug)) {
            slug = slug + "-" + System.currentTimeMillis() % 10000;
        }

        Author author = Author.builder()
                .name(request.getName().trim())
                .slug(slug)
                .bio(request.getBio())
                .avatar(request.getAvatar())
                .nationality(request.getNationality())
                .birthYear(request.getBirthYear())
                .deathYear(request.getDeathYear())
                .build();

        author = authorRepository.save(author);
        return AuthorResponse.fromEntity(author);
    }

    @Override
    @Transactional
    public AuthorResponse updateAuthor(Long id, AuthorRequest request) {
        Author author = authorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Author", "id", id));

        author.setName(request.getName().trim());
        if (request.getSlug() != null && !request.getSlug().isBlank()) {
            author.setSlug(CategoryServiceImpl.toSlug(request.getSlug()));
        }
        author.setBio(request.getBio());
        author.setAvatar(request.getAvatar());
        author.setNationality(request.getNationality());
        author.setBirthYear(request.getBirthYear());
        author.setDeathYear(request.getDeathYear());

        author = authorRepository.save(author);
        return AuthorResponse.fromEntity(author);
    }

    @Override
    @Transactional
    public void deleteAuthor(Long id) {
        Author author = authorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Author", "id", id));
        authorRepository.delete(author);
    }
}
