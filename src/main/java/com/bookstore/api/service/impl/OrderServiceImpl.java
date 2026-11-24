package com.bookstore.api.service.impl;

import com.bookstore.api.common.ShippingFeeCalculator;
import com.bookstore.api.dto.request.CancelOrderRequest;
import com.bookstore.api.dto.request.CartRequest;
import com.bookstore.api.dto.request.OrderRequest;
import com.bookstore.api.dto.response.OrderResponse;
import com.bookstore.api.entity.*;
import com.bookstore.api.exception.BadRequestException;
import com.bookstore.api.exception.ResourceNotFoundException;
import com.bookstore.api.repository.*;
import com.bookstore.api.service.OrderService;
import com.bookstore.api.service.ShippingService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.TreeMap;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final AddressRepository addressRepository;
    private final CouponRepository couponRepository;
    private final PaymentRepository paymentRepository;
    private final EntityManager entityManager;
    private final ShippingService shippingService;

    private static final Random RANDOM = new Random();

    private String generateOrderCode() {
        String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int rand = 1000 + RANDOM.nextInt(9000);
        return "ORD-" + datePart + "-" + rand;
    }

    @Override
    @Transactional
    public OrderResponse createOrder(Long userId, OrderRequest request) {
        // Khóa user: các đơn của cùng một khách chạy lần lượt (không tiêu trùng điểm / dùng trùng mã giảm giá)
        User user = userRepository.lockById(userId)
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
                ward == null || ward.isBlank() ||
                detailAddress == null || detailAddress.isBlank()) {
                throw new BadRequestException("Vui lòng cung cấp đầy đủ thông tin địa chỉ giao hàng");
            }
            phone = phone.replaceAll("[\\s.\\-]", "");
            if (!phone.matches("^(0|\\+84)[0-9]{9}$")) {
                throw new BadRequestException("Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0 hoặc +84)");
            }
        }

        // 2. Determine items to purchase (gộp cùng một sách, sắp theo id để khóa dòng theo thứ tự cố định)
        Map<Long, Integer> quantities = new TreeMap<>();
        Map<Long, Book> books = new HashMap<>();
        List<Long> cartItemIdsToDelete = new ArrayList<>();

        if (request.getDirectItems() != null && !request.getDirectItems().isEmpty()) {
            // Direct buy
            for (CartRequest cr : request.getDirectItems()) {
                if (cr == null || cr.getBookId() == null || cr.getQuantity() == null || cr.getQuantity() < 1) {
                    throw new BadRequestException("Sản phẩm hoặc số lượng không hợp lệ");
                }
                Book book = bookRepository.findById(cr.getBookId())
                        .orElseThrow(() -> new ResourceNotFoundException("Book", "id", cr.getBookId()));
                books.put(book.getId(), book);
                quantities.merge(book.getId(), cr.getQuantity(), Integer::sum);
            }
        } else {
            // From cart
            List<Cart> cartList = cartRepository.findByUserIdOrderByCreatedAtDesc(userId);
            if (cartList.isEmpty()) {
                throw new BadRequestException("Giỏ hàng của bạn đang trống");
            }
            for (Cart c : cartList) {
                books.put(c.getBook().getId(), c.getBook());
                quantities.merge(c.getBook().getId(), c.getQuantity(), Integer::sum);
                cartItemIdsToDelete.add(c.getId());
            }
        }

        List<CartItemToOrder> itemsToOrder = new ArrayList<>();
        quantities.forEach((bookId, qty) -> itemsToOrder.add(new CartItemToOrder(books.get(bookId), qty)));

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

            BigDecimal itemPrice = book.getEffectivePrice() != null ? book.getEffectivePrice() : BigDecimal.ZERO;
            BigDecimal itemTotal = itemPrice.multiply(BigDecimal.valueOf(qty));
            subtotal = subtotal.add(itemTotal);
        }

        // 4. Calculate shipping fee (Google Maps if configured, or regional calculator)
        BigDecimal shippingFee;
        if (shippingService != null && shippingService.hasGoogleApiKey()) {
            ShippingService.ShippingQuote quote = shippingService.calculateShipping(province, district, ward, detailAddress, subtotal, itemsToOrder.size());
            shippingFee = quote != null ? quote.getShippingFee() : ShippingFeeCalculator.calculate(subtotal, province);
        } else {
            shippingFee = ShippingFeeCalculator.calculate(subtotal, province);
        }

        // 5. Calculate coupon discount
        Coupon coupon = null;
        BigDecimal couponDiscount = BigDecimal.ZERO;
        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            coupon = couponRepository.findByCodeIgnoreCaseAndActiveTrue(request.getCouponCode().trim())
                    .orElseThrow(() -> new BadRequestException("Mã giảm giá không hợp lệ hoặc đã hết hạn"));

            if (!coupon.isValid(subtotal)) {
                throw new BadRequestException("Mã giảm giá không đủ điều kiện áp dụng cho đơn hàng này");
            }
            checkCouponUsage(userId, coupon);

            couponDiscount = coupon.calculateDiscount(subtotal);
            if (couponRepository.incrementUsage(coupon.getId()) == 0) {
                throw new BadRequestException("Mã giảm giá đã hết lượt sử dụng");
            }
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
                .shippingAddress(recipientName + ", " + phone + " - " + detailAddress + ", " + ward + ", "
                        + (district == null || district.isBlank() ? "" : district + ", ") + province)
                .note(request.getNote())
                .subtotal(subtotal)
                .shippingFee(shippingFee)
                .discountAmount(couponDiscount)
                .totalAmount(totalAmount)
                .status(Order.OrderStatus.PENDING)
                .paymentMethod(request.getPaymentMethod())
                .paymentStatus(Order.PaymentStatus.PENDING)
                .coupon(coupon)
                .pointsUsed(usedPoints)
                .pointsDiscount(pointsDiscount)
                .build();

        order = orderRepository.save(order);

        // 8. Create OrderItems & Deduct Book Stock
        List<OrderItem> orderItems = new ArrayList<>();
        for (CartItemToOrder item : itemsToOrder) {
            Book book = item.book();
            int qty = item.quantity();

            BigDecimal unitPrice = book.getEffectivePrice() != null ? book.getEffectivePrice() : BigDecimal.ZERO;
            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .book(book)
                    .bookTitle(book.getTitle())
                    .bookCoverImage(book.getCoverImage())
                    .price(unitPrice)
                    .quantity(qty)
                    .subtotal(unitPrice.multiply(BigDecimal.valueOf(qty)))
                    .build();

            orderItems.add(orderItem);

            // Deduct stock & add sold (nguyên tử ở DB; đơn khác vừa mua hết thì báo lỗi và rollback cả đơn)
            if (bookRepository.decreaseStock(book.getId(), qty) == 0) {
                throw new BadRequestException("Sách '" + book.getTitle() + "' không còn đủ hàng, vui lòng thử lại");
            }
            entityManager.refresh(book);
            if (book.getStockQuantity() == 0) {
                book.setStatus(Book.Status.OUT_OF_STOCK);
                bookRepository.save(book);
            }
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

        // Điểm thưởng được cộng khi đơn giao thành công (adminUpdateStatus -> DELIVERED), không cộng lúc đặt
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
        if (order.getPaymentStatus() == Order.PaymentStatus.SUCCESS) {
            throw new BadRequestException("Đơn hàng đã thanh toán, vui lòng liên hệ shop để huỷ và hoàn tiền");
        }

        order.setStatus(Order.OrderStatus.CANCELLED);
        // Giữ ghi chú của khách, thêm lý do huỷ vào cuối
        String cancelNote = "Hủy đơn hàng: " + request.getReason();
        order.setNote(order.getNote() == null || order.getNote().isBlank() ? cancelNote : order.getNote() + "\n" + cancelNote);

        restoreStock(order);
        reversePoints(order);
        failOrRefundPayment(order);
        restoreCoupon(order);

        order = orderRepository.save(order);
        return OrderResponse.fromEntity(order);
    }

    private void restoreCoupon(Order order) {
        Coupon coupon = order.getCoupon();
        if (coupon != null) {
            couponRepository.decrementUsage(coupon.getId());
        }
    }

    /** Huỷ / hoàn trả: trả lại điểm khách đã dùng, thu hồi điểm đã cộng khi giao thành công. */
    private void reversePoints(Order order) {
        int used = order.getPointsUsed() != null ? order.getPointsUsed() : 0;
        int earned = order.getPointsEarned() != null ? order.getPointsEarned() : 0;
        adjustPoints(order.getUser().getId(), used - earned);
        order.setPointsEarned(order.getPointsEarned() == null ? null : 0);
    }

    private void adjustPoints(Long userId, int delta) {
        if (delta == 0) return;
        User user = userRepository.lockById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        int current = user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0;
        user.setLoyaltyPoints(Math.max(0, current + delta));
        userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public void checkCouponUsage(Long userId, Coupon coupon) {
        if (userId == null) return;
        if (Boolean.TRUE.equals(coupon.getFirstOrderOnly())
                && orderRepository.existsByUserIdAndStatusNot(userId, Order.OrderStatus.CANCELLED)) {
            throw new BadRequestException("Mã " + coupon.getCode() + " chỉ áp dụng cho đơn hàng đầu tiên");
        }
        if (orderRepository.existsByUserIdAndCouponIdAndStatusNot(userId, coupon.getId(), Order.OrderStatus.CANCELLED)) {
            throw new BadRequestException("Bạn đã sử dụng mã " + coupon.getCode() + " rồi");
        }
    }

    private void restoreStock(Order order) {
        // Restore stock
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                if (item.getBook() != null) {
                    Book book = item.getBook();
                    bookRepository.increaseStock(book.getId(), item.getQuantity());
                    entityManager.refresh(book);
                    if (book.getStatus() == Book.Status.OUT_OF_STOCK && book.getStockQuantity() > 0) {
                        book.setStatus(Book.Status.AVAILABLE);
                        bookRepository.save(book);
                    }
                }
            }
        }
    }

    /** Đơn chưa thu tiền -> FAILED; đã thu tiền -> REFUND_PENDING, chờ admin hoàn tiền xong mới chuyển REFUNDED. */
    private void failOrRefundPayment(Order order) {
        Order.PaymentStatus next = order.getPaymentStatus() == Order.PaymentStatus.SUCCESS
                ? Order.PaymentStatus.REFUND_PENDING : Order.PaymentStatus.FAILED;
        order.setPaymentStatus(next);
        paymentRepository.findByOrderId(order.getId()).ifPresent(payment -> {
            payment.setStatus(next);
            paymentRepository.save(payment);
        });
    }

    private static boolean canTransition(Order.OrderStatus from, Order.OrderStatus to) {
        return switch (to) {
            case CANCELLED -> from == Order.OrderStatus.PENDING || from == Order.OrderStatus.CONFIRMED
                    || from == Order.OrderStatus.PROCESSING;
            case RETURNED -> from != Order.OrderStatus.CANCELLED && from != Order.OrderStatus.RETURNED;
            // Luồng thường chỉ được đi tới, không quay lui
            default -> from.ordinal() < to.ordinal();
        };
    }

    @Override
    @Transactional
    public OrderResponse adminUpdateStatus(Long orderId, Order.OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        Order.OrderStatus current = order.getStatus();
        if (current == status) return OrderResponse.fromEntity(order);
        if (current == Order.OrderStatus.CANCELLED || current == Order.OrderStatus.RETURNED) {
            throw new BadRequestException("Đơn hàng đã " + (current == Order.OrderStatus.CANCELLED ? "huỷ" : "hoàn trả") + ", không thể đổi trạng thái");
        }
        if (!canTransition(current, status)) {
            throw new BadRequestException("Không thể chuyển đơn hàng từ " + current + " sang " + status);
        }
        if (status == Order.OrderStatus.CANCELLED || status == Order.OrderStatus.RETURNED) {
            restoreStock(order);
            reversePoints(order);
            failOrRefundPayment(order);
            restoreCoupon(order);
        }
        // Cộng điểm thưởng khi giao thành công (1 điểm / 100.000đ). Đơn cũ (pointsUsed == null) đã được cộng lúc đặt nên bỏ qua.
        if (status == Order.OrderStatus.DELIVERED && order.getPointsUsed() != null && order.getPointsEarned() == null) {
            int earned = order.getTotalAmount().divide(new BigDecimal("100000"), 0, java.math.RoundingMode.DOWN).intValue();
            order.setPointsEarned(earned);
            adjustPoints(order.getUser().getId(), earned);
        }
        order.setStatus(status);
        if (status == Order.OrderStatus.DELIVERED && order.getPaymentMethod() == Order.PaymentMethod.COD) {
            order.setPaymentStatus(Order.PaymentStatus.SUCCESS);
            paymentRepository.findByOrderId(order.getId()).ifPresent(payment -> {
                payment.setStatus(Order.PaymentStatus.SUCCESS);
                if (payment.getPaidAt() == null) payment.setPaidAt(LocalDateTime.now());
                paymentRepository.save(payment);
            });
        }
        return OrderResponse.fromEntity(orderRepository.save(order));
    }

    @Override
    @Transactional
    public OrderResponse adminMarkRefunded(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        if (order.getPaymentStatus() != Order.PaymentStatus.REFUND_PENDING) {
            throw new BadRequestException("Đơn hàng không ở trạng thái chờ hoàn tiền");
        }
        order.setPaymentStatus(Order.PaymentStatus.REFUNDED);
        paymentRepository.findByOrderId(order.getId()).ifPresent(payment -> {
            payment.setStatus(Order.PaymentStatus.REFUNDED);
            paymentRepository.save(payment);
        });
        return OrderResponse.fromEntity(orderRepository.save(order));
    }

    @Override
    @Transactional(readOnly = true)
    public ShippingService.ShippingQuote estimateShippingFee(Long userId, OrderRequest request) {
        String province = request.getProvince();
        String district = request.getDistrict();
        String ward = request.getWard();
        String detailAddress = request.getDetailAddress();

        if (request.getAddressId() != null && userId != null) {
            Address address = addressRepository.findByIdAndUserId(request.getAddressId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Address", "id", request.getAddressId()));
            province = address.getProvince();
            district = address.getDistrict();
            ward = address.getWard();
            detailAddress = address.getDetailAddress();
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        int totalBooks = 0;

        if (request.getDirectItems() != null && !request.getDirectItems().isEmpty()) {
            for (CartRequest cr : request.getDirectItems()) {
                if (cr != null && cr.getBookId() != null && cr.getQuantity() != null && cr.getQuantity() > 0) {
                    Book book = bookRepository.findById(cr.getBookId()).orElse(null);
                    if (book != null) {
                        BigDecimal itemPrice = book.getEffectivePrice() != null ? book.getEffectivePrice() : BigDecimal.ZERO;
                        subtotal = subtotal.add(itemPrice.multiply(BigDecimal.valueOf(cr.getQuantity())));
                        totalBooks += cr.getQuantity();
                    }
                }
            }
        } else if (userId != null) {
            List<Cart> cartList = cartRepository.findByUserIdOrderByCreatedAtDesc(userId);
            for (Cart c : cartList) {
                BigDecimal itemPrice = c.getBook() != null && c.getBook().getEffectivePrice() != null ? c.getBook().getEffectivePrice() : BigDecimal.ZERO;
                subtotal = subtotal.add(itemPrice.multiply(BigDecimal.valueOf(c.getQuantity())));
                totalBooks += c.getQuantity();
            }
        }

        return shippingService.calculateShipping(province, district, ward, detailAddress, subtotal, Math.max(1, totalBooks));
    }

    private record CartItemToOrder(Book book, int quantity) {}
}
