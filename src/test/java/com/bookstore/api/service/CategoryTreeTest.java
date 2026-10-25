package com.bookstore.api.service;

import com.bookstore.api.dto.request.CategoryRequest;
import com.bookstore.api.dto.response.CategoryResponse;
import com.bookstore.api.entity.Category;
import com.bookstore.api.exception.BadRequestException;
import com.bookstore.api.repository.CategoryRepository;
import com.bookstore.api.service.impl.CategoryServiceImpl;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryTreeTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryServiceImpl categoryService;

    @Test
    @DisplayName("Dựng cây thể loại phân cấp đúng quan hệ cha con")
    void testGetCategoryTree() {
        Category rootCat = Category.builder().id(1L).name("Văn Học").slug("van-hoc").displayOrder(1).active(true).build();
        Category childCat = Category.builder().id(2L).name("Tiểu Thuyết").slug("tieu-thuyet").parent(rootCat).displayOrder(1).active(true).build();

        when(categoryRepository.findByActiveTrueOrderByDisplayOrderAsc()).thenReturn(List.of(rootCat, childCat));

        List<CategoryResponse> tree = categoryService.getCategoryTree();

        assertNotNull(tree);
        assertEquals(1, tree.size(), "Chỉ có 1 nhánh gốc");
        assertEquals("Văn Học", tree.get(0).getName());
        assertEquals(1, tree.get(0).getChildren().size(), "Nhánh gốc có 1 nhánh con");
        assertEquals("Tiểu Thuyết", tree.get(0).getChildren().get(0).getName());
    }

    @Test
    @DisplayName("Tạo nhánh con liên kết đúng với thể loại cha")
    void testCreateSubCategory() {
        Category parentCat = Category.builder().id(10L).name("Kinh Tế").slug("kinh-te").build();
        when(categoryRepository.findById(10L)).thenReturn(Optional.of(parentCat));
        when(categoryRepository.existsBySlug(any())).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> {
            Category c = invocation.getArgument(0);
            c.setId(11L);
            return c;
        });

        CategoryRequest req = CategoryRequest.builder()
                .name("Marketing")
                .parentId(10L)
                .build();

        CategoryResponse resp = categoryService.createCategory(req);

        assertNotNull(resp);
        assertEquals("Marketing", resp.getName());
        assertEquals(10L, resp.getParentId());
        assertEquals("Kinh Tế", resp.getParentName());
    }

    @Test
    @DisplayName("Không cho phép thể loại làm cha của chính nó")
    void testUpdateCategorySelfParentValidation() {
        Category cat = Category.builder().id(5L).name("Tâm Lý").build();
        when(categoryRepository.findById(5L)).thenReturn(Optional.of(cat));

        CategoryRequest req = CategoryRequest.builder()
                .name("Tâm Lý")
                .parentId(5L)
                .build();

        assertThrows(BadRequestException.class, () -> categoryService.updateCategory(5L, req));
    }
}
