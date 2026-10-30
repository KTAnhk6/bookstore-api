package com.bookstore.api.repository;

import com.bookstore.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    long countByRole(User.Role role);

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByUsernameOrEmail(String username, String email);

    Boolean existsByUsername(String username);

    Boolean existsByEmail(String email);

    // Khóa dòng user để 2 request tạo phiên thanh toán cùng lúc không tạo ra 2 phiên
    // Native "FOR UPDATE": @Lock sinh "FOR UPDATE OF" mà MariaDB (XAMPP) báo lỗi cú pháp
    @Query(value = "SELECT * FROM users WHERE id = :id FOR UPDATE", nativeQuery = true)
    Optional<User> lockById(@Param("id") Long id);
}
