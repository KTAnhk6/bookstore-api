package com.bookstore.api.service;

import com.bookstore.api.entity.Book;
import com.bookstore.api.repository.BookRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookService {

    @Autowired
    private BookRepository bookRepository;

    // Áp dụng @Transactional khi thêm/sửa sách
    // Đảm bảo nếu lưu Sách lỗi thì việc lưu quan hệ với Author/Category cũng bị hủy bỏ (Rollback)
    @Transactional
    public Book saveBook(Book book) {
        // Thực hiện lưu sách vào database
        // (Các quan hệ Many-to-Many với Author và Category sẽ được Hibernate tự động lưu kèm)
        return bookRepository.save(book);
    }
}