package com.bookstore.api;

import com.bookstore.api.dto.request.CancelOrderRequest;
import com.bookstore.api.dto.request.CartRequest;
import com.bookstore.api.dto.request.OrderRequest;
import com.bookstore.api.dto.response.OrderResponse;
import com.bookstore.api.entity.Book;
import com.bookstore.api.entity.Order;
import com.bookstore.api.entity.OrderItem;
import com.bookstore.api.entity.User;
import com.bookstore.api.repository.*;
import com.bookstore.api.service.impl.OrderServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OrderItemRepository orderItemRepository;
    @Mock
    private BookRepository bookRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CartRepository cartRepository;
    @Mock
    private AddressRepository addressRepository;
    @Mock
    private CouponRepository couponRepository;
    @Mock
    private PaymentRepository paymentRepository;

    @InjectMocks
    private OrderServiceImpl orderService;

    private User sampleUser;
    private Book sampleBook;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .username("customer")
                .email("customer@example.com")
                .fullName("Nguyễn Văn Khách")
                .phone("0903456789")
                .loyaltyPoints(50)
                .build();

        sampleBook = Book.builder()
                .id(1L)
                .title("Mắt Biếc")
                .salePrice(new BigDecimal("100000"))
                .originalPrice(new BigDecimal("120000"))
                .stockQuantity(10)
                .soldQuantity(5)
                .status(Book.Status.ACTIVE)
                .build();
    }

    @Test
    @DisplayName("Đặt hàng thành công với mua trực tiếp")
    void createOrder_DirectItems_Success() {
        OrderRequest request = OrderRequest.builder()
                .recipientName("Nguyễn Văn Khách")
                .phone("0903456789")
                .province("Hà Nội")
                .district("Cầu Giấy")
                .ward("Dịch Vọng")
                .detailAddress("Số 123 Đường Cầu Giấy")
                .paymentMethod(Order.PaymentMethod.COD)
                .directItems(List.of(CartRequest.builder().bookId(1L).quantity(2).build()))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(bookRepository.findById(1L)).thenReturn(Optional.of(sampleBook));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            o.setId(100L);
            return o;
        });

        OrderResponse response = orderService.createOrder(1L, request);

        assertNotNull(response);
        assertEquals("Nguyễn Văn Khách", response.getRecipientName());
        assertEquals(new BigDecimal("200000.00"), response.getSubtotal().setScale(2));
        assertEquals(8, sampleBook.getStockQuantity());
        assertEquals(7, sampleBook.getSoldQuantity());
    }

    @Test
    @DisplayName("Hủy đơn hàng thành công và hoàn trả số lượng tồn kho")
    void cancelOrder_Success() {
        Order order = Order.builder()
                .id(100L)
                .orderCode("ORD-20260929-1234")
                .user(sampleUser)
                .status(Order.OrderStatus.PENDING)
                .items(new ArrayList<>())
                .build();

        OrderItem item = OrderItem.builder()
                .id(1L)
                .order(order)
                .book(sampleBook)
                .quantity(2)
                .price(new BigDecimal("100000"))
                .subtotal(new BigDecimal("200000"))
                .build();
        order.getItems().add(item);

        when(orderRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        CancelOrderRequest cancelRequest = CancelOrderRequest.builder()
                .reason("Đổi ý không muốn mua nữa")
                .build();

        OrderResponse response = orderService.cancelOrder(1L, 100L, cancelRequest);

        assertNotNull(response);
        assertEquals(Order.OrderStatus.CANCELLED, response.getStatus());
        assertEquals("Đổi ý không muốn mua nữa", response.getCancelReason());
        assertEquals(12, sampleBook.getStockQuantity());
    }
}
