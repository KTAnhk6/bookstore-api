package com.bookstore.api;

import com.bookstore.api.dto.response.PopularSearchResponse;
import com.bookstore.api.dto.response.SearchHistoryResponse;
import com.bookstore.api.entity.SearchHistory;
import com.bookstore.api.entity.User;
import com.bookstore.api.exception.BadRequestException;
import com.bookstore.api.repository.PopularSearchProjection;
import com.bookstore.api.repository.SearchHistoryRepository;
import com.bookstore.api.repository.UserRepository;
import com.bookstore.api.service.impl.SearchHistoryServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SearchHistoryServiceTest {

    @Mock
    private SearchHistoryRepository searchHistoryRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private SearchHistoryServiceImpl searchHistoryService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .username("nguyenvana")
                .fullName("Nguyễn Văn A")
                .build();
    }

    @Test
    @DisplayName("Lưu từ khóa tìm kiếm mới cho người dùng")
    void testSaveSearchKeyword_NewKeyword_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(searchHistoryRepository.findByUserIdAndKeywordIgnoreCase(1L, "Spring Boot"))
                .thenReturn(Optional.empty());

        SearchHistory saved = SearchHistory.builder()
                .id(100L)
                .user(sampleUser)
                .keyword("Spring Boot")
                .searchCount(1)
                .resultsCount(12)
                .searchedAt(LocalDateTime.now())
                .build();
        when(searchHistoryRepository.save(any(SearchHistory.class))).thenReturn(saved);

        SearchHistoryResponse response = searchHistoryService.saveSearchKeyword(1L, "Spring Boot", 12);

        assertNotNull(response);
        assertEquals("Spring Boot", response.getKeyword());
        assertEquals(1, response.getSearchCount());
        assertEquals(12, response.getResultsCount());
        verify(searchHistoryRepository, times(1)).save(any(SearchHistory.class));
    }

    @Test
    @DisplayName("Tìm kiếm lại từ khóa cũ sẽ tăng số lần searchCount và cập nhật thời gian")
    void testSaveSearchKeyword_ExistingKeyword_IncrementsCount() {
        SearchHistory existing = SearchHistory.builder()
                .id(100L)
                .user(sampleUser)
                .keyword("Spring Boot")
                .searchCount(1)
                .searchedAt(LocalDateTime.now().minusDays(1))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(searchHistoryRepository.findByUserIdAndKeywordIgnoreCase(1L, "Spring Boot"))
                .thenReturn(Optional.of(existing));
        when(searchHistoryRepository.save(any(SearchHistory.class))).thenReturn(existing);

        SearchHistoryResponse response = searchHistoryService.saveSearchKeyword(1L, "Spring Boot", 20);

        assertNotNull(response);
        assertEquals(2, existing.getSearchCount());
        verify(searchHistoryRepository, times(1)).save(existing);
    }

    @Test
    @DisplayName("Ném lỗi khi từ khóa tìm kiếm rỗng")
    void testSaveSearchKeyword_BlankKeyword_ThrowsBadRequest() {
        assertThrows(BadRequestException.class, () ->
                searchHistoryService.saveSearchKeyword(1L, "   ", 0)
        );
    }

    @Test
    @DisplayName("Lấy lịch sử tìm kiếm người dùng")
    void testGetUserSearchHistory_Success() {
        SearchHistory item = SearchHistory.builder()
                .id(1L)
                .user(sampleUser)
                .keyword("Java Design Patterns")
                .searchCount(3)
                .searchedAt(LocalDateTime.now())
                .build();

        when(userRepository.existsById(1L)).thenReturn(true);
        when(searchHistoryRepository.findByUserIdOrderBySearchedAtDesc(eq(1L), any(Pageable.class)))
                .thenReturn(List.of(item));

        List<SearchHistoryResponse> history = searchHistoryService.getUserSearchHistory(1L, 10);

        assertEquals(1, history.size());
        assertEquals("Java Design Patterns", history.get(0).getKeyword());
    }

    @Test
    @DisplayName("Xóa toàn bộ lịch sử tìm kiếm của người dùng")
    void testClearUserSearchHistory_Success() {
        when(userRepository.existsById(1L)).thenReturn(true);

        searchHistoryService.clearUserSearchHistory(1L);

        verify(searchHistoryRepository, times(1)).deleteByUserId(1L);
    }

    @Test
    @DisplayName("Lấy danh sách từ khóa tìm kiếm phổ biến")
    void testGetPopularSearches_Success() {
        PopularSearchProjection projection = new PopularSearchProjection() {
            @Override
            public String getKeyword() {
                return "Lập trình Java";
            }

            @Override
            public Long getTotalSearches() {
                return 45L;
            }
        };

        when(searchHistoryRepository.findTopPopularKeywords(any(Pageable.class)))
                .thenReturn(List.of(projection));

        List<PopularSearchResponse> popular = searchHistoryService.getPopularSearches(10);

        assertEquals(1, popular.size());
        assertEquals("Lập trình Java", popular.get(0).getKeyword());
        assertEquals(45L, popular.get(0).getTotalSearches());
    }
}
