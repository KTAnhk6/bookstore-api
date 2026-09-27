package com.bookstore.api.service.impl;

import com.bookstore.api.dto.request.BookRequest;
import com.bookstore.api.dto.response.BookResponse;
import com.bookstore.api.dto.response.CategoryResponse;
import com.bookstore.api.entity.Book;
import com.bookstore.api.entity.BookCategory;
import com.bookstore.api.entity.Category;
import com.bookstore.api.entity.Publisher;
import com.bookstore.api.exception.ResourceNotFoundException;
import com.bookstore.api.repository.*;
import com.bookstore.api.service.BookService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class BookServiceImpl implements BookService {

    private final BookRepository bookRepository;
    private final CategoryRepository categoryRepository;
    private final PublisherRepository publisherRepository;
    private final BookCategoryRepository bookCategoryRepository;

    @Override
    public List<BookResponse> getAll() {
        return bookRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public BookResponse getById(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách id=" + id));
        return toResponse(book);
    }

    @Override
    @Transactional
    public BookResponse create(BookRequest request) {
        Publisher publisher = null;
        if (request.getPublisherId() != null) {
            publisher = publisherRepository.findById(request.getPublisherId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy NXB"));
        }

        Book book = Book.builder()
                .title(request.getTitle())
                .slug(toSlug(request.getTitle()))
                .description(request.getDescription())
                .coverImage(request.getCoverImage())
                .publisher(publisher)
                .publishYear(request.getPublishYear())
                .pageCount(request.getPageCount())
                .language(request.getLanguage() != null ? request.getLanguage() : "vi")
                .dimensions(request.getDimensions())
                .weight(request.getWeight())
                .price(request.getPrice())
                .salePrice(request.getSalePrice())
                .stockQuantity(request.getStockQuantity() != null ? request.getStockQuantity() : 0)
                .soldQuantity(0)
                .status(Book.Status.AVAILABLE)
                .build();

        book = bookRepository.save(book);
        saveBookCategories(book, request.getCategoryIds());
        return toResponse(book);
    }

    @Override
    @Transactional
    public BookResponse update(Long id, BookRequest request) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách id=" + id));

        book.setTitle(request.getTitle());
        book.setSlug(toSlug(request.getTitle()));
        book.setDescription(request.getDescription());
        book.setCoverImage(request.getCoverImage());
        book.setPublishYear(request.getPublishYear());
        book.setPageCount(request.getPageCount());
        book.setLanguage(request.getLanguage());
        book.setDimensions(request.getDimensions());
        book.setWeight(request.getWeight());
        book.setPrice(request.getPrice());
        book.setSalePrice(request.getSalePrice());
        if (request.getStockQuantity() != null) {
            book.setStockQuantity(request.getStockQuantity());
        }

        if (request.getPublisherId() != null) {
            Publisher publisher = publisherRepository.findById(request.getPublisherId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy NXB"));
            book.setPublisher(publisher);
        }

        book = bookRepository.save(book);

        // reset thể loại
        bookCategoryRepository.deleteAll(bookCategoryRepository.findByBookId(book.getId()));
        saveBookCategories(book, request.getCategoryIds());

        return toResponse(book);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách id=" + id));
        book.setDeletedAt(java.time.LocalDateTime.now());
        book.setStatus(Book.Status.DISCONTINUED);
        bookRepository.save(book);
    }

    private void saveBookCategories(Book book, List<Long> categoryIds) {
        if (categoryIds == null || categoryIds.isEmpty()) return;
        for (int i = 0; i < categoryIds.size(); i++) {
            Long catId = categoryIds.get(i);
            Category category = categoryRepository.findById(catId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thể loại id=" + catId));
            BookCategory bc = BookCategory.builder()
                    .book(book)
                    .category(category)
                    .isPrimary(i == 0)
                    .build();
            bookCategoryRepository.save(bc);
        }
    }

    private BookResponse toResponse(Book b) {
        List<BookCategory> bcs = bookCategoryRepository.findByBookId(b.getId());
        List<CategoryResponse> categories = bcs.stream()
                .map(bc -> CategoryResponse.builder()
                        .id(bc.getCategory().getId())
                        .name(bc.getCategory().getName())
                        .slug(bc.getCategory().getSlug())
                        .build())
                .toList();

        return BookResponse.builder()
                .id(b.getId())
                .title(b.getTitle())
                .slug(b.getSlug())
                .isbn(b.getIsbn())
                .description(b.getDescription())
                .coverImage(b.getCoverImage())
                .publisherName(b.getPublisher() != null ? b.getPublisher().getName() : null)
                .publishYear(b.getPublishYear())
                .pageCount(b.getPageCount())
                .language(b.getLanguage())
                .price(b.getPrice())
                .salePrice(b.getSalePrice())
                .stockQuantity(b.getStockQuantity())
                .soldQuantity(b.getSoldQuantity())
                .status(b.getStatus().name())
                .categories(categories)
                .createdAt(b.getCreatedAt())
                .build();
    }

    private String toSlug(String input) {
        String s = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .replaceAll("đ", "d").replaceAll("Đ", "D");
        s = s.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-").replaceAll("-+", "-");
        return s + "-" + System.currentTimeMillis();
    }
}