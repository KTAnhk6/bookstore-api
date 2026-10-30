package com.bookstore.api.service;

import com.bookstore.api.dto.request.CartRequest;
import com.bookstore.api.dto.response.CartResponse;

public interface CartService {

    CartResponse getCart(Long userId);

    CartResponse addToCart(Long userId, CartRequest request);

    CartResponse updateCartItem(Long userId, Long itemId, Integer quantity);

    CartResponse removeCartItem(Long userId, Long itemId);

    void clearCart(Long userId);
}
