package com.bookstore.api;

import com.bookstore.api.common.ApiResponse;
import com.bookstore.api.controller.UserController;
import com.bookstore.api.dto.request.FavoriteCategoriesRequest;
import com.bookstore.api.dto.response.CategoryResponse;
import com.bookstore.api.dto.response.FavoriteCategoriesResponse;
import com.bookstore.api.service.UserService;
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
class UserControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    @Test
    @DisplayName("API updateFavoriteCategories gọi service và trả về kết quả thành công")
    void testUpdateFavoriteCategories_Success() {
        FavoriteCategoriesRequest request = FavoriteCategoriesRequest.builder()
                .categoryIds(List.of(1L, 2L, 3L))
                .build();

        FavoriteCategoriesResponse serviceResponse = FavoriteCategoriesResponse.builder()
                .userId(1L)
                .username("nguyenvana")
                .fullName("Nguyễn Văn A")
                .hasSetPreferences(true)
                .preferencesUpdatedAt(LocalDateTime.now())
                .totalSelected(3)
                .categories(List.of(
                        CategoryResponse.builder().id(1L).name("Tiểu thuyết").build(),
                        CategoryResponse.builder().id(2L).name("Kinh tế").build(),
                        CategoryResponse.builder().id(3L).name("Tâm lý").build()
                ))
                .build();

        when(userService.setFavoriteCategories(eq(1L), eq(request))).thenReturn(serviceResponse);

        ResponseEntity<ApiResponse<FavoriteCategoriesResponse>> responseEntity =
                userController.updateFavoriteCategories(1L, request);

        assertNotNull(responseEntity);
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        assertNotNull(responseEntity.getBody());
        assertTrue(responseEntity.getBody().isSuccess());
        assertEquals(3, responseEntity.getBody().getData().getTotalSelected());
        verify(userService, times(1)).setFavoriteCategories(1L, request);
    }

    @Test
    @DisplayName("API getFavoriteCategories lấy thông tin thành công")
    void testGetFavoriteCategories_Success() {
        FavoriteCategoriesResponse serviceResponse = FavoriteCategoriesResponse.builder()
                .userId(1L)
                .username("nguyenvana")
                .fullName("Nguyễn Văn A")
                .hasSetPreferences(true)
                .totalSelected(1)
                .categories(List.of(
                        CategoryResponse.builder().id(1L).name("Tiểu thuyết").build()
                ))
                .build();

        when(userService.getFavoriteCategories(1L)).thenReturn(serviceResponse);

        ResponseEntity<ApiResponse<FavoriteCategoriesResponse>> responseEntity =
                userController.getFavoriteCategories(1L);

        assertNotNull(responseEntity);
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        assertTrue(responseEntity.getBody().isSuccess());
        assertEquals(1, responseEntity.getBody().getData().getCategories().size());
        verify(userService, times(1)).getFavoriteCategories(1L);
    }

    @Test
    @DisplayName("API removeFavoriteCategory xóa 1 thể loại thành công")
    void testRemoveFavoriteCategory_Success() {
        FavoriteCategoriesResponse serviceResponse = FavoriteCategoriesResponse.builder()
                .userId(1L)
                .totalSelected(0)
                .categories(List.of())
                .build();

        when(userService.removeFavoriteCategory(1L, 2L)).thenReturn(serviceResponse);

        ResponseEntity<ApiResponse<FavoriteCategoriesResponse>> responseEntity =
                userController.removeFavoriteCategory(1L, 2L);

        assertNotNull(responseEntity);
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        verify(userService, times(1)).removeFavoriteCategory(1L, 2L);
    }
}
