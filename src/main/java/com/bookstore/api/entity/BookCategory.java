package com.bookstore.api.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "book_categories", uniqueConstraints = @UniqueConstraint(name = "uk_book_category", columnNames = {
        "book_id", "category_id" }))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(name = "is_primary", nullable = false)
    private Boolean isPrimary = false;

    @PrePersist
    public void prePersist() {
        if (this.isPrimary == null)
            this.isPrimary = false;
    }
}