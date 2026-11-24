package com.bookstore.api.repository;

import com.bookstore.api.entity.Publisher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PublisherRepository extends JpaRepository<Publisher, Long> {

    Optional<Publisher> findBySlug(String slug);

    Boolean existsBySlug(String slug);
}
