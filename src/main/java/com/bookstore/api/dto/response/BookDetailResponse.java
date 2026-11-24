package com.bookstore.api.dto.response;

import com.bookstore.api.entity.Book;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookDetailResponse {

    private Long id;
    private String title;
    private String slug;
    private String isbn;
    private String description;
    private BigDecimal price;
    private BigDecimal salePrice;
    private Integer stockQuantity;
    private Integer soldQuantity;
    private Integer publishYear;
    private Integer pageCount;
    private String dimensions;
    private Integer weight;
    private String language;
    private String coverImage;
    private List<AuthorResponse> authors;
    private PublisherResponse publisher;
    private List<CategoryResponse> categories;
    private Book.Status status;
    private List<BookResponse> relatedBooks;
    private LocalDateTime createdAt;
    private Double averageRating;
    private Long reviewCount;
    private LocalDateTime updatedAt;

    public static BookDetailResponse fromEntity(Book book, List<BookResponse> relatedBooks) {
        if (book == null) return null;
        return BookDetailResponse.builder()
                .id(book.getId())
                .title(book.getTitle())
                .slug(book.getSlug())
                .isbn(book.getIsbn())
                .description(book.getDescription())
                .price(book.getPrice())
                .salePrice(book.getSalePrice())
                .stockQuantity(book.getStockQuantity())
                .soldQuantity(book.getSoldQuantity())
                .publishYear(book.getPublishYear())
                .pageCount(book.getPageCount())
                .dimensions(book.getDimensions())
                .weight(book.getWeight())
                .language(book.getLanguage())
                .coverImage(book.getCoverImage())
                .authors(book.getAuthors() != null ? book.getAuthors().stream()
                        .map(ba -> AuthorResponse.fromEntity(ba.getAuthor()))
                        .collect(Collectors.toList()) : List.of())
                .publisher(PublisherResponse.fromEntity(book.getPublisher()))
                .categories(book.getBookCategories() != null ? book.getBookCategories().stream()
                        .map(bc -> CategoryResponse.fromEntity(bc.getCategory()))
                        .collect(Collectors.toList()) : List.of())
                .status(book.getStatus())
                .relatedBooks(relatedBooks)
                .createdAt(book.getCreatedAt())
                .updatedAt(book.getUpdatedAt())
                .build();
    }
}
