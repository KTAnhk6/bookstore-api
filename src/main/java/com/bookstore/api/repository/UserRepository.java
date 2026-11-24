package com.bookstore.api.repository;

import com.bookstore.api.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    Boolean existsByPhone(String phone);

    /** Danh sách cho admin: lọc theo từ khoá (tài khoản / họ tên / email / SĐT), quyền, trạng thái. */
    @Query("SELECT u FROM User u WHERE " +
            "(:keyword IS NULL OR LOWER(u.username) LIKE :keyword OR LOWER(u.fullName) LIKE :keyword " +
            "OR LOWER(u.email) LIKE :keyword OR u.phone LIKE :keyword) " +
            "AND (:role IS NULL OR u.role = :role) " +
            "AND (:status IS NULL OR u.status = :status)")
    Page<User> searchForAdmin(@Param("keyword") String keyword, @Param("role") User.Role role,
                              @Param("status") User.Status status, Pageable pageable);

    // Khóa dòng user để 2 request tạo phiên thanh toán cùng lúc không tạo ra 2 phiên
    // Native "FOR UPDATE": @Lock sinh "FOR UPDATE OF" mà MariaDB (XAMPP) báo lỗi cú pháp
    @Query(value = "SELECT * FROM users WHERE id = :id FOR UPDATE", nativeQuery = true)
    Optional<User> lockById(@Param("id") Long id);
}
