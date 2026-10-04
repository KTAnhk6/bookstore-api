package com.bookstore.api;

import com.bookstore.api.dto.request.FavoriteCategoriesRequest;
import com.bookstore.api.dto.response.FavoriteCategoriesResponse;
import com.bookstore.api.entity.Category;
import com.bookstore.api.entity.User;
import com.bookstore.api.entity.UserFavoriteCategory;
import com.bookstore.api.exception.BadRequestException;
import com.bookstore.api.exception.ResourceNotFoundException;
import com.bookstore.api.repository.CategoryRepository;
import com.bookstore.api.repository.UserFavoriteCategoryRepository;
import com.bookstore.api.repository.UserRepository;
import com.bookstore.api.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private UserFavoriteCategoryRepository userFavoriteCategoryRepository;

    @InjectMocks
    private UserServiceImpl userService;

    private User sampleUser;
    private List<Category> sampleCategories;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .username("nguyenvana")
                .fullName("Nguyễn Văn A")
                .email("nguyenvana@gmail.com")
                .hasSetPreferences(false)
                .build();

        sampleCategories = List.of(
                Category.builder().id(1L).name("Tiểu thuyết").slug("tieu-thuyet").build(),
                Category.builder().id(2L).name("Kinh tế").slug("kinh-te").build(),
                Category.builder().id(3L).name("Tâm lý").slug("tam-ly").build(),
                Category.builder().id(4L).name("Khoa học").slug("khoa-hoc").build(),
                Category.builder().id(5L).name("Lịch sử").slug("lich-su").build(),
                Category.builder().id(6L).name("Thiếu nhi").slug("thieu-nhi").build()
        );
    }

    @Test
    @DisplayName("Lưu thành công danh sách tối đa 5 thể loại yêu thích")
    void testSetFavoriteCategories_Success() {
        FavoriteCategoriesRequest request = FavoriteCategoriesRequest.builder()
                .categoryIds(List.of(1L, 2L, 3L))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(categoryRepository.findAllById(anyCollection())).thenReturn(List.of(
                sampleCategories.get(0),
                sampleCategories.get(1),
                sampleCategories.get(2)
        ));

        FavoriteCategoriesResponse response = userService.setFavoriteCategories(1L, request);

        assertNotNull(response);
        assertEquals(1L, response.getUserId());
        assertEquals(3, response.getTotalSelected());
        assertEquals(3, response.getCategories().size());
        assertTrue(sampleUser.getHasSetPreferences());
        assertNotNull(sampleUser.getPreferencesUpdatedAt());

        verify(userFavoriteCategoryRepository, times(1)).deleteByUserId(1L);
        verify(userFavoriteCategoryRepository, times(1)).saveAll(any());
        verify(userRepository, times(1)).save(sampleUser);
    }

    @Test
    @DisplayName("Ném lỗi khi danh sách chọn vượt quá 5 thể loại")
    void testSetFavoriteCategories_ExceedsMaxLimit_ThrowsBadRequest() {
        FavoriteCategoriesRequest request = FavoriteCategoriesRequest.builder()
                .categoryIds(List.of(1L, 2L, 3L, 4L, 5L, 6L)) // 6 genres
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                userService.setFavoriteCategories(1L, request)
        );

        assertTrue(ex.getMessage().contains("tối đa 5 thể loại"));
        verify(userFavoriteCategoryRepository, never()).deleteByUserId(any());
        verify(userFavoriteCategoryRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("Ném lỗi khi thể loại không tồn tại trong hệ thống")
    void testSetFavoriteCategories_CategoryNotFound_ThrowsResourceNotFound() {
        FavoriteCategoriesRequest request = FavoriteCategoriesRequest.builder()
                .categoryIds(List.of(1L, 999L))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(categoryRepository.findAllById(anyCollection())).thenReturn(List.of(sampleCategories.get(0)));

        assertThrows(ResourceNotFoundException.class, () ->
                userService.setFavoriteCategories(1L, request)
        );
    }

    @Test
    @DisplayName("Thêm 1 thể loại khi đã có đủ 5 thể loại sẽ ném lỗi")
    void testAddFavoriteCategory_LimitReached_ThrowsBadRequest() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(categoryRepository.findById(6L)).thenReturn(Optional.of(sampleCategories.get(5)));
        when(userFavoriteCategoryRepository.existsByUserIdAndCategoryId(1L, 6L)).thenReturn(false);
        when(userFavoriteCategoryRepository.countByUserId(1L)).thenReturn(5L);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                userService.addFavoriteCategory(1L, 6L)
        );

        assertTrue(ex.getMessage().contains("giới hạn tối đa 5 thể loại"));
    }

    @Test
    @DisplayName("Lấy danh sách thể loại yêu thích của người dùng")
    void testGetFavoriteCategories_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(userFavoriteCategoryRepository.findByUserIdWithCategory(1L)).thenReturn(List.of(
                UserFavoriteCategory.builder().id(101L).user(sampleUser).category(sampleCategories.get(0)).build(),
                UserFavoriteCategory.builder().id(102L).user(sampleUser).category(sampleCategories.get(1)).build()
        ));

        FavoriteCategoriesResponse response = userService.getFavoriteCategories(1L);

        assertNotNull(response);
        assertEquals(2, response.getTotalSelected());
        assertEquals("Tiểu thuyết", response.getCategories().get(0).getName());
    }
}
