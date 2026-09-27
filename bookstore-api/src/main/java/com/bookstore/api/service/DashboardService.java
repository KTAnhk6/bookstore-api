package com.bookstore.api.service;

import com.bookstore.api.dto.response.DashboardStatsResponse;

public interface DashboardService {
    DashboardStatsResponse getStats();
}