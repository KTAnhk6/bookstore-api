package com.bookstore.api.service;

import com.bookstore.api.dto.response.OrderResponse;
import java.util.List;

public interface OrderService {
    List<OrderResponse> getAll();
    OrderResponse getById(Long id);
    OrderResponse updateStatus(Long id, String status);
}