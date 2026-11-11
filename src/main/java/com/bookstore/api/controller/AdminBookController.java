package com.bookstore.api.controller;

import com.bookstore.api.common.ApiResponse;
import com.bookstore.api.dto.request.BookRequest;
import com.bookstore.api.dto.response.BookResponse;
import com.bookstore.api.service.BookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
    public ApiResponse<List<BookResponse>> getAll() {
        return ApiResponse.success(bookService.getAll());
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