package com.bookstore.api.service.impl;

import com.bookstore.api.entity.Order;
import com.bookstore.api.entity.Payment;
import com.bookstore.api.exception.BadRequestException;
import com.bookstore.api.exception.ResourceNotFoundException;
import com.bookstore.api.repository.OrderRepository;
import com.bookstore.api.repository.PaymentRepository;
import com.bookstore.api.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;

    @Override
    public Payment createPaymentSession(Long orderId, String paymentMethodCode) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));

        Payment.PaymentMethod method;
        try {
            method = Payment.PaymentMethod.valueOf(paymentMethodCode.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Hình thức thanh toán không hợp lệ");
        }

        Payment payment = Payment.builder()
                .order(order)
                .amount(order.getTotalAmount() != null ? order.getTotalAmount() : java.math.BigDecimal.ZERO)
                .paymentMethod(method)
                .paymentStatus(Payment.PaymentStatus.PENDING)
                .build();

        return paymentRepository.save(payment);
    }

    @Override
    public List<Payment> getPaymentHistoryByOrderId(Long orderId) {
        return paymentRepository.findByOrderId(orderId);
    }

    @Override
    public Payment updatePaymentStatus(Long paymentId, String status, String transactionId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch thanh toán"));

        Payment.PaymentStatus newStatus;
        try {
            newStatus = Payment.PaymentStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Trạng thái thanh toán không hợp lệ");
        }

        payment.setPaymentStatus(newStatus);
        if (transactionId != null && !transactionId.isEmpty()) {
            payment.setTransactionId(transactionId);
        }

        return paymentRepository.save(payment);
    }
}
