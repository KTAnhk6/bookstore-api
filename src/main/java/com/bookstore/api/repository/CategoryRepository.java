package com.bookstore.api.repository;

import com.bookstore.api.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    Optional<Category> findBySlug(String slug);

    List<Category> findByActiveTrueOrderByDisplayOrderAsc();

    List<Category> findByIdIn(List<Long> ids);

    Boolean existsByName(String name);

    Boolean existsBySlug(String slug);
}
