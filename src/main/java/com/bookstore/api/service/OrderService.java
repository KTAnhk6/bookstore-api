package com.bookstore.api.service;

import com.bookstore.api.dto.request.CancelOrderRequest;
import com.bookstore.api.dto.request.OrderRequest;
import com.bookstore.api.dto.response.OrderResponse;
import com.bookstore.api.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface OrderService {

    OrderResponse createOrder(Long userId, OrderRequest request);

    Page<OrderResponse> getUserOrders(Long userId, Order.OrderStatus status, Pageable pageable);

    OrderResponse getOrderById(Long userId, Long orderId);

    OrderResponse getOrderByCode(Long userId, String orderCode);

    OrderResponse cancelOrder(Long userId, Long orderId, CancelOrderRequest request);

    /** Admin/nhân viên đổi trạng thái đơn; huỷ đơn sẽ hoàn kho và cập nhật thanh toán như khách tự huỷ. */
    OrderResponse adminUpdateStatus(Long orderId, Order.OrderStatus status);
}
