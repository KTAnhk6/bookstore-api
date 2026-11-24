package com.bookstore.api.service;

import com.bookstore.api.dto.response.RevenueReportResponse;

import java.time.LocalDate;

public interface ReportService {

    RevenueReportResponse getRevenueReport(LocalDate startDate, LocalDate endDate);

    byte[] generateRevenueExcel(LocalDate startDate, LocalDate endDate);

    byte[] generateRevenuePdf(LocalDate startDate, LocalDate endDate);
}
