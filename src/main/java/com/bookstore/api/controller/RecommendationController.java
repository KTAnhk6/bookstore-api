package com.bookstore.api.controller;

import com.bookstore.api.common.ApiResponse;
import com.bookstore.api.dto.response.BookResponse;
import com.bookstore.api.security.CustomUserDetails;
import com.bookstore.api.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BookResponse>>> getRecommendations(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "10") int limit
    ) {
        Long userId = userDetails != null ? userDetails.getId() : null;
        List<BookResponse> response = recommendationService.getPersonalizedRecommendations(userId, limit);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đề xuất thành công", response));
    }

    @GetMapping("/trending")
    public ResponseEntity<ApiResponse<List<BookResponse>>> getTrendingRecommendations(
            @RequestParam(defaultValue = "10") int limit
    ) {
        List<BookResponse> response = recommendationService.getTrendingRecommendations(limit);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách thịnh hành thành công", response));
    }

    @GetMapping("/similar/{bookId}")
    public ResponseEntity<ApiResponse<List<BookResponse>>> getSimilarBooks(
            @PathVariable Long bookId,
            @RequestParam(defaultValue = "6") int limit
    ) {
        List<BookResponse> response = recommendationService.getSimilarBooks(bookId, limit);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách sách tương tự thành công", response));
    }
}
