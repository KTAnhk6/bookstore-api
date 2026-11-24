package com.bookstore.api.controller;

import com.bookstore.api.common.ApiResponse;
import com.bookstore.api.common.PaginationMetadata;
import com.bookstore.api.common.SortParams;
import com.bookstore.api.dto.response.ReviewResponse;
import com.bookstore.api.entity.Review;
import com.bookstore.api.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/reviews")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','STAFF')")
public class AdminReviewController {

    // Cột bảng admin -> thuộc tính entity được phép sắp xếp
    private static final Map<String, String> SORT_FIELDS = Map.of(
            "book", "book.title", "user", "user.fullName", "rating", "rating",
            "createdAt", "createdAt", "status", "status");

    private final ReviewService reviewService;

    @GetMapping
    public ApiResponse<List<ReviewResponse>> getAll(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) Review.Status status,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Sort sort = SortParams.parse(sortBy, SORT_FIELDS, Sort.by(Sort.Direction.DESC, "createdAt"));
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 100), sort);
        Page<ReviewResponse> reviewPage = reviewService.searchForAdmin(keyword, rating, status, pageable);
        return ApiResponse.success("Lấy danh sách đánh giá thành công", reviewPage.getContent(), PaginationMetadata.fromPage(reviewPage));
    }

    @PutMapping("/{id}/status")
    public ApiResponse<ReviewResponse> setStatus(@PathVariable Long id, @RequestParam Review.Status status) {
        String message = switch (status) {
            case APPROVED -> "Đã duyệt đánh giá";
            case REJECTED -> "Đã từ chối đánh giá";
            case PENDING -> "Đã chuyển đánh giá về chờ duyệt";
        };
        return ApiResponse.success(message, reviewService.setStatus(id, status));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        reviewService.deleteByAdmin(id);
        return ApiResponse.success("Đã xoá đánh giá", null);
    }
}
