package com.bookstore.api.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsResponse {

    private long totalBooks;
    private long totalUsers;
    private long totalOrders;
    private BigDecimal totalRevenue;
    private long pendingOrders;
    private long totalCustomers;
    private long lowStockBooks;
    private long todayOrders;
    /** Doanh thu 12 tháng của năm hiện tại (index 0 = tháng 1). */
    private List<BigDecimal> monthlyRevenue;
    private List<Long> monthlyOrders;
    /** Doanh thu theo thể loại chính, giảm dần. */
    private Map<String, BigDecimal> categoryRevenue;
    private List<OrderResponse> recentOrders;
}
