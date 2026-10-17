package com.bookstore.api.service.impl;

import com.bookstore.api.dto.request.BookRequest;
import com.bookstore.api.dto.response.BookDetailResponse;
import com.bookstore.api.dto.response.BookResponse;
import com.bookstore.api.entity.Author;
import com.bookstore.api.entity.Book;
import com.bookstore.api.entity.Category;
import com.bookstore.api.entity.Publisher;
import com.bookstore.api.exception.BadRequestException;
import com.bookstore.api.exception.ResourceNotFoundException;
import com.bookstore.api.repository.AuthorRepository;
import com.bookstore.api.repository.BookRepository;
import com.bookstore.api.repository.CategoryRepository;
import com.bookstore.api.repository.PublisherRepository;
import com.bookstore.api.service.BookService;

import com.bookstore.api.entity.SearchHistory;
import com.bookstore.api.entity.User;
import com.bookstore.api.repository.SearchHistoryRepository;
import com.bookstore.api.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import com.bookstore.api.entity.Review;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookServiceImpl implements BookService {

    private final BookRepository bookRepository;
    private final AuthorRepository authorRepository;
    private final PublisherRepository publisherRepository;

    private final SearchHistoryRepository searchHistoryRepository;
    private final UserRepository userRepository;

    private final CategoryRepository categoryRepository;
    private final com.bookstore.api.service.BookRatingEnricher ratingEnricher;

    @Override
    @Transactional(readOnly = true)
    public Page<BookResponse> searchAndFilterBooks(
            String keyword,
            Long categoryId,
            String categorySlug,
            Long authorId,
            String authorSlug,
            Long publisherId,
            String publisherSlug,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Double minRating,
            Boolean inStock,
            Boolean featured,
            String sortBy,
            Pageable pageable
    ) {
        Specification<Book> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // By default only active books
            predicates.add(cb.equal(root.get("status"), Book.Status.AVAILABLE));

            // Keyword search in title, isbn, description, author name
            if (keyword != null && !keyword.trim().isEmpty()) {
                String searchPattern = "%" + keyword.trim().toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), searchPattern);
                Predicate descMatch = cb.like(cb.lower(root.get("description")), searchPattern);
                Predicate isbnMatch = cb.like(cb.lower(root.get("isbn")), searchPattern);

                Join<Book, com.bookstore.api.entity.BookAuthor> baJoin = root.join("authors", JoinType.LEFT);
                Join<com.bookstore.api.entity.BookAuthor, Author> authorJoin = baJoin.join("author", JoinType.LEFT);
                Predicate authorMatch = cb.like(cb.lower(authorJoin.get("name")), searchPattern);

                predicates.add(cb.or(titleMatch, descMatch, isbnMatch, authorMatch));
            }

            // Category filter
            if (categoryId != null) {
                Join<Book, com.bookstore.api.entity.BookCategory> bcJoin = root.join("bookCategories", JoinType.INNER);
                Join<com.bookstore.api.entity.BookCategory, Category> catJoin = bcJoin.join("category", JoinType.INNER);
                predicates.add(cb.equal(catJoin.get("id"), categoryId));
            } else if (categorySlug != null && !categorySlug.trim().isEmpty()) {
                Join<Book, com.bookstore.api.entity.BookCategory> bcJoin = root.join("bookCategories", JoinType.INNER);
                Join<com.bookstore.api.entity.BookCategory, Category> catJoin = bcJoin.join("category", JoinType.INNER);
                predicates.add(cb.equal(catJoin.get("slug"), categorySlug.trim()));
            }

            // Author filter
            if (authorId != null) {
                Join<Book, com.bookstore.api.entity.BookAuthor> baJoin = root.join("authors", JoinType.INNER);
                predicates.add(cb.equal(baJoin.get("author").get("id"), authorId));
            } else if (authorSlug != null && !authorSlug.trim().isEmpty()) {
                Join<Book, com.bookstore.api.entity.BookAuthor> baJoin = root.join("authors", JoinType.INNER);
                Join<com.bookstore.api.entity.BookAuthor, Author> authorJoin = baJoin.join("author", JoinType.INNER);
                predicates.add(cb.equal(authorJoin.get("slug"), authorSlug.trim()));
            }

            // Publisher filter
            if (publisherId != null) {
                predicates.add(cb.equal(root.get("publisher").get("id"), publisherId));
            } else if (publisherSlug != null && !publisherSlug.trim().isEmpty()) {
                Join<Book, Publisher> pubJoin = root.join("publisher", JoinType.INNER);
                predicates.add(cb.equal(pubJoin.get("slug"), publisherSlug.trim()));
            }

            // Price range filter
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(cb.coalesce(root.<BigDecimal>get("salePrice"), root.<BigDecimal>get("price")), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(cb.coalesce(root.<BigDecimal>get("salePrice"), root.<BigDecimal>get("price")), maxPrice));
            }

            // In stock filter
            if (Boolean.TRUE.equals(inStock)) {
                predicates.add(cb.greaterThan(root.get("stockQuantity"), 0));
            }

            // Rating filter / sort use a correlated subquery over reviews
            Subquery<Double> avgRating = query.subquery(Double.class);
            Root<Review> rv = avgRating.from(Review.class);
            avgRating.select(cb.avg(rv.<Integer>get("rating"))).where(cb.equal(rv.get("book"), root));
            if (minRating != null && minRating > 0) {
                predicates.add(cb.greaterThanOrEqualTo(cb.coalesce(avgRating, 0.0), minRating));
            }

            if (query != null) {
                query.distinct(true);
                if (query.getResultType() != Long.class && sortBy != null) {
                    Expression<BigDecimal> effectivePrice = cb.coalesce(root.<BigDecimal>get("salePrice"), root.<BigDecimal>get("price"));
                    switch (sortBy.toLowerCase()) {
                        case "price_asc", "price-asc" -> query.orderBy(cb.asc(effectivePrice));
                        case "price_desc", "price-desc" -> query.orderBy(cb.desc(effectivePrice));
                        case "rating", "rating_desc" -> query.orderBy(cb.desc(cb.coalesce(avgRating, 0.0)), cb.desc(root.get("soldQuantity")));
                        default -> { }
                    }
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        // Custom sort
        Sort sort = buildSort(sortBy);
        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);

        Page<BookResponse> page = bookRepository.findAll(spec, sortedPageable).map(BookResponse::fromEntity);
        ratingEnricher.enrich(page.getContent());
        return page;
    }

    private Sort buildSort(String sortBy) {
        if (sortBy == null) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        return switch (sortBy.toLowerCase()) {
            case "price_asc", "price-asc", "price_desc", "price-desc", "rating", "rating_desc" -> Sort.unsorted(); // sắp xếp trong Specification

            case "sales_desc", "sales", "popular" -> Sort.by(Sort.Direction.DESC, "soldQuantity");
            case "title_asc", "title" -> Sort.by(Sort.Direction.ASC, "title");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
    }

    @Override
    @Transactional(readOnly = true)
    public BookDetailResponse getBookById(Long id) {


        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book", "id", id));
        List<BookResponse> relatedBooks = getRelatedBooks(book.getId(), 6);
        return ratingEnricher.enrich(BookDetailResponse.fromEntity(book, relatedBooks));
    }

    @Override
    @Transactional(readOnly = true)
    public BookDetailResponse getBookBySlug(String slug) {
        Book book = bookRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Book", "slug", slug));
        List<BookResponse> relatedBooks = getRelatedBooks(book.getId(), 6);
        return ratingEnricher.enrich(BookDetailResponse.fromEntity(book, relatedBooks));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookResponse> getFeaturedBooks(int limit) {
        return ratingEnricher.enrich(bookRepository.findTop8ByStatusOrderByCreatedAtDesc(Book.Status.AVAILABLE).stream()
                .limit(limit)
                .map(BookResponse::fromEntity)
                .collect(Collectors.toList()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookResponse> getBestSellers(int limit) {
        return ratingEnricher.enrich(bookRepository.findTop10ByStatusOrderBySoldQuantityDesc(Book.Status.AVAILABLE).stream()
                .limit(limit)
                .map(BookResponse::fromEntity)
                .collect(Collectors.toList()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookResponse> getNewestBooks(int limit) {
        return ratingEnricher.enrich(bookRepository.findTop10ByStatusOrderByCreatedAtDesc(Book.Status.AVAILABLE).stream()
                .limit(limit)
                .map(BookResponse::fromEntity)
                .collect(Collectors.toList()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookResponse> getRelatedBooks(Long bookId, int limit) {
        Book book = bookRepository.findById(bookId).orElse(null);
        if (book == null || book.getBookCategories() == null || book.getBookCategories().isEmpty()) {
            return Collections.emptyList();
        }

        Set<Long> categoryIds = book.getBookCategories().stream()
                .map(bc -> bc.getCategory().getId())
                .collect(Collectors.toSet());

        return ratingEnricher.enrich(bookRepository.findRelatedBooksByCategory(
                categoryIds,
                Book.Status.AVAILABLE,
                bookId,
                PageRequest.of(0, limit)
        ).stream()
                .map(BookResponse::fromEntity)
                .collect(Collectors.toList()));
    }


    @Override
    @Transactional
    public BookResponse createBook(BookRequest request) {
        if (request.getSubCategoryIds() != null && request.getSubCategoryIds().size() > 2) {
            throw new BadRequestException("Một cuốn sách chỉ có thể có tối đa 2 thể loại phụ");
        }



        String slug = request.getSlug() != null && !request.getSlug().isBlank()
                ? CategoryServiceImpl.toSlug(request.getSlug())
                : CategoryServiceImpl.toSlug(request.getTitle());

        if (bookRepository.existsBySlug(slug)) {
            slug = slug + "-" + System.currentTimeMillis() % 10000;
        }

        Publisher publisher = null;
        if (request.getPublisherId() != null) {
            publisher = publisherRepository.findById(request.getPublisherId())
                    .orElseThrow(() -> new ResourceNotFoundException("Publisher", "id", request.getPublisherId()));
        }

        Book book = Book.builder()
                .title(request.getTitle().trim())
                .slug(slug)
                .isbn(request.getIsbn())
                .description(request.getDescription())
                .price(request.getPrice())
                .salePrice(request.getSalePrice())
                .stockQuantity(request.getStockQuantity())
                .soldQuantity(0)
                .publishYear(request.getPublishYear())
                .pageCount(request.getPageCount())
                .dimensions(request.getDimensions())
                .weight(request.getWeight())
                .language(request.getLanguage() != null ? request.getLanguage() : "Tiếng Việt")
                .coverImage(request.getCoverImage())
                .publisher(publisher)
                .status(request.getStatus() != null ? request.getStatus() : Book.Status.AVAILABLE)
                .build();

        if (request.getAuthorIds() != null && !request.getAuthorIds().isEmpty()) {
            List<Author> authors = authorRepository.findAllById(request.getAuthorIds());
            for (int i = 0; i < authors.size(); i++) {
                book.getAuthors().add(com.bookstore.api.entity.BookAuthor.builder()
                        .book(book)
                        .author(authors.get(i))
                        .sortOrder(i)
                        .build());
            }
        }

        if (request.getPrimaryCategoryId() != null) {
            Category primary = categoryRepository.findById(request.getPrimaryCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getPrimaryCategoryId()));
            book.getBookCategories().add(com.bookstore.api.entity.BookCategory.builder()
                    .book(book)
                    .category(primary)
                    .isPrimary(true)
                    .build());
        }

        if (request.getSubCategoryIds() != null && !request.getSubCategoryIds().isEmpty()) {
            List<Category> subs = categoryRepository.findByIdIn(request.getSubCategoryIds());
            for (Category sub : subs) {
                book.getBookCategories().add(com.bookstore.api.entity.BookCategory.builder()
                        .book(book)
                        .category(sub)
                        .isPrimary(false)
                        .build());
            }
        }

        book = bookRepository.save(book);
        return BookResponse.fromEntity(book);
    }


    @Override
    @Transactional
    public BookResponse updateBook(Long id, BookRequest request) {
        if (request.getSubCategoryIds() != null && request.getSubCategoryIds().size() > 2) {
            throw new BadRequestException("Một cuốn sách chỉ có thể có tối đa 2 thể loại phụ");
        }



        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book", "id", id));

        book.setTitle(request.getTitle().trim());
        if (request.getSlug() != null && !request.getSlug().isBlank()) {
            book.setSlug(CategoryServiceImpl.toSlug(request.getSlug()));
        }
        book.setIsbn(request.getIsbn());
        book.setDescription(request.getDescription());
        book.setPrice(request.getPrice());
        book.setSalePrice(request.getSalePrice());
        book.setStockQuantity(request.getStockQuantity());
        book.setPublishYear(request.getPublishYear());
        book.setPageCount(request.getPageCount());
        book.setDimensions(request.getDimensions());
        book.setWeight(request.getWeight());
        if (request.getLanguage() != null) {
            book.setLanguage(request.getLanguage());
        }
        if (request.getCoverImage() != null) {
            book.setCoverImage(request.getCoverImage());
        }

        if (request.getPublisherId() != null) {
            Publisher publisher = publisherRepository.findById(request.getPublisherId())
                    .orElseThrow(() -> new ResourceNotFoundException("Publisher", "id", request.getPublisherId()));
            book.setPublisher(publisher);
        }

        if (request.getAuthorIds() != null) {
            book.getAuthors().clear();
            bookRepository.flush(); // xoá liên kết cũ trước, tránh trùng khoá uk_book_author khi thêm lại
            List<Author> authors = authorRepository.findAllById(request.getAuthorIds());
            for (int i = 0; i < authors.size(); i++) {
                book.getAuthors().add(com.bookstore.api.entity.BookAuthor.builder()
                        .book(book)
                        .author(authors.get(i))
                        .sortOrder(i)
                        .build());
            }
        }

        if (request.getPrimaryCategoryId() != null) {
            book.getBookCategories().clear();
            bookRepository.flush();
            Category primary = categoryRepository.findById(request.getPrimaryCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getPrimaryCategoryId()));
            book.getBookCategories().add(com.bookstore.api.entity.BookCategory.builder()
                    .book(book)
                    .category(primary)
                    .isPrimary(true)
                    .build());

            if (request.getSubCategoryIds() != null && !request.getSubCategoryIds().isEmpty()) {
                List<Category> subs = categoryRepository.findByIdIn(request.getSubCategoryIds());
                for (Category sub : subs) {
                    book.getBookCategories().add(com.bookstore.api.entity.BookCategory.builder()
                            .book(book)
                            .category(sub)
                            .isPrimary(false)
                            .build());
                }
            }
        }

        if (request.getStatus() != null) {
            book.setStatus(request.getStatus());
        }

        book = bookRepository.save(book);
        return BookResponse.fromEntity(book);
    }

    @Override
    @Transactional
    public void deleteBook(Long id) {


        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book", "id", id));
        bookRepository.delete(book);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookResponse> getAll() {
        return bookRepository.findAll().stream()
                .map(BookResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BookResponse getById(Long id) {


        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book", "id", id));
        return BookResponse.fromEntity(book);
    }

    @Override
    @Transactional
    public BookResponse create(BookRequest request) {
        return createBook(request);
    }

    @Override
    @Transactional
    public BookResponse update(Long id, BookRequest request) {
        return updateBook(id, request);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        deleteBook(id);
    }
}
