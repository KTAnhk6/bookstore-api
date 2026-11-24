package com.bookstore.api.controller;

import com.bookstore.api.common.ApiResponse;
import com.bookstore.api.dto.response.DashboardStatsResponse;
import com.bookstore.api.dto.response.OrderResponse;
import com.bookstore.api.entity.Order;
import com.bookstore.api.exception.ResourceNotFoundException;
import com.bookstore.api.repository.BookRepository;
import com.bookstore.api.repository.OrderRepository;
import com.bookstore.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import com.bookstore.api.common.PaginationMetadata;
import com.bookstore.api.common.SortParams;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
@RequiredArgsConstructor
public class AdminController {

    // Cột bảng đơn hàng -> thuộc tính entity được phép sắp xếp
    private static final Map<String, String> ORDER_SORT_FIELDS = Map.of(
            "code", "orderCode", "customer", "user.fullName", "phone", "user.phone", "createdAt", "createdAt",
            "total", "totalAmount", "payment", "paymentStatus", "status", "status");

    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final com.bookstore.api.service.DashboardService dashboardService;
    private final com.bookstore.api.service.OrderService orderService;

    @GetMapping({"/dashboard-stats"})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getDashboardStats() {
        DashboardStatsResponse stats = dashboardService.getStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Order.OrderStatus status,
            @RequestParam(required = false) String sortBy
    ) {
        Sort sort = SortParams.parse(sortBy, ORDER_SORT_FIELDS, Sort.by(Sort.Direction.DESC, "createdAt"));
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 200), sort);
        Page<Order> orderPage = status == null ? orderRepository.findAll(pageable) : orderRepository.findByStatus(status, pageable);
        List<OrderResponse> content = orderPage.getContent().stream()
                .map(OrderResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đơn hàng thành công", content, PaginationMetadata.fromPage(orderPage)));
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam Order.OrderStatus status
    ) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái đơn hàng thành công", orderService.adminUpdateStatus(id, status)));
    }

    @PutMapping("/orders/{id}/refunded")
    public ResponseEntity<ApiResponse<OrderResponse>> markOrderRefunded(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Đã xác nhận hoàn tiền cho đơn hàng", orderService.adminMarkRefunded(id)));
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(@PathVariable Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));
        return ResponseEntity.ok(ApiResponse.success(OrderResponse.fromEntity(order)));
    }
}
