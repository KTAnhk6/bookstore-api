package com.bookstore.api.service;

import com.bookstore.api.dto.response.BookResponse;
import com.bookstore.api.entity.Book;
import com.bookstore.api.repository.BookRepository;
import com.bookstore.api.repository.OrderRepository;
import com.bookstore.api.repository.UserFavoriteCategoryRepository;
import com.bookstore.api.service.impl.RecommendationServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RecommendationServiceTest {

    @Mock
    private BookRepository bookRepository;

    @Mock
    private UserFavoriteCategoryRepository favoriteCategoryRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private BookRatingEnricher ratingEnricher;

    @InjectMocks
    private RecommendationServiceImpl recommendationService;

    private Book makeBook(long id, String title, int sold) {
        return Book.builder()
                .id(id)
                .title(title)
                .slug("book-" + id)
                .price(BigDecimal.valueOf(100000))
                .stockQuantity(10)
                .soldQuantity(sold)
                .status(Book.Status.AVAILABLE)
                .createdAt(LocalDateTime.of(2026, 9, 1, 9, 0))
                .build();
    }

    @Test
    @DisplayName("Chọn 1 sở thích chỉ có 2 sách -> trả đúng 2 sách đó, không nhồi thêm thành 12")
    void whenUserHasFavoriteCategoryWithFewerBooksThanLimit_returnsOnlyMatchingBooks() {
        Book b1 = makeBook(1L, "Sách Kinh Doanh A", 5);
        Book b2 = makeBook(2L, "Sách Kinh Doanh B", 20);

        when(favoriteCategoryRepository.findCategoryIdsByUserId(10L)).thenReturn(List.of(8L));
        when(bookRepository.findByCategoriesIn(eq(List.of(8L)), eq(Book.Status.AVAILABLE), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(b1, b2)));
        when(ratingEnricher.enrich(anyList())).thenAnswer(inv -> inv.getArgument(0));

        List<BookResponse> result = recommendationService.getPersonalizedRecommendations(10L, 12);

        assertEquals(2, result.size());
        assertEquals(2L, result.get(0).getId());
        assertEquals(1L, result.get(1).getId());

        verifyNoInteractions(orderRepository);
        verify(bookRepository, never()).findTop10ByStatusOrderBySoldQuantityDesc(any());
        verify(bookRepository, never()).findTop8ByStatusOrderByCreatedAtDesc(any());
    }

    @Test
    @DisplayName("Chọn 1 sở thích không có sách nào -> trả danh sách rỗng, không bù sách khác tag")
    void whenUserHasFavoriteCategoryWithNoBooks_returnsEmptyList() {
        when(favoriteCategoryRepository.findCategoryIdsByUserId(10L)).thenReturn(List.of(9L));
        when(bookRepository.findByCategoriesIn(eq(List.of(9L)), eq(Book.Status.AVAILABLE), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));
        when(ratingEnricher.enrich(anyList())).thenAnswer(inv -> inv.getArgument(0));

        List<BookResponse> result = recommendationService.getPersonalizedRecommendations(10L, 12);

        assertTrue(result.isEmpty());
        verifyNoInteractions(orderRepository);
        verify(bookRepository, never()).findTop10ByStatusOrderBySoldQuantityDesc(any());
        verify(bookRepository, never()).findTop8ByStatusOrderByCreatedAtDesc(any());
    }

    @Test
    @DisplayName("Chưa chọn sở thích nào -> fallback về lịch sử mua / bán chạy / mới nhất tới limit")
    void whenUserHasNoFavorites_fallsBackToHistoryAndPopular() {
        Book bestSeller = makeBook(50L, "Bestseller", 100);
        when(favoriteCategoryRepository.findCategoryIdsByUserId(10L)).thenReturn(Collections.emptyList());
        when(orderRepository.findPurchasedCategoryIdsByUserId(10L)).thenReturn(Collections.emptyList());
        when(orderRepository.findPurchasedAuthorIdsByUserId(10L)).thenReturn(Collections.emptyList());
        when(bookRepository.findTop10ByStatusOrderBySoldQuantityDesc(Book.Status.AVAILABLE))
                .thenReturn(List.of(bestSeller));
        when(bookRepository.findTop8ByStatusOrderByCreatedAtDesc(Book.Status.AVAILABLE))
                .thenReturn(Collections.emptyList());
        when(ratingEnricher.enrich(anyList())).thenAnswer(inv -> inv.getArgument(0));

        List<BookResponse> result = recommendationService.getPersonalizedRecommendations(10L, 12);

        assertEquals(1, result.size());
        assertEquals(50L, result.get(0).getId());
    }
}
