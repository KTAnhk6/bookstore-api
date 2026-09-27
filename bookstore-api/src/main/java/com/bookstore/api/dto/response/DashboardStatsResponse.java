package com.bookstore.api.dto.response;

import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DashboardStatsResponse {
    private Long totalUsers;
    private Long totalBooks;
    private Long totalOrders;
    private BigDecimal totalRevenue;
    private Long pendingOrders;
    private Long pendingReviews;
}