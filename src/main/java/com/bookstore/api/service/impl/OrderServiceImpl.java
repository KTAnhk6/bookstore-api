package com.bookstore.api.service.impl;

import com.bookstore.api.dto.request.CancelOrderRequest;
import com.bookstore.api.dto.request.CartRequest;
import com.bookstore.api.dto.request.OrderRequest;
import com.bookstore.api.dto.response.OrderResponse;
import com.bookstore.api.entity.*;
import com.bookstore.api.exception.BadRequestException;
import com.bookstore.api.exception.ResourceNotFoundException;
import com.bookstore.api.repository.*;
import com.bookstore.api.service.OrderService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
/**
 * Service xử lý đơn hàng và thanh toán.
 */
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final AddressRepository addressRepository;
    private final CouponRepository couponRepository;
    private final PaymentRepository paymentRepository;

    public OrderServiceImpl(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            BookRepository bookRepository,
            UserRepository userRepository,
            CartRepository cartRepository,
            AddressRepository addressRepository,
            CouponRepository couponRepository,
            PaymentRepository paymentRepository
    ) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
        this.cartRepository = cartRepository;
        this.addressRepository = addressRepository;
        this.couponRepository = couponRepository;
        this.paymentRepository = paymentRepository;
    }

    private static final Random RANDOM = new Random();

    private String generateOrderCode() {
        String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int rand = 1000 + RANDOM.nextInt(9000);
        return "ORD-" + datePart + "-" + rand;
    }

    @Override
    @Transactional
    public OrderResponse createOrder(Long userId, OrderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // 1. Determine shipping address
        String recipientName = request.getRecipientName();
        String phone = request.getPhone();
        String province = request.getProvince();
        String district = request.getDistrict();
        String ward = request.getWard();
        String detailAddress = request.getDetailAddress();

        if (request.getAddressId() != null) {
            Address address = addressRepository.findByIdAndUserId(request.getAddressId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Address", "id", request.getAddressId()));
            recipientName = address.getRecipientName();
            phone = address.getPhone();
            province = address.getProvince();
            district = address.getDistrict();
            ward = address.getWard();
            detailAddress = address.getDetailAddress();
        } else {
            if (recipientName == null || recipientName.isBlank() ||
                phone == null || phone.isBlank() ||
                province == null || province.isBlank() ||
                district == null || district.isBlank() ||
                ward == null || ward.isBlank() ||
                detailAddress == null || detailAddress.isBlank()) {
                throw new BadRequestException("Vui lòng cung cấp đầy đủ thông tin địa chỉ giao hàng");
            }
        }

        // 2. Determine items to purchase
        List<CartItemToOrder> itemsToOrder = new ArrayList<>();
        List<Long> cartItemIdsToDelete = new ArrayList<>();

        if (request.getDirectItems() != null && !request.getDirectItems().isEmpty()) {
            // Direct buy
            for (CartRequest cr : request.getDirectItems()) {
                Book book = bookRepository.findById(cr.getBookId())
                        .orElseThrow(() -> new ResourceNotFoundException("Book", "id", cr.getBookId()));
                itemsToOrder.add(new CartItemToOrder(book, cr.getQuantity()));
            }
        } else {
            // From cart
            List<Cart> cartList = cartRepository.findByUserIdOrderByCreatedAtDesc(userId);
            if (cartList.isEmpty()) {
                throw new BadRequestException("Giỏ hàng của bạn đang trống");
            }
            for (Cart c : cartList) {
                itemsToOrder.add(new CartItemToOrder(c.getBook(), c.getQuantity()));
                cartItemIdsToDelete.add(c.getId());
            }
        }

        if (itemsToOrder.isEmpty()) {
            throw new BadRequestException("Không có sản phẩm nào để đặt hàng");
        }

        // 3. Validate stock & calculate subtotal
        BigDecimal subtotal = BigDecimal.ZERO;
        for (CartItemToOrder item : itemsToOrder) {
            Book book = item.book();
            int qty = item.quantity();

            if (book.getStatus() != Book.Status.AVAILABLE) {
                throw new BadRequestException("Sách '" + book.getTitle() + "' hiện không còn kinh doanh");
            }

            if (book.getStockQuantity() < qty) {
                throw new BadRequestException("Sách '" + book.getTitle() + "' chỉ còn " + book.getStockQuantity() + " cuốn trong kho");
            }

            BigDecimal itemTotal = book.getSalePrice().multiply(BigDecimal.valueOf(qty));
            subtotal = subtotal.add(itemTotal);
        }

        // 4. Calculate shipping fee (Free if >= 300,000 VND)
        BigDecimal shippingFee = (subtotal.compareTo(new BigDecimal("300000")) >= 0)
                ? BigDecimal.ZERO
                : new BigDecimal("30000");

        // 5. Calculate coupon discount
        Coupon coupon = null;
        BigDecimal couponDiscount = BigDecimal.ZERO;
        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            coupon = couponRepository.findByCodeIgnoreCaseAndActiveTrue(request.getCouponCode().trim())
                    .orElseThrow(() -> new BadRequestException("Mã giảm giá không hợp lệ hoặc đã hết hạn"));

            if (!coupon.isValid(subtotal)) {
                throw new BadRequestException("Mã giảm giá không đủ điều kiện áp dụng cho đơn hàng này");
            }

            couponDiscount = coupon.calculateDiscount(subtotal);
            coupon.setUsedCount(coupon.getUsedCount() + 1);
            couponRepository.save(coupon);
        }

        // 6. Calculate loyalty points discount (1 point = 1,000 VND, max 20% order)
        BigDecimal pointsDiscount = BigDecimal.ZERO;
        int usedPoints = 0;
        if (request.getUsePoints() != null && request.getUsePoints() > 0) {
            int availablePoints = user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0;
            usedPoints = Math.min(request.getUsePoints(), availablePoints);

            BigDecimal requestedPointValue = BigDecimal.valueOf(usedPoints * 1000L);
            BigDecimal maxAllowedPointDiscount = subtotal.multiply(new BigDecimal("0.20")); // Max 20%

            if (requestedPointValue.compareTo(maxAllowedPointDiscount) > 0) {
                pointsDiscount = maxAllowedPointDiscount;
                usedPoints = pointsDiscount.divide(BigDecimal.valueOf(1000), 0, java.math.RoundingMode.DOWN).intValue();
                pointsDiscount = BigDecimal.valueOf(usedPoints * 1000L);
            } else {
                pointsDiscount = requestedPointValue;
            }

            user.setLoyaltyPoints(availablePoints - usedPoints);
            userRepository.save(user);
        }

        // Total amount
        BigDecimal totalAmount = subtotal.add(shippingFee).subtract(couponDiscount).subtract(pointsDiscount);
        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) {
            totalAmount = BigDecimal.ZERO;
        }

        // 7. Create Order
        String orderCode = generateOrderCode();
        while (orderRepository.findByOrderCode(orderCode).isPresent()) {
            orderCode = generateOrderCode();
        }

        Order order = Order.builder()
                .orderCode(orderCode)
                .user(user)
                .shippingAddress(recipientName + ", " + phone + " - " + detailAddress + ", " + ward + ", " + district + ", " + province)
                .note(request.getNote())
                .subtotal(subtotal)
                .shippingFee(shippingFee)
                .discountAmount(couponDiscount)
                .totalAmount(totalAmount)
                .status(Order.OrderStatus.PENDING)
                .paymentMethod(request.getPaymentMethod())
                .paymentStatus(request.getPaymentMethod() == Order.PaymentMethod.COD ? Order.PaymentStatus.PENDING : Order.PaymentStatus.PENDING)
                .coupon(coupon)
                .build();

        order = orderRepository.save(order);

        // 8. Create OrderItems & Deduct Book Stock
        List<OrderItem> orderItems = new ArrayList<>();
        for (CartItemToOrder item : itemsToOrder) {
            Book book = item.book();
            int qty = item.quantity();

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .book(book)
                    .bookTitle(book.getTitle())
                    .bookCoverImage(book.getCoverImage())
                    .price(book.getSalePrice())
                    .quantity(qty)
                    .subtotal(book.getSalePrice().multiply(BigDecimal.valueOf(qty)))
                    .build();

            orderItems.add(orderItem);

            // Deduct stock & add sold
            book.setStockQuantity(book.getStockQuantity() - qty);
            book.setSoldQuantity((book.getSoldQuantity() != null ? book.getSoldQuantity() : 0) + qty);
            if (book.getStockQuantity() == 0) {
                book.setStatus(Book.Status.OUT_OF_STOCK);
            }
            bookRepository.save(book);
        }

        orderItemRepository.saveAll(orderItems);
        order.setItems(orderItems);

        // 9. Create Payment record
        Payment payment = Payment.builder()
                .order(order)
                
                .amount(totalAmount)
                .method(request.getPaymentMethod())
                .status(Order.PaymentStatus.PENDING)
                .transactionCode("TXN-" + orderCode)
                .build();
        paymentRepository.save(payment);

        // 10. Clean up cart if checkout was from cart
        if (!cartItemIdsToDelete.isEmpty()) {
            cartRepository.deleteAllById(cartItemIdsToDelete);
        }

        // 11. Award loyalty points for purchase (1 point per 100k spent)
        int earnedPoints = totalAmount.divide(new BigDecimal("100000"), 0, java.math.RoundingMode.DOWN).intValue();
        if (earnedPoints > 0) {
            user.setLoyaltyPoints((user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0) + earnedPoints);
            userRepository.save(user);
        }

        return OrderResponse.fromEntity(order);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getUserOrders(Long userId, Order.OrderStatus status, Pageable pageable) {
        if (status != null) {
            return orderRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, status, pageable)
                    .map(OrderResponse::fromEntity);
        }
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(OrderResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long userId, Long orderId) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        return OrderResponse.fromEntity(order);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderByCode(Long userId, String orderCode) {
        Order order = orderRepository.findByOrderCodeAndUserId(orderCode, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "orderCode", orderCode));
        return OrderResponse.fromEntity(order);
    }

    @Override
    @Transactional
    public OrderResponse cancelOrder(Long userId, Long orderId, CancelOrderRequest request) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (order.getStatus() != Order.OrderStatus.PENDING && order.getStatus() != Order.OrderStatus.CONFIRMED) {
            throw new BadRequestException("Chỉ có thể hủy đơn hàng khi đơn đang ở trạng thái Chờ xử lý hoặc Đã xác nhận");
        }

        order.setStatus(Order.OrderStatus.CANCELLED);
        order.setNote("Hủy đơn hàng: " + request.getReason());

        // Restore stock
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                if (item.getBook() != null) {
                    Book book = item.getBook();
                    book.setStockQuantity(book.getStockQuantity() + item.getQuantity());
                    book.setSoldQuantity(Math.max(0, (book.getSoldQuantity() != null ? book.getSoldQuantity() : 0) - item.getQuantity()));
                    if (book.getStatus() == Book.Status.OUT_OF_STOCK && book.getStockQuantity() > 0) {
                        book.setStatus(Book.Status.AVAILABLE);
                    }
                    bookRepository.save(book);
                }
            }
        }

        // Restore points if used
        if (BigDecimal.ZERO != null && BigDecimal.ZERO.compareTo(BigDecimal.ZERO) > 0) {
            int restoredPoints = BigDecimal.ZERO.divide(BigDecimal.valueOf(1000), 0, java.math.RoundingMode.HALF_UP).intValue();
            User user = order.getUser();
            user.setLoyaltyPoints((user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0) + restoredPoints);
            userRepository.save(user);
        }

        // Update payment if exists
        paymentRepository.findByOrderId(order.getId()).ifPresent(payment -> {
            if (payment.getStatus() == Order.PaymentStatus.SUCCESS) {
                payment.setStatus(Order.PaymentStatus.REFUNDED);
            } else {
                payment.setStatus(Order.PaymentStatus.FAILED);
            }
            paymentRepository.save(payment);
        });

        order = orderRepository.save(order);
        return OrderResponse.fromEntity(order);
    }

    private record CartItemToOrder(Book book, int quantity) {}
}
