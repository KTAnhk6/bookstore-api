package com.bookstore.api.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RevenueReportResponse {
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal totalRevenue;
    private long totalOrders;
    private long successfulOrders;
    private long pendingOrders;
    private long cancelledOrders;
    private BigDecimal averageOrderValue;
    private Map<String, BigDecimal> revenueByCategory;
    private List<OrderResponse> orders;
}
