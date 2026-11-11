package com.bookstore.api.controller;

import com.bookstore.api.common.ApiResponse;
import com.bookstore.api.dto.request.PublisherRequest;
import com.bookstore.api.dto.response.PublisherResponse;
import com.bookstore.api.service.PublisherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/publishers")
@RequiredArgsConstructor
public class PublisherController {

    private final PublisherService publisherService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PublisherResponse>>> getAllPublishers() {
        List<PublisherResponse> response = publisherService.getAllPublishers();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PublisherResponse>> getPublisherById(@PathVariable Long id) {
        PublisherResponse response = publisherService.getPublisherById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<ApiResponse<PublisherResponse>> getPublisherBySlug(@PathVariable String slug) {
        PublisherResponse response = publisherService.getPublisherBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<PublisherResponse>> createPublisher(@Valid @RequestBody PublisherRequest request) {
        PublisherResponse response = publisherService.createPublisher(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm nhà xuất bản thành công", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<PublisherResponse>> updatePublisher(
            @PathVariable Long id,
            @Valid @RequestBody PublisherRequest request
    ) {
        PublisherResponse response = publisherService.updatePublisher(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật nhà xuất bản thành công", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deletePublisher(@PathVariable Long id) {
        publisherService.deletePublisher(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa nhà xuất bản thành công", null));
    }
}
