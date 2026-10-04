package com.bookstore.api;

import com.bookstore.api.common.ApiResponse;
import com.bookstore.api.controller.SearchHistoryController;
import com.bookstore.api.dto.request.SearchHistoryRequest;
import com.bookstore.api.dto.response.PopularSearchResponse;
import com.bookstore.api.dto.response.SearchHistoryResponse;
import com.bookstore.api.service.SearchHistoryService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SearchHistoryControllerTest {

    @Mock
    private SearchHistoryService searchHistoryService;

    @InjectMocks
    private SearchHistoryController searchHistoryController;

    @Test
    @DisplayName("API recordSearchHistory ghi nhận từ khóa thành công")
    void testRecordSearchHistory_Success() {
        SearchHistoryRequest request = SearchHistoryRequest.builder()
                .userId(1L)
                .keyword("Clean Code")
                .resultsCount(5)
                .build();

        SearchHistoryResponse serviceResponse = SearchHistoryResponse.builder()
                .id(1L)
                .userId(1L)
                .keyword("Clean Code")
                .searchCount(1)
                .resultsCount(5)
                .searchedAt(LocalDateTime.now())
                .build();

        when(searchHistoryService.saveSearchKeyword(eq(1L), eq("Clean Code"), eq(5)))
                .thenReturn(serviceResponse);

        ResponseEntity<ApiResponse<SearchHistoryResponse>> responseEntity =
                searchHistoryController.recordSearchHistory(request);

        assertNotNull(responseEntity);
        assertEquals(HttpStatus.CREATED, responseEntity.getStatusCode());
        assertNotNull(responseEntity.getBody());
        assertTrue(responseEntity.getBody().isSuccess());
        assertEquals("Clean Code", responseEntity.getBody().getData().getKeyword());
        verify(searchHistoryService, times(1)).saveSearchKeyword(1L, "Clean Code", 5);
    }

    @Test
    @DisplayName("API getUserSearchHistory lấy danh sách lịch sử")
    void testGetUserSearchHistory_Success() {
        SearchHistoryResponse item = SearchHistoryResponse.builder()
                .id(1L)
                .userId(1L)
                .keyword("Spring Boot")
                .searchCount(2)
                .searchedAt(LocalDateTime.now())
                .build();

        when(searchHistoryService.getUserSearchHistory(1L, 10))
                .thenReturn(List.of(item));

        ResponseEntity<ApiResponse<List<SearchHistoryResponse>>> responseEntity =
                searchHistoryController.getUserSearchHistory(1L, 10);

        assertNotNull(responseEntity);
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        assertEquals(1, responseEntity.getBody().getData().size());
        assertEquals("Spring Boot", responseEntity.getBody().getData().get(0).getKeyword());
        verify(searchHistoryService, times(1)).getUserSearchHistory(1L, 10);
    }

    @Test
    @DisplayName("API getPopularSearches lấy danh sách từ khóa phổ biến")
    void testGetPopularSearches_Success() {
        PopularSearchResponse pop = PopularSearchResponse.builder()
                .keyword("Mắt Biếc")
                .totalSearches(100L)
                .build();

        when(searchHistoryService.getPopularSearches(10))
                .thenReturn(List.of(pop));

        ResponseEntity<ApiResponse<List<PopularSearchResponse>>> responseEntity =
                searchHistoryController.getPopularSearches(10);

        assertNotNull(responseEntity);
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        assertEquals(1, responseEntity.getBody().getData().size());
        assertEquals("Mắt Biếc", responseEntity.getBody().getData().get(0).getKeyword());
        verify(searchHistoryService, times(1)).getPopularSearches(10);
    }

    @Test
    @DisplayName("API deleteSearchHistoryItem xóa 1 mục")
    void testDeleteSearchHistoryItem_Success() {
        ResponseEntity<ApiResponse<Void>> responseEntity =
                searchHistoryController.deleteSearchHistoryItem(10L, 1L);

        assertNotNull(responseEntity);
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        verify(searchHistoryService, times(1)).deleteSearchHistoryItem(1L, 10L);
    }

    @Test
    @DisplayName("API clearUserSearchHistory xóa toàn bộ lịch sử")
    void testClearUserSearchHistory_Success() {
        ResponseEntity<ApiResponse<Void>> responseEntity =
                searchHistoryController.clearUserSearchHistory(1L);

        assertNotNull(responseEntity);
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        verify(searchHistoryService, times(1)).clearUserSearchHistory(1L);
    }
}
