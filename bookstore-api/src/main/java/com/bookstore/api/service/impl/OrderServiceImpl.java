package com.bookstore.api.service.impl;

import com.bookstore.api.dto.response.OrderItemResponse;
import com.bookstore.api.dto.response.OrderResponse;
import com.bookstore.api.entity.Order;
import com.bookstore.api.exception.BadRequestException;
import com.bookstore.api.exception.ResourceNotFoundException;
import com.bookstore.api.repository.OrderItemRepository;
import com.bookstore.api.repository.OrderRepository;
import com.bookstore.api.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    @Override
    public List<OrderResponse> getAll() {
        return orderRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public OrderResponse getById(Long id) {
        Order o = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        return toResponse(o);
    }

    @Override
    public OrderResponse updateStatus(Long id, String status) {
        Order o = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        try {
            o.setOrderStatus(Order.OrderStatus.valueOf(status.toUpperCase()));
        } catch (Exception e) {
            throw new BadRequestException("Trạng thái không hợp lệ");
        }
        return toResponse(orderRepository.save(o));
    }

    private OrderResponse toResponse(Order o) {
        List<OrderItemResponse> items = orderItemRepository.findByOrderId(o.getId())
                .stream().map(i -> OrderItemResponse.builder()
                        .id(i.getId())
                        .bookId(i.getBook().getId())
                        .bookTitle(i.getBook().getTitle())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice())
                        .subtotal(i.getSubtotal())
                        .build()).toList();

        return OrderResponse.builder()
                .id(o.getId())
                .orderCode(o.getOrderCode())
                .customerName(o.getUser().getFullName())
                .shippingAddress(o.getShippingAddress())
                .subtotal(o.getSubtotal())
                .discountAmount(o.getDiscountAmount())
                .shippingFee(o.getShippingFee())
                .totalAmount(o.getTotalAmount())
                .paymentMethod(o.getPaymentMethod().name())
                .paymentStatus(o.getPaymentStatus().name())
                .orderStatus(o.getOrderStatus().name())
                .note(o.getNote())
                .createdAt(o.getCreatedAt())
                .items(items)
                .build();
    }
}