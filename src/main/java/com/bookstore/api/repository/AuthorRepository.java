package com.bookstore.api.repository;

import com.bookstore.api.entity.Author;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AuthorRepository extends JpaRepository<Author, Long> {

    Optional<Author> findBySlug(String slug);

    List<Author> findByIdIn(List<Long> ids);

    Boolean existsBySlug(String slug);
}
