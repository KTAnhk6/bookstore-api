package com.bookstore.api.controller;

import com.bookstore.api.common.ApiResponse;
import com.bookstore.api.dto.response.BookResponse;
import com.bookstore.api.entity.Book;
import com.bookstore.api.entity.User;
import com.bookstore.api.entity.Wishlist;
import com.bookstore.api.exception.ResourceNotFoundException;
import com.bookstore.api.repository.BookRepository;
import com.bookstore.api.repository.UserRepository;
import com.bookstore.api.repository.WishlistRepository;
import com.bookstore.api.security.CustomUserDetails;
import com.bookstore.api.service.BookRatingEnricher;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/** Danh sách sách yêu thích của người dùng đang đăng nhập. */
@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistRepository wishlistRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final BookRatingEnricher ratingEnricher;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<BookResponse>>> list(@AuthenticationPrincipal CustomUserDetails user) {
        List<BookResponse> books = wishlistRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(w -> BookResponse.fromEntity(w.getBook()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(ratingEnricher.enrich(books)));
    }

    @PostMapping("/{bookId}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> add(@AuthenticationPrincipal CustomUserDetails user, @PathVariable Long bookId) {
        if (wishlistRepository.findByUserIdAndBookId(user.getId(), bookId).isEmpty()) {
            Book book = bookRepository.findById(bookId)
                    .orElseThrow(() -> new ResourceNotFoundException("Book", "id", bookId));
            User owner = userRepository.getReferenceById(user.getId());
            wishlistRepository.save(Wishlist.builder().user(owner).book(book).build());
        }
        return ResponseEntity.ok(ApiResponse.success("Đã thêm vào danh sách yêu thích", null));
    }

    @DeleteMapping("/{bookId}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> remove(@AuthenticationPrincipal CustomUserDetails user, @PathVariable Long bookId) {
        wishlistRepository.findByUserIdAndBookId(user.getId(), bookId).ifPresent(wishlistRepository::delete);
        return ResponseEntity.ok(ApiResponse.success("Đã xoá khỏi danh sách yêu thích", null));
    }
}
