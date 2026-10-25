package com.bookstore.api.service.impl;

import com.bookstore.api.dto.request.CartRequest;
import com.bookstore.api.dto.response.CartItemResponse;
import com.bookstore.api.dto.response.CartResponse;
import com.bookstore.api.entity.Book;
import com.bookstore.api.entity.Cart;
import com.bookstore.api.entity.User;
import com.bookstore.api.exception.BadRequestException;
import com.bookstore.api.exception.ResourceNotFoundException;
import com.bookstore.api.repository.BookRepository;
import com.bookstore.api.repository.CartRepository;
import com.bookstore.api.repository.UserRepository;
import com.bookstore.api.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public CartResponse getCart(Long userId) {
        List<Cart> items = cartRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<CartItemResponse> itemResponses = items.stream()
                .map(CartItemResponse::fromEntity)
                .collect(Collectors.toList());
        return CartResponse.fromItems(itemResponses);
    }

    @Override
    @Transactional
    public CartResponse addToCart(Long userId, CartRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new ResourceNotFoundException("Book", "id", request.getBookId()));

        if (book.getStatus() != Book.Status.AVAILABLE) {
            throw new BadRequestException("Sách này hiện không còn kinh doanh");
        }

        if (book.getStockQuantity() <= 0) {
            throw new BadRequestException("Sách này hiện đã hết hàng");
        }

        int requestedQuantity = request.getQuantity() != null ? request.getQuantity() : 1;

        Optional<Cart> existingCartOpt = cartRepository.findByUserIdAndBookId(userId, book.getId());
        if (existingCartOpt.isPresent()) {
            Cart cart = existingCartOpt.get();
            int newQuantity = cart.getQuantity() + requestedQuantity;
            if (newQuantity > book.getStockQuantity()) {
                throw new BadRequestException("Số lượng yêu cầu vượt quá số lượng còn lại trong kho (Còn " + book.getStockQuantity() + " cuốn)");
            }
            cart.setQuantity(newQuantity);
            cartRepository.save(cart);
        } else {
            if (requestedQuantity > book.getStockQuantity()) {
                throw new BadRequestException("Số lượng yêu cầu vượt quá số lượng còn lại trong kho (Còn " + book.getStockQuantity() + " cuốn)");
            }
            Cart cart = Cart.builder()
                    .user(user)
                    .book(book)
                    .quantity(requestedQuantity)
                    .build();
            cartRepository.save(cart);
        }

        return getCart(userId);
    }

    @Override
    @Transactional
    public CartResponse updateCartItem(Long userId, Long itemId, Integer quantity) {
        if (quantity == null || quantity <= 0) {
            return removeCartItem(userId, itemId);
        }

        Cart cart = cartRepository.findByIdAndUserId(itemId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", "id", itemId));

        if (quantity > cart.getBook().getStockQuantity()) {
            throw new BadRequestException("Số lượng yêu cầu vượt quá số lượng còn lại trong kho (Còn " + cart.getBook().getStockQuantity() + " cuốn)");
        }

        cart.setQuantity(quantity);
        cartRepository.save(cart);

        return getCart(userId);
    }

    @Override
    @Transactional
    public CartResponse removeCartItem(Long userId, Long itemId) {
        Cart cart = cartRepository.findByIdAndUserId(itemId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", "id", itemId));

        cartRepository.delete(cart);
        return getCart(userId);
    }

    @Override
    @Transactional
    public void clearCart(Long userId) {
        cartRepository.deleteByUserId(userId);
    }
}
