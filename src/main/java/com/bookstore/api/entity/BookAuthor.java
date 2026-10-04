package com.bookstore.api.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "book_authors", uniqueConstraints = @UniqueConstraint(name = "uk_book_author", columnNames = { "book_id",
        "author_id" }))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookAuthor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private Author author;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.author;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null)
            this.createdAt = LocalDateTime.now();
        if (this.role == null)
            this.role = Role.author;
        if (this.sortOrder == null)
            this.sortOrder = 0;
    }

    public enum Role {
        author, co_author, translator, editor
    }
}