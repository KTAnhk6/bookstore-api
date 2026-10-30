package com.bookstore.api.repository;

import com.bookstore.api.entity.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookRepository extends JpaRepository<Book, Long>, JpaSpecificationExecutor<Book> {

    Optional<Book> findBySlug(String slug);

    long countByStockQuantityLessThan(int stockQuantity);

    List<Book> findTop10ByStatusOrderBySoldQuantityDesc(Book.Status status);

    List<Book> findTop10ByStatusOrderByCreatedAtDesc(Book.Status status);

    List<Book> findTop8ByStatusOrderByCreatedAtDesc(Book.Status status);

    @Query("SELECT DISTINCT b FROM Book b JOIN b.bookCategories bc WHERE bc.category.id IN :categoryIds AND b.status = :status AND b.id <> :excludeBookId")
    List<Book> findRelatedBooksByCategory(
            @Param("categoryIds") Collection<Long> categoryIds,
            @Param("status") Book.Status status,
            @Param("excludeBookId") Long excludeBookId,
            Pageable pageable
    );

    @Query(value = "SELECT DISTINCT b FROM Book b JOIN b.bookCategories bc WHERE bc.category.id IN :categoryIds AND b.status = :status",
            countQuery = "SELECT COUNT(DISTINCT b) FROM Book b JOIN b.bookCategories bc WHERE bc.category.id IN :categoryIds AND b.status = :status")
    Page<Book> findByCategoriesIn(
            @Param("categoryIds") Collection<Long> categoryIds,
            @Param("status") Book.Status status,
            Pageable pageable
    );

    @Query("SELECT DISTINCT b FROM Book b JOIN b.authors ba WHERE ba.author.id IN :authorIds AND b.status = :status")
    List<Book> findByAuthorIdsIn(
            @Param("authorIds") Collection<Long> authorIds,
            @Param("status") Book.Status status,
            Pageable pageable
    );

    Boolean existsBySlug(String slug);

    Boolean existsByIsbn(String isbn);
}
