package com.bookstore.api.controller;

import com.bookstore.api.common.ApiResponse;
import com.bookstore.api.common.PaginationMetadata;
import com.bookstore.api.dto.request.BookRequest;
import com.bookstore.api.dto.response.BookDetailResponse;
import com.bookstore.api.dto.response.BookResponse;
import com.bookstore.api.entity.Book;
import com.bookstore.api.exception.ResourceNotFoundException;
import com.bookstore.api.service.BookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BookResponse>>> getBooks(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String categorySlug,
            @RequestParam(required = false) Long authorId,
            @RequestParam(required = false) String authorSlug,
            @RequestParam(required = false) Long publisherId,
            @RequestParam(required = false) String publisherSlug,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(required = false) Boolean featured,
            @RequestParam(defaultValue = "newest") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 100));
        Page<BookResponse> bookPage = bookService.searchAndFilterBooks(
                keyword, categoryId, categorySlug, authorId, authorSlug,
                publisherId, publisherSlug, minPrice, maxPrice, minRating,
                inStock, featured, sortBy, pageable
        );

        PaginationMetadata pagination = PaginationMetadata.fromPage(bookPage);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách sách thành công", bookPage.getContent(), pagination));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookDetailResponse>> getBookById(@PathVariable Long id, Authentication auth) {
        BookDetailResponse response = hideDiscontinued(bookService.getBookById(id), auth);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<ApiResponse<BookDetailResponse>> getBookBySlug(@PathVariable String slug, Authentication auth) {
        BookDetailResponse response = hideDiscontinued(bookService.getBookBySlug(slug), auth);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /** Sách ngừng kinh doanh chỉ admin/nhân viên xem được (để sửa), khách nhận 404. */
    private static BookDetailResponse hideDiscontinued(BookDetailResponse book, Authentication auth) {
        if (book.getStatus() != Book.Status.DISCONTINUED) return book;
        boolean staff = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()) || "ROLE_STAFF".equals(a.getAuthority()));
        if (!staff) throw new ResourceNotFoundException("Book", "id", book.getId());
        return book;
    }

    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<List<BookResponse>>> getFeaturedBooks(
            @RequestParam(defaultValue = "8") int limit
    ) {
        List<BookResponse> response = bookService.getFeaturedBooks(Math.clamp(limit, 1, 50));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/bestsellers")
    public ResponseEntity<ApiResponse<List<BookResponse>>> getBestSellers(
            @RequestParam(defaultValue = "10") int limit
    ) {
        List<BookResponse> response = bookService.getBestSellers(Math.clamp(limit, 1, 50));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/newest")
    public ResponseEntity<ApiResponse<List<BookResponse>>> getNewestBooks(
            @RequestParam(defaultValue = "10") int limit
    ) {
        List<BookResponse> response = bookService.getNewestBooks(Math.clamp(limit, 1, 50));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/related")
    public ResponseEntity<ApiResponse<List<BookResponse>>> getRelatedBooks(
            @PathVariable Long id,
            @RequestParam(defaultValue = "6") int limit
    ) {
        List<BookResponse> response = bookService.getRelatedBooks(id, Math.clamp(limit, 1, 50));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<BookResponse>> createBook(@Valid @RequestBody BookRequest request) {
        BookResponse response = bookService.createBook(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm sách mới thành công", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<BookResponse>> updateBook(
            @PathVariable Long id,
            @Valid @RequestBody BookRequest request
    ) {
        BookResponse response = bookService.updateBook(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật sách thành công", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteBook(@PathVariable Long id) {
        bookService.deleteBook(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa sách thành công", null));
    }
}
