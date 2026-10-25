package com.bookstore.api.service.impl;

import com.bookstore.api.dto.response.DashboardStatsResponse;
import com.bookstore.api.entity.Order;
import com.bookstore.api.repository.BookRepository;
import com.bookstore.api.repository.OrderRepository;
import com.bookstore.api.repository.UserRepository;
import com.bookstore.api.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bookstore.api.dto.response.OrderResponse;
import com.bookstore.api.entity.User;
import com.bookstore.api.repository.OrderItemRepository;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    @Override
    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats() {
        List<Order> orders = orderRepository.findAll();
        int year = LocalDate.now().getYear();

        BigDecimal[] revenueByMonth = new BigDecimal[12];
        long[] ordersByMonth = new long[12];
        Arrays.fill(revenueByMonth, BigDecimal.ZERO);
        BigDecimal totalRevenue = BigDecimal.ZERO;

        for (Order o : orders) {
            if (o.getCreatedAt() != null && o.getCreatedAt().getYear() == year) {
                ordersByMonth[o.getCreatedAt().getMonthValue() - 1]++;
            }
            if (!isRevenue(o)) continue;
            totalRevenue = totalRevenue.add(o.getTotalAmount());
            if (o.getCreatedAt() != null && o.getCreatedAt().getYear() == year) {
                int m = o.getCreatedAt().getMonthValue() - 1;
                revenueByMonth[m] = revenueByMonth[m].add(o.getTotalAmount());
            }
        }

        Map<String, BigDecimal> categoryRevenue = new LinkedHashMap<>();
        for (Object[] row : orderItemRepository.revenueByPrimaryCategory(PageRequest.of(0, 6))) {
            categoryRevenue.put((String) row[0], (BigDecimal) row[1]);
        }

        LocalDate today = LocalDate.now();
        List<OrderResponse> recent = orders.stream()
                .sorted(Comparator.comparing(Order::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(5).map(OrderResponse::fromEntity).collect(Collectors.toList());

        return DashboardStatsResponse.builder()
                .totalBooks(bookRepository.count())
                .totalUsers(userRepository.count())
                .totalOrders(orders.size())
                .totalRevenue(totalRevenue)
                .pendingOrders(orders.stream().filter(o -> o.getStatus() == Order.OrderStatus.PENDING).count())
                .totalCustomers(userRepository.countByRole(User.Role.CUSTOMER))
                .lowStockBooks(bookRepository.countByStockQuantityLessThan(10))
                .todayOrders(orders.stream().filter(o -> o.getCreatedAt() != null && o.getCreatedAt().toLocalDate().equals(today)).count())
                .monthlyRevenue(Arrays.asList(revenueByMonth))
                .monthlyOrders(Arrays.stream(ordersByMonth).boxed().collect(Collectors.toList()))
                .categoryRevenue(categoryRevenue)
                .recentOrders(recent)
                .build();
    }

    /** Đơn được tính doanh thu: đã giao hoặc đã thanh toán, và chưa huỷ/hoàn trả. */
    private boolean isRevenue(Order o) {
        if (o.getStatus() == Order.OrderStatus.CANCELLED || o.getStatus() == Order.OrderStatus.RETURNED) return false;
        return o.getStatus() == Order.OrderStatus.DELIVERED || o.getPaymentStatus() == Order.PaymentStatus.SUCCESS;
    }
}
