package com.bookstore.api;

import com.bookstore.api.dto.request.PaymentCallbackRequest;
import com.bookstore.api.dto.request.PaymentRequest;
import com.bookstore.api.dto.response.CouponResponse;
import com.bookstore.api.dto.response.PaymentResponse;
import com.bookstore.api.entity.Coupon;
import com.bookstore.api.entity.Order;
import com.bookstore.api.entity.Payment;
import com.bookstore.api.entity.User;
import com.bookstore.api.exception.BadRequestException;
import com.bookstore.api.exception.ResourceNotFoundException;
import com.bookstore.api.repository.CouponRepository;
import com.bookstore.api.repository.OrderRepository;
import com.bookstore.api.repository.PaymentRepository;
import com.bookstore.api.service.impl.PaymentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private CouponRepository couponRepository;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    private User sampleUser;
    private Order sampleOrder;
    private Payment samplePayment;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .username("minhanh")
                .email("minhanh@bookstore.vn")
                .build();

        sampleOrder = Order.builder()
                .id(100L)
                .orderCode("BK100")
                .user(sampleUser)
                .totalAmount(new BigDecimal("250000"))
                .status(Order.OrderStatus.PENDING)
                .paymentMethod(Order.PaymentMethod.QR_CODE)
                .paymentStatus(Order.PaymentStatus.PENDING)
                .build();

        samplePayment = Payment.builder()
                .id(10L)
                .order(sampleOrder)
                .amount(new BigDecimal("250000"))
                .method(Order.PaymentMethod.QR_CODE)
                .status(Order.PaymentStatus.PENDING)
                .transactionCode("TXN_123456")
                .qrCodeUrl("https://api.vietqr.io/image/970422-0912345678-qrl81a0.jpg")
                .bankCode("MBBANK")
                .accountNumber("0912345678")
                .build();
    }

    @Test
    @DisplayName("Tạo phiên thanh toán VietQR thành công")
    void testCreatePaymentSession_QRCode() {
        when(orderRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(sampleOrder));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment p = invocation.getArgument(0);
            p.setId(10L);
            return p;
        });

        PaymentResponse response = paymentService.createPaymentSession(1L, 100L, Order.PaymentMethod.QR_CODE);

        assertNotNull(response);
        assertEquals(Order.PaymentMethod.QR_CODE, response.getPaymentMethod());
        assertEquals(Order.PaymentStatus.PENDING, response.getStatus());
        assertNotNull(response.getQrCodeUrl());
        verify(paymentRepository, times(1)).save(any(Payment.class));
    }

    @Test
    @DisplayName("Tạo thanh toán qua PaymentRequest thành công")
    void testCreatePayment_Success() {
        when(orderRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(sampleOrder));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment p = invocation.getArgument(0);
            p.setId(10L);
            return p;
        });
        when(paymentRepository.findById(10L)).thenReturn(Optional.of(samplePayment));

        PaymentRequest request = PaymentRequest.builder()
                .orderId(100L)
                .paymentMethod(Order.PaymentMethod.QR_CODE)
                .notes("Thanh toán tiền sách qua mã VietQR")
                .bankCode("MBBANK")
                .build();

        PaymentResponse response = paymentService.createPayment(1L, request);

        assertNotNull(response);
        assertEquals(10L, response.getId());
        verify(paymentRepository, atLeastOnce()).save(any(Payment.class));
    }

    @Test
    @DisplayName("Xử lý thanh toán thành công (processPayment)")
    void testProcessPayment_Success() {
        when(orderRepository.findById(100L)).thenReturn(Optional.of(sampleOrder));
        when(paymentRepository.findByOrderId(100L)).thenReturn(Optional.of(samplePayment));
        when(paymentRepository.save(any(Payment.class))).thenReturn(samplePayment);

        PaymentResponse response = paymentService.processPayment(100L, "TXN_DONE_001", "Khách đã quét mã VietQR");

        assertNotNull(response);
        assertEquals(Order.PaymentStatus.SUCCESS, samplePayment.getStatus());
        assertEquals(Order.PaymentStatus.SUCCESS, sampleOrder.getPaymentStatus());
        assertEquals(Order.OrderStatus.CONFIRMED, sampleOrder.getStatus());
        verify(orderRepository, times(1)).save(sampleOrder);
    }

    @Test
    @DisplayName("Xử lý callback thanh toán thành công cập nhật cả Payment và Order")
    void testProcessCallback_Success() {
        when(paymentRepository.findByTransactionCode("TXN_123456")).thenReturn(Optional.of(samplePayment));
        when(paymentRepository.save(any(Payment.class))).thenReturn(samplePayment);

        PaymentCallbackRequest callback = PaymentCallbackRequest.builder()
                .transactionCode("TXN_123456")
                .responseCode("00")
                .status(Order.PaymentStatus.SUCCESS)
                .notes("Giao dịch ngân hàng khớp lệnh thành công")
                .build();

        PaymentResponse response = paymentService.processCallback(callback);

        assertNotNull(response);
        assertEquals(Order.PaymentStatus.SUCCESS, samplePayment.getStatus());
        assertEquals(Order.PaymentStatus.SUCCESS, sampleOrder.getPaymentStatus());
        assertEquals(Order.OrderStatus.CONFIRMED, sampleOrder.getStatus());
        verify(orderRepository, times(1)).save(sampleOrder);
    }

    @Test
    @DisplayName("Xử lý callback thanh toán thất bại")
    void testProcessCallback_Failed() {
        when(paymentRepository.findByTransactionCode("TXN_123456")).thenReturn(Optional.of(samplePayment));
        when(paymentRepository.save(any(Payment.class))).thenReturn(samplePayment);

        PaymentCallbackRequest callback = PaymentCallbackRequest.builder()
                .transactionCode("TXN_123456")
                .responseCode("99")
                .status(Order.PaymentStatus.FAILED)
                .notes("Giao dịch bị từ chối")
                .build();

        PaymentResponse response = paymentService.processCallback(callback);

        assertNotNull(response);
        assertEquals(Order.PaymentStatus.FAILED, samplePayment.getStatus());
        assertEquals(Order.PaymentStatus.FAILED, sampleOrder.getPaymentStatus());
        verify(orderRepository, times(1)).save(sampleOrder);
    }

    @Test
    @DisplayName("Lấy thông tin thanh toán theo mã đơn hàng")
    void testGetPaymentByOrderId_Success() {
        when(orderRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(sampleOrder));
        when(paymentRepository.findByOrderId(100L)).thenReturn(Optional.of(samplePayment));

        PaymentResponse response = paymentService.getPaymentByOrderId(1L, 100L);

        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals("BK100", response.getOrderCode());
    }

    @Test
    @DisplayName("Lấy lịch sử thanh toán theo đơn hàng")
    void testGetPaymentHistory_Success() {
        when(orderRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(sampleOrder));
        when(paymentRepository.findByOrderIdOrderByCreatedAtDesc(100L)).thenReturn(Collections.singletonList(samplePayment));

        List<PaymentResponse> history = paymentService.getPaymentHistory(1L, 100L);

        assertNotNull(history);
        assertEquals(1, history.size());
    }

    @Test
    @DisplayName("Kiểm tra mã giảm giá Coupon hợp lệ")
    void testValidateCoupon_Success() {
        Coupon coupon = Coupon.builder()
                .id(1L)
                .code("BOOK20")
                .discountType(Coupon.DiscountType.PERCENTAGE)
                .discountValue(new BigDecimal("20"))
                .minOrderAmount(new BigDecimal("100000"))
                .maxDiscount(new BigDecimal("50000"))
                .active(true)
                .build();

        when(couponRepository.findByCodeIgnoreCaseAndActiveTrue("BOOK20")).thenReturn(Optional.of(coupon));

        CouponResponse response = paymentService.validateCoupon("BOOK20", new BigDecimal("200000"));

        assertNotNull(response);
        assertEquals("BOOK20", response.getCode());
        assertEquals(new BigDecimal("40000.00"), response.getCalculatedDiscount());
    }

    @Test
    @DisplayName("Kiểm tra mã giảm giá rỗng bắn ngoại lệ BadRequestException")
    void testValidateCoupon_BlankThrowsException() {
        assertThrows(BadRequestException.class, () -> paymentService.validateCoupon("   ", new BigDecimal("100000")));
    }

    @Test
    @DisplayName("Admin cập nhật trạng thái thanh toán")
    void testUpdatePaymentStatus_Admin() {
        when(paymentRepository.findById(10L)).thenReturn(Optional.of(samplePayment));
        when(paymentRepository.save(any(Payment.class))).thenReturn(samplePayment);

        PaymentResponse response = paymentService.updatePaymentStatus(10L, Order.PaymentStatus.SUCCESS, "Admin xác nhận đã nhận tiền");

        assertNotNull(response);
        assertEquals(Order.PaymentStatus.SUCCESS, samplePayment.getStatus());
        assertEquals(Order.PaymentStatus.SUCCESS, sampleOrder.getPaymentStatus());
        verify(paymentRepository, times(1)).save(samplePayment);
        verify(orderRepository, times(1)).save(sampleOrder);
    }
}
