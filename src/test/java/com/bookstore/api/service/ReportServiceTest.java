package com.bookstore.api.service;

import com.bookstore.api.dto.response.RevenueReportResponse;
import com.bookstore.api.entity.Category;
import com.bookstore.api.entity.Order;
import com.bookstore.api.entity.OrderItem;
import com.bookstore.api.entity.Book;
import com.bookstore.api.entity.BookCategory;
import com.bookstore.api.entity.User;
import com.bookstore.api.repository.OrderRepository;
import com.bookstore.api.service.impl.ReportServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private ReportServiceImpl reportService;

    private Order mockDeliveredOrder;
    private Order mockPendingOrder;

    @BeforeEach
    void setUp() {
        Category cat = Category.builder().id(1L).name("Văn Học").slug("van-hoc").build();
        Book book = Book.builder().id(10L).title("Cho Tôi Xin Một Vé Đi Tuổi Thơ").price(new BigDecimal("120000")).build();
        BookCategory bc = BookCategory.builder().book(book).category(cat).isPrimary(true).build();
        book.setBookCategories(Set.of(bc));

        OrderItem item = OrderItem.builder().id(100L).book(book).quantity(2).price(new BigDecimal("120000")).subtotal(new BigDecimal("240000")).build();

        User user1 = User.builder().id(10L).fullName("Nguyen Van A").phone("0912345678").build();
        mockDeliveredOrder = Order.builder()
                .id(1L)
                .orderCode("BK123456")
                .user(user1)
                .paymentMethod(Order.PaymentMethod.QR_CODE)
                .paymentStatus(Order.PaymentStatus.SUCCESS)
                .status(Order.OrderStatus.DELIVERED)
                .totalAmount(new BigDecimal("240000"))
                .items(List.of(item))
                .createdAt(LocalDateTime.now())
                .build();
        item.setOrder(mockDeliveredOrder);

        User user2 = User.builder().id(11L).fullName("Tran Van B").phone("0987654321").build();
        mockPendingOrder = Order.builder()
                .id(2L)
                .orderCode("BK789012")
                .user(user2)
                .paymentMethod(Order.PaymentMethod.COD)
                .paymentStatus(Order.PaymentStatus.PENDING)
                .status(Order.OrderStatus.PENDING)
                .totalAmount(new BigDecimal("150000"))
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Thống kê doanh thu tính toán đúng các chỉ số KPI")
    void testGetRevenueReport() {
        when(orderRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(any(), any()))
                .thenReturn(List.of(mockDeliveredOrder, mockPendingOrder));

        RevenueReportResponse report = reportService.getRevenueReport(LocalDate.now().minusDays(7), LocalDate.now());

        assertNotNull(report);
        assertEquals(2, report.getTotalOrders());
        assertEquals(1, report.getSuccessfulOrders());
        assertEquals(1, report.getPendingOrders());
        assertEquals(0, report.getCancelledOrders());
        assertEquals(new BigDecimal("240000"), report.getTotalRevenue());
        assertEquals(new BigDecimal("240000"), report.getAverageOrderValue());
        assertTrue(report.getRevenueByCategory().containsKey("Văn Học"));
        assertEquals(new BigDecimal("240000"), report.getRevenueByCategory().get("Văn Học"));
    }

    @Test
    @DisplayName("Xuất báo cáo Excel tạo file xlsx hợp lệ không rỗng")
    void testGenerateRevenueExcel() {
        when(orderRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(any(), any()))
                .thenReturn(List.of(mockDeliveredOrder, mockPendingOrder));

        byte[] excelBytes = reportService.generateRevenueExcel(LocalDate.now().minusDays(30), LocalDate.now());

        assertNotNull(excelBytes);
        assertTrue(excelBytes.length > 1000, "File Excel phải có kích thước hợp lệ");
        assertEquals((byte) 'P', excelBytes[0]);
        assertEquals((byte) 'K', excelBytes[1]);
    }

    @Test
    @DisplayName("Xuất báo cáo PDF tạo file pdf chuẩn bắt đầu bằng %PDF-")
    void testGenerateRevenuePdf() {
        when(orderRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(any(), any()))
                .thenReturn(List.of(mockDeliveredOrder, mockPendingOrder));

        byte[] pdfBytes = reportService.generateRevenuePdf(LocalDate.now().minusDays(30), LocalDate.now());

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 500, "File PDF phải có kích thước hợp lệ");
        String header = new String(pdfBytes, 0, 5);
        assertEquals("%PDF-", header, "File PDF phải có header %PDF-");
    }
}
