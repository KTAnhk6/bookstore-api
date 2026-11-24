package com.bookstore.api.service.impl;

import com.bookstore.api.dto.response.OrderResponse;
import com.bookstore.api.dto.response.RevenueReportResponse;
import com.bookstore.api.entity.Order;
import com.bookstore.api.entity.OrderItem;
import com.bookstore.api.repository.OrderRepository;
import com.bookstore.api.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lowagie.text.Document;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Element;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportServiceImpl implements ReportService {

    private final OrderRepository orderRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @Override
    @Transactional(readOnly = true)
    public RevenueReportResponse getRevenueReport(LocalDate startDate, LocalDate endDate) {
        if (startDate == null) {
            startDate = LocalDate.now().withDayOfMonth(1);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }
        if (startDate.isAfter(endDate)) {
            LocalDate tmp = startDate;
            startDate = endDate;
            endDate = tmp;
        }

        LocalDateTime startDt = startDate.atStartOfDay();
        LocalDateTime endDt = endDate.atTime(23, 59, 59);

        List<Order> orders = orderRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(startDt, endDt);

        BigDecimal totalRevenue = BigDecimal.ZERO;
        long successfulOrders = 0;
        long pendingOrders = 0;
        long cancelledOrders = 0;
        Map<String, BigDecimal> revenueByCategory = new LinkedHashMap<>();

        for (Order o : orders) {
            if (o.getStatus() == Order.OrderStatus.PENDING) {
                pendingOrders++;
            } else if (o.getStatus() == Order.OrderStatus.CANCELLED || o.getStatus() == Order.OrderStatus.RETURNED) {
                cancelledOrders++;
            }

            if (isRevenue(o)) {
                successfulOrders++;
                BigDecimal amount = o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO;
                totalRevenue = totalRevenue.add(amount);

                if (o.getItems() != null) {
                    for (OrderItem item : o.getItems()) {
                        if (item.getBook() != null && item.getBook().getBookCategories() != null) {
                            item.getBook().getBookCategories().stream()
                                    .filter(bc -> Boolean.TRUE.equals(bc.getIsPrimary()) && bc.getCategory() != null)
                                    .findFirst()
                                    .ifPresent(bc -> {
                                        String catName = bc.getCategory().getName();
                                        BigDecimal sub = item.getSubtotal() != null ? item.getSubtotal() : BigDecimal.ZERO;
                                        revenueByCategory.merge(catName, sub, BigDecimal::add);
                                    });
                        }
                    }
                }
            }
        }

        BigDecimal avgOrderValue = successfulOrders > 0
                ? totalRevenue.divide(BigDecimal.valueOf(successfulOrders), 0, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        List<OrderResponse> orderResponses = orders.stream()
                .map(OrderResponse::fromEntity)
                .collect(Collectors.toList());

        return RevenueReportResponse.builder()
                .startDate(startDate)
                .endDate(endDate)
                .totalRevenue(totalRevenue)
                .totalOrders(orders.size())
                .successfulOrders(successfulOrders)
                .pendingOrders(pendingOrders)
                .cancelledOrders(cancelledOrders)
                .averageOrderValue(avgOrderValue)
                .revenueByCategory(revenueByCategory)
                .orders(orderResponses)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] generateRevenueExcel(LocalDate startDate, LocalDate endDate) {
        RevenueReportResponse report = getRevenueReport(startDate, endDate);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Bao Cao Doanh Thu");
            sheet.setDisplayGridlines(true);

            // Fonts & Styles
            org.apache.poi.ss.usermodel.Font titleFont = workbook.createFont();
            titleFont.setFontName("Segoe UI");
            titleFont.setFontHeightInPoints((short) 16);
            titleFont.setBold(true);
            titleFont.setColor(IndexedColors.DARK_BLUE.getIndex());

            CellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);

            org.apache.poi.ss.usermodel.Font subtitleFont = workbook.createFont();
            subtitleFont.setFontName("Segoe UI");
            subtitleFont.setFontHeightInPoints((short) 11);
            subtitleFont.setItalic(true);
            subtitleFont.setColor(IndexedColors.GREY_50_PERCENT.getIndex());

            CellStyle subtitleStyle = workbook.createCellStyle();
            subtitleStyle.setFont(subtitleFont);
            subtitleStyle.setAlignment(HorizontalAlignment.CENTER);

            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setFontName("Segoe UI");
            headerFont.setFontHeightInPoints((short) 11);
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            org.apache.poi.ss.usermodel.Font dataFont = workbook.createFont();
            dataFont.setFontName("Segoe UI");
            dataFont.setFontHeightInPoints((short) 10);

            CellStyle cellStyle = workbook.createCellStyle();
            cellStyle.setFont(dataFont);
            cellStyle.setBorderBottom(BorderStyle.THIN);
            cellStyle.setBorderTop(BorderStyle.THIN);
            cellStyle.setBorderLeft(BorderStyle.THIN);
            cellStyle.setBorderRight(BorderStyle.THIN);
            cellStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            CellStyle currencyStyle = workbook.createCellStyle();
            currencyStyle.cloneStyleFrom(cellStyle);
            DataFormat df = workbook.createDataFormat();
            currencyStyle.setDataFormat(df.getFormat("#,##0 \"₫\""));
            currencyStyle.setAlignment(HorizontalAlignment.RIGHT);

            CellStyle centerStyle = workbook.createCellStyle();
            centerStyle.cloneStyleFrom(cellStyle);
            centerStyle.setAlignment(HorizontalAlignment.CENTER);

            // Title
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("BÁO CÁO DOANH THU & ĐƠN HÀNG - BOOKSTORE");
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 8));

            // Subtitle Period
            Row subRow = sheet.createRow(1);
            Cell subCell = subRow.createCell(0);
            subCell.setCellValue("Kỳ báo cáo: Từ ngày " + report.getStartDate().format(DATE_FMT) + " đến ngày " + report.getEndDate().format(DATE_FMT));
            subCell.setCellStyle(subtitleStyle);
            sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 8));

            // KPI Summary block
            Row kpiHeaderRow = sheet.createRow(3);
            String[] kpiHeaders = {"Tổng Doanh Thu", "Tổng Đơn Hàng", "Đơn Hoàn Thành", "Đơn Đang Chờ", "Đơn Đã Huỷ", "Giá Trị TB / Đơn"};
            for (int i = 0; i < kpiHeaders.length; i++) {
                Cell c = kpiHeaderRow.createCell(i);
                c.setCellValue(kpiHeaders[i]);
                c.setCellStyle(headerStyle);
            }

            Row kpiValRow = sheet.createRow(4);
            Cell c0 = kpiValRow.createCell(0);
            c0.setCellValue(report.getTotalRevenue().doubleValue());
            c0.setCellStyle(currencyStyle);

            Cell c1 = kpiValRow.createCell(1);
            c1.setCellValue(report.getTotalOrders());
            c1.setCellStyle(centerStyle);

            Cell c2 = kpiValRow.createCell(2);
            c2.setCellValue(report.getSuccessfulOrders());
            c2.setCellStyle(centerStyle);

            Cell c3 = kpiValRow.createCell(3);
            c3.setCellValue(report.getPendingOrders());
            c3.setCellStyle(centerStyle);

            Cell c4 = kpiValRow.createCell(4);
            c4.setCellValue(report.getCancelledOrders());
            c4.setCellStyle(centerStyle);

            Cell c5 = kpiValRow.createCell(5);
            c5.setCellValue(report.getAverageOrderValue().doubleValue());
            c5.setCellStyle(currencyStyle);

            // Orders Table Header
            int tableStartRow = 7;
            Row tableHeadRow = sheet.createRow(tableStartRow);
            String[] columns = {"STT", "Mã Đơn", "Ngày Đặt", "Khách Hàng", "Số ĐT", "PT Thanh Toán", "Trạng Thái TT", "Trạng Thái Đơn", "Tổng Tiền"};
            for (int i = 0; i < columns.length; i++) {
                Cell c = tableHeadRow.createCell(i);
                c.setCellValue(columns[i]);
                c.setCellStyle(headerStyle);
            }

            // Orders Table Data
            int rowIdx = tableStartRow + 1;
            int stt = 1;
            for (OrderResponse o : report.getOrders()) {
                Row r = sheet.createRow(rowIdx++);
                Cell cellStt = r.createCell(0);
                cellStt.setCellValue(stt++);
                cellStt.setCellStyle(centerStyle);

                Cell cellCode = r.createCell(1);
                cellCode.setCellValue(o.getOrderCode() != null ? "#" + o.getOrderCode() : "");
                cellCode.setCellStyle(centerStyle);

                Cell cellDate = r.createCell(2);
                cellDate.setCellValue(o.getCreatedAt() != null ? o.getCreatedAt().format(DATETIME_FMT) : "");
                cellDate.setCellStyle(centerStyle);

                Cell cellName = r.createCell(3);
                cellName.setCellValue(o.getCustomerName() != null ? o.getCustomerName() : "");
                cellName.setCellStyle(cellStyle);

                Cell cellPhone = r.createCell(4);
                cellPhone.setCellValue(o.getCustomerPhone() != null ? o.getCustomerPhone() : "");
                cellPhone.setCellStyle(centerStyle);

                Cell cellMethod = r.createCell(5);
                cellMethod.setCellValue(o.getPaymentMethod() != null ? o.getPaymentMethod().name() : "");
                cellMethod.setCellStyle(centerStyle);

                Cell cellPayStatus = r.createCell(6);
                cellPayStatus.setCellValue(o.getPaymentStatus() != null ? o.getPaymentStatus().name() : "");
                cellPayStatus.setCellStyle(centerStyle);

                Cell cellOrdStatus = r.createCell(7);
                cellOrdStatus.setCellValue(o.getStatus() != null ? o.getStatus().name() : "");
                cellOrdStatus.setCellStyle(centerStyle);

                Cell cellAmount = r.createCell(8);
                cellAmount.setCellValue(o.getTotalAmount() != null ? o.getTotalAmount().doubleValue() : 0.0);
                cellAmount.setCellStyle(currencyStyle);
            }

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
                sheet.setColumnWidth(i, Math.max(sheet.getColumnWidth(i) + 1200, 3200));
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Lỗi khi xuất file Excel báo cáo: {}", e.getMessage(), e);
            throw new RuntimeException("Không thể tạo file báo cáo Excel: " + e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] generateRevenuePdf(LocalDate startDate, LocalDate endDate) {
        RevenueReportResponse report = getRevenueReport(startDate, endDate);

        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.getDefault());
        symbols.setGroupingSeparator('.');
        DecimalFormat currencyFmt = new DecimalFormat("#,##0 ₫", symbols);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate(), 30, 30, 30, 30);
            PdfWriter.getInstance(document, out);
            document.open();

            com.lowagie.text.Font titleFont = new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 18, com.lowagie.text.Font.BOLD, new Color(30, 41, 59));
            com.lowagie.text.Font subFont = new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 10, com.lowagie.text.Font.ITALIC, new Color(100, 116, 139));
            com.lowagie.text.Font headFont = new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 10, com.lowagie.text.Font.BOLD, Color.WHITE);
            com.lowagie.text.Font boldFont = new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 9, com.lowagie.text.Font.BOLD, new Color(30, 41, 59));
            com.lowagie.text.Font textFont = new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 9, com.lowagie.text.Font.NORMAL, new Color(30, 41, 59));

            // Title
            Paragraph title = new Paragraph("BAO CAO DOANH THU & DON HANG - BOOKSTORE", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(4);
            document.add(title);

            Paragraph subtitle = new Paragraph("Ky bao cao: Tu " + report.getStartDate().format(DATE_FMT) + " den " + report.getEndDate().format(DATE_FMT) + " | Ngay xuat: " + LocalDateTime.now().format(DATETIME_FMT), subFont);
            subtitle.setAlignment(Element.ALIGN_CENTER);
            subtitle.setSpacingAfter(15);
            document.add(subtitle);

            // KPI Box Table
            PdfPTable kpiTable = new PdfPTable(6);
            kpiTable.setWidthPercentage(100);
            kpiTable.setSpacingAfter(15);

            String[] kpiTitles = {"Tong Doanh Thu", "Tong Don Hang", "Don Hoan Thanh", "Don Cho Xu Ly", "Don Da Huy", "Gia Tri TB/Don"};
            for (String t : kpiTitles) {
                PdfPCell cell = new PdfPCell(new Phrase(t, headFont));
                cell.setBackgroundColor(new Color(79, 70, 229));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(6);
                kpiTable.addCell(cell);
            }

            PdfPCell cRev = new PdfPCell(new Phrase(currencyFmt.format(report.getTotalRevenue()), boldFont));
            cRev.setHorizontalAlignment(Element.ALIGN_CENTER);
            cRev.setPadding(6);
            kpiTable.addCell(cRev);

            PdfPCell cTot = new PdfPCell(new Phrase(String.valueOf(report.getTotalOrders()), textFont));
            cTot.setHorizontalAlignment(Element.ALIGN_CENTER);
            cTot.setPadding(6);
            kpiTable.addCell(cTot);

            PdfPCell cSucc = new PdfPCell(new Phrase(String.valueOf(report.getSuccessfulOrders()), textFont));
            cSucc.setHorizontalAlignment(Element.ALIGN_CENTER);
            cSucc.setPadding(6);
            kpiTable.addCell(cSucc);

            PdfPCell cPend = new PdfPCell(new Phrase(String.valueOf(report.getPendingOrders()), textFont));
            cPend.setHorizontalAlignment(Element.ALIGN_CENTER);
            cPend.setPadding(6);
            kpiTable.addCell(cPend);

            PdfPCell cCanc = new PdfPCell(new Phrase(String.valueOf(report.getCancelledOrders()), textFont));
            cCanc.setHorizontalAlignment(Element.ALIGN_CENTER);
            cCanc.setPadding(6);
            kpiTable.addCell(cCanc);

            PdfPCell cAvg = new PdfPCell(new Phrase(currencyFmt.format(report.getAverageOrderValue()), boldFont));
            cAvg.setHorizontalAlignment(Element.ALIGN_CENTER);
            cAvg.setPadding(6);
            kpiTable.addCell(cAvg);

            document.add(kpiTable);

            // Orders Table
            PdfPTable table = new PdfPTable(8);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1.0f, 2.5f, 3.0f, 3.5f, 2.5f, 2.5f, 2.5f, 3.0f});

            String[] tableHeaders = {"STT", "Ma Don", "Ngay Dat", "Khach Hang", "PT Thanh Toan", "TT Thanh Toan", "Trang Thai", "Tong Tien"};
            for (String h : tableHeaders) {
                PdfPCell cell = new PdfPCell(new Phrase(h, headFont));
                cell.setBackgroundColor(new Color(30, 41, 59));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(5);
                table.addCell(cell);
            }

            int stt = 1;
            boolean alternate = false;
            for (OrderResponse o : report.getOrders()) {
                Color rowBg = alternate ? new Color(248, 250, 252) : Color.WHITE;
                alternate = !alternate;

                PdfPCell c1 = new PdfPCell(new Phrase(String.valueOf(stt++), textFont));
                c1.setHorizontalAlignment(Element.ALIGN_CENTER);
                c1.setBackgroundColor(rowBg);
                c1.setPadding(5);
                table.addCell(c1);

                PdfPCell c2 = new PdfPCell(new Phrase("#" + (o.getOrderCode() != null ? o.getOrderCode() : ""), boldFont));
                c2.setHorizontalAlignment(Element.ALIGN_CENTER);
                c2.setBackgroundColor(rowBg);
                c2.setPadding(5);
                table.addCell(c2);

                PdfPCell c3 = new PdfPCell(new Phrase(o.getCreatedAt() != null ? o.getCreatedAt().format(DATETIME_FMT) : "", textFont));
                c3.setHorizontalAlignment(Element.ALIGN_CENTER);
                c3.setBackgroundColor(rowBg);
                c3.setPadding(5);
                table.addCell(c3);

                PdfPCell c4 = new PdfPCell(new Phrase(o.getCustomerName() != null ? o.getCustomerName() : "", textFont));
                c4.setBackgroundColor(rowBg);
                c4.setPadding(5);
                table.addCell(c4);

                PdfPCell c5 = new PdfPCell(new Phrase(o.getPaymentMethod() != null ? o.getPaymentMethod().name() : "", textFont));
                c5.setHorizontalAlignment(Element.ALIGN_CENTER);
                c5.setBackgroundColor(rowBg);
                c5.setPadding(5);
                table.addCell(c5);

                PdfPCell c6 = new PdfPCell(new Phrase(o.getPaymentStatus() != null ? o.getPaymentStatus().name() : "", textFont));
                c6.setHorizontalAlignment(Element.ALIGN_CENTER);
                c6.setBackgroundColor(rowBg);
                c6.setPadding(5);
                table.addCell(c6);

                PdfPCell c7 = new PdfPCell(new Phrase(o.getStatus() != null ? o.getStatus().name() : "", textFont));
                c7.setHorizontalAlignment(Element.ALIGN_CENTER);
                c7.setBackgroundColor(rowBg);
                c7.setPadding(5);
                table.addCell(c7);

                PdfPCell c8 = new PdfPCell(new Phrase(o.getTotalAmount() != null ? currencyFmt.format(o.getTotalAmount()) : "0 ₫", boldFont));
                c8.setHorizontalAlignment(Element.ALIGN_RIGHT);
                c8.setBackgroundColor(rowBg);
                c8.setPadding(5);
                table.addCell(c8);
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Lỗi khi xuất file PDF báo cáo: {}", e.getMessage(), e);
            throw new RuntimeException("Không thể tạo file báo cáo PDF: " + e.getMessage());
        }
    }

    private boolean isRevenue(Order o) {
        if (o.getStatus() == Order.OrderStatus.CANCELLED || o.getStatus() == Order.OrderStatus.RETURNED) {
            return false;
        }
        return o.getStatus() == Order.OrderStatus.DELIVERED || o.getPaymentStatus() == Order.PaymentStatus.SUCCESS;
    }
}
