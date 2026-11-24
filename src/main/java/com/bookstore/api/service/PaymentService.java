package com.bookstore.api.service;

import com.bookstore.api.dto.response.CouponResponse;
import com.bookstore.api.dto.response.PaymentResponse;

import java.math.BigDecimal;

public interface PaymentService {

    PaymentResponse getPaymentByOrderId(Long userId, Long orderId);

    java.util.List<PaymentResponse> getPaymentHistory(Long userId, Long orderId);


    PaymentResponse processPayment(Long orderId, String transactionCode, String notes);

    CouponResponse validateCoupon(String code, BigDecimal subtotal);
}
