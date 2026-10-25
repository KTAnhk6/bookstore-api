package com.bookstore.api;

import com.bookstore.api.dto.response.BookDetailResponse;
import com.bookstore.api.dto.response.BookResponse;
import com.bookstore.api.entity.Author;
import com.bookstore.api.entity.Book;
import com.bookstore.api.entity.Category;
import com.bookstore.api.entity.Publisher;
import com.bookstore.api.repository.AuthorRepository;
import com.bookstore.api.repository.BookRepository;
import com.bookstore.api.repository.CategoryRepository;
import com.bookstore.api.repository.PublisherRepository;
import com.bookstore.api.service.impl.BookServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class BookServiceTest {

    @Mock
    private BookRepository bookRepository;

    @Mock
    private AuthorRepository authorRepository;

    @Mock
    private PublisherRepository publisherRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private BookServiceImpl bookService;

    private Book sampleBook;

    @BeforeEach
    void setUp() {
        Author author = Author.builder().id(1L).name("Nguyễn Nhật Ánh").slug("nguyen-nhat-anh").build();
        Publisher publisher = Publisher.builder().id(1L).name("NXB Trẻ").slug("nxb-tre").build();
        Category category = Category.builder().id(1L).name("Văn Học").slug("van-hoc").build();

        sampleBook = Book.builder()
                .id(1L)
                .title("Mắt Biếc")
                .slug("mat-biec")
                .isbn("9786041088765")
                .description("Mô tả truyện...")
                .originalPrice(new BigDecimal("110000"))
                .salePrice(new BigDecimal("88000"))
                .discountPercent(20)
                .stockQuantity(50)
                .soldQuantity(120)
                .author(author)
                .publisher(publisher)
                .categories(Set.of(category))
                .status(Book.Status.ACTIVE)
                .averageRating(4.8)
                .reviewCount(45)
                .build();
    }

    @Test
    @DisplayName("Tìm kiếm và lọc sách")
    void searchAndFilterBooks_Success() {
        Page<Book> bookPage = new PageImpl<>(List.of(sampleBook));
        when(bookRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(bookPage);

        Page<BookResponse> result = bookService.searchAndFilterBooks(
                "Mắt Biếc", null, null, null, null, null, null,
                null, null, null, true, null, "newest", PageRequest.of(0, 10)
        );

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Mắt Biếc", result.getContent().get(0).getTitle());
    }

    @Test
    @DisplayName("Xem chi tiết sách theo ID")
    void getBookById_Success() {
        when(bookRepository.findById(1L)).thenReturn(Optional.of(sampleBook));

        BookDetailResponse response = bookService.getBookById(1L);

        assertNotNull(response);
        assertEquals("Mắt Biếc", response.getTitle());
        assertEquals("Nguyễn Nhật Ánh", response.getAuthor().getName());
        assertEquals(new BigDecimal("88000"), response.getSalePrice());
    }
}
