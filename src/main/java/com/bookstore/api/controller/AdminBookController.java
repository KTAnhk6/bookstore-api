package com.bookstore.api.controller;

import com.bookstore.api.common.ApiResponse;
import com.bookstore.api.common.PaginationMetadata;
import com.bookstore.api.dto.request.BookRequest;
import com.bookstore.api.dto.response.BookResponse;
import com.bookstore.api.entity.Book;
import com.bookstore.api.service.BookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/books")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','STAFF')")
public class AdminBookController {

    private final BookService bookService;

    @GetMapping
    public ApiResponse<List<BookResponse>> getAll(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Book.Status status,
            @RequestParam(defaultValue = "newest") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<BookResponse> bookPage = bookService.searchForAdmin(keyword, categoryId, status, sortBy,
                PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 100)));
        return ApiResponse.success("Lấy danh sách sách thành công", bookPage.getContent(), PaginationMetadata.fromPage(bookPage));
    }

    @GetMapping("/{id}")
    public ApiResponse<BookResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(bookService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<BookResponse> create(@Valid @RequestBody BookRequest request) {
        return ApiResponse.success("Tạo sách thành công", bookService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<BookResponse> update(@PathVariable Long id,
                                            @Valid @RequestBody BookRequest request) {
        return ApiResponse.success("Cập nhật thành công", bookService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        bookService.delete(id);
        return ApiResponse.success("Xóa thành công", null);
    }
}