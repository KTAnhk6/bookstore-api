package com.bookstore.api.service.impl;

import com.bookstore.api.dto.response.CouponResponse;
import com.bookstore.api.dto.response.PaymentResponse;
import com.bookstore.api.entity.Coupon;
import com.bookstore.api.entity.Order;
import com.bookstore.api.entity.Payment;
import com.bookstore.api.exception.BadRequestException;
import com.bookstore.api.exception.ResourceNotFoundException;
import com.bookstore.api.repository.CouponRepository;
import com.bookstore.api.repository.OrderRepository;
import com.bookstore.api.repository.PaymentRepository;
import com.bookstore.api.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final CouponRepository couponRepository;

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByOrderId(Long userId, Long orderId) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        Payment payment = paymentRepository.findByOrderId(order.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "orderId", orderId));

        return PaymentResponse.fromEntity(payment);
    }

    @Override
    @Transactional
    public PaymentResponse processPayment(Long orderId, String transactionCode, String notes) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        Payment payment = paymentRepository.findByOrderId(order.getId())
                .orElseGet(() -> Payment.builder()
                        .order(order)
                        
                        .amount(order.getTotalAmount())
                        .method(order.getPaymentMethod())
                        .build());

        payment.setStatus(Order.PaymentStatus.SUCCESS);
        payment.setTransactionCode(transactionCode != null ? transactionCode : "TXN-" + System.currentTimeMillis());
        payment.setPaidAt(LocalDateTime.now());
        payment.setNotes(notes);

        payment = paymentRepository.save(payment);

        order.setPaymentStatus(Order.PaymentStatus.SUCCESS);
        if (order.getStatus() == Order.OrderStatus.PENDING) {
            order.setStatus(Order.OrderStatus.CONFIRMED);
        }
        orderRepository.save(order);

        return PaymentResponse.fromEntity(payment);
    }

    @Override
    @Transactional
    public PaymentResponse createPaymentSession(Long userId, Long orderId, Order.PaymentMethod method) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (order.getPaymentStatus() == Order.PaymentStatus.SUCCESS) {
            throw new BadRequestException("Đơn hàng này đã được thanh toán thành công.");
        }

        order.setPaymentMethod(method);
        orderRepository.save(order);

        Payment payment = Payment.builder()
                .order(order)
                .amount(order.getTotalAmount())
                .method(method)
                .status(Order.PaymentStatus.PENDING)
                .build();

        if (method == Order.PaymentMethod.QR_CODE) {
            payment.setQrData("QR_DATA_DEMO_" + order.getOrderCode());
            payment.setQrCodeUrl("https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + payment.getQrData());
            payment.setQrExpiredAt(LocalDateTime.now().plusMinutes(15));
            payment.setBankCode("VNPAY");
            payment.setAccountNumber("0123456789");
        } else if (method == Order.PaymentMethod.VNPAY) {
            payment.setTransactionCode("VNP_" + System.currentTimeMillis());
            payment.setNotes("Chuyển hướng đến VNPay...");
        }

        payment = paymentRepository.save(payment);
        return PaymentResponse.fromEntity(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<PaymentResponse> getPaymentHistory(Long userId, Long orderId) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        return paymentRepository.findByOrderIdOrderByCreatedAtDesc(order.getId())
                .stream()
                .map(PaymentResponse::fromEntity)
                .collect(java.util.stream.Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CouponResponse validateCoupon(String code, BigDecimal subtotal) {
        if (code == null || code.isBlank()) {
            throw new BadRequestException("Vui lòng nhập mã giảm giá");
        }

        Coupon coupon = couponRepository.findByCodeIgnoreCaseAndActiveTrue(code.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Mã giảm giá '" + code + "' không tồn tại hoặc đã hết hạn"));

        if (!coupon.isValid(subtotal != null ? subtotal : BigDecimal.ZERO)) {
            throw new BadRequestException("Đơn hàng chưa đạt điều kiện áp dụng mã giảm giá này");
        }

        BigDecimal discount = coupon.calculateDiscount(subtotal != null ? subtotal : BigDecimal.ZERO);
        CouponResponse response = CouponResponse.fromEntity(coupon);
        response.setCalculatedDiscount(discount);
        return response;
    }
}
