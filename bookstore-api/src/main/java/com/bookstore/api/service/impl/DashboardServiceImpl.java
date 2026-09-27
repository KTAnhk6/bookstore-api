package com.bookstore.api.service.impl;

import com.bookstore.api.dto.response.DashboardStatsResponse;
import com.bookstore.api.entity.Order;
import com.bookstore.api.entity.Review;
import com.bookstore.api.repository.*;
import com.bookstore.api.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final OrderRepository orderRepository;
    private final ReviewRepository reviewRepository;

    @Override
    public DashboardStatsResponse getStats() {
        Long totalUsers = userRepository.count();
        Long totalBooks = bookRepository.count();
        Long totalOrders = orderRepository.count();

        BigDecimal totalRevenue = orderRepository.findAll().stream()
                .filter(o -> o.getOrderStatus() == Order.OrderStatus.DELIVERED)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Long pendingOrders = orderRepository.findAll().stream()
                .filter(o -> o.getOrderStatus() == Order.OrderStatus.PENDING)
                .count();

        Long pendingReviews = reviewRepository.findByStatus(Review.Status.PENDING).size();

        return DashboardStatsResponse.builder()
                .totalUsers(totalUsers)
                .totalBooks(totalBooks)
                .totalOrders(totalOrders)
                .totalRevenue(totalRevenue)
                .pendingOrders(pendingOrders)
                .pendingReviews(pendingReviews)
                .build();
    }
}