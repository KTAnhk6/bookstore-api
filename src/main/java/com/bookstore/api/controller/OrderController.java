package com.bookstore.api.controller;

import com.bookstore.api.common.ApiResponse;
import com.bookstore.api.common.PaginationMetadata;
import com.bookstore.api.dto.request.CancelOrderRequest;
import com.bookstore.api.dto.request.OrderRequest;
import com.bookstore.api.dto.response.OrderResponse;
import com.bookstore.api.entity.Order;
import com.bookstore.api.security.CustomUserDetails;
import com.bookstore.api.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody OrderRequest request
    ) {
        OrderResponse response = orderService.createOrder(userDetails.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đặt hàng thành công", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getUserOrders(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) Order.OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<OrderResponse> orderPage = orderService.getUserOrders(userDetails.getId(), status, pageable);
        PaginationMetadata pagination = PaginationMetadata.fromPage(orderPage);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đơn hàng thành công", orderPage.getContent(), pagination));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id
    ) {
        OrderResponse response = orderService.getOrderById(userDetails.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/code/{orderCode}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderByCode(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String orderCode
    ) {
        OrderResponse response = orderService.getOrderByCode(userDetails.getId(), orderCode);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody CancelOrderRequest request
    ) {
        OrderResponse response = orderService.cancelOrder(userDetails.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Hủy đơn hàng thành công", response));
    }
}
