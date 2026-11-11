package com.bookstore.api.controller;

import com.bookstore.api.common.ApiResponse;
import com.bookstore.api.dto.request.CartRequest;
import com.bookstore.api.dto.request.UpdateCartRequest;
import com.bookstore.api.dto.response.CartResponse;
import com.bookstore.api.security.CustomUserDetails;
import com.bookstore.api.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<ApiResponse<CartResponse>> getCart(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        CartResponse response = cartService.getCart(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CartResponse>> addToCart(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CartRequest request
    ) {
        CartResponse response = cartService.addToCart(userDetails.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Thêm vào giỏ hàng thành công", response));
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CartResponse>> updateCartItem(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateCartRequest request
    ) {
        CartResponse response = cartService.updateCartItem(userDetails.getId(), itemId, request.getQuantity());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật giỏ hàng thành công", response));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CartResponse>> removeCartItem(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long itemId
    ) {
        CartResponse response = cartService.removeCartItem(userDetails.getId(), itemId);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa sản phẩm khỏi giỏ hàng", response));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> clearCart(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        cartService.clearCart(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Đã làm trống giỏ hàng", null));
    }
}
