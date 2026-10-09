-- =============================================
-- DATABASE: bookstore
-- DBMS: MySQL 8
-- =============================================
DROP DATABASE IF EXISTS bookstore;
CREATE DATABASE bookstore
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE bookstore;

-- =============================================
-- PHẦN 1: SCHEMA (18 bảng)
-- =============================================

-- 1. USERS
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    avatar VARCHAR(255),
    gender ENUM('male','female','other'),
    birthday DATE,
    role ENUM('customer','staff','admin') NOT NULL DEFAULT 'customer',
    loyalty_points INT NOT NULL DEFAULT 0,
    has_set_preferences BOOLEAN NOT NULL DEFAULT FALSE,
    preferences_updated_at DATETIME,
    status ENUM('active','inactive','banned') NOT NULL DEFAULT 'active',
    last_login_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    INDEX idx_users_role (role),
    INDEX idx_users_status (status)
) ENGINE=InnoDB;

-- 2. ADDRESSES
CREATE TABLE addresses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    receiver_name VARCHAR(100) NOT NULL,
    receiver_phone VARCHAR(20) NOT NULL,
    province VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    ward VARCHAR(100) NOT NULL,
    detail VARCHAR(255) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_addresses_user (user_id),
    INDEX idx_addresses_default (user_id, is_default)
) ENGINE=InnoDB;

-- 3. CATEGORIES
CREATE TABLE categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    parent_id BIGINT,
    description TEXT,
    image VARCHAR(255),
    sort_order INT NOT NULL DEFAULT 0,
    status ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_categories_parent (parent_id),
    INDEX idx_categories_status (status)
) ENGINE=InnoDB;

-- 4. AUTHORS
CREATE TABLE authors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    bio TEXT,
    avatar VARCHAR(255),
    nationality VARCHAR(50),
    birth_year INT,
    death_year INT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_authors_name (name)
) ENGINE=InnoDB;

-- 5. PUBLISHERS
CREATE TABLE publishers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(170) NOT NULL UNIQUE,
    address VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(150),
    logo VARCHAR(255),
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_publishers_name (name)
) ENGINE=InnoDB;

-- 6. BOOKS
CREATE TABLE books (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(280) NOT NULL UNIQUE,
    isbn VARCHAR(20) UNIQUE,
    description TEXT,
    cover_image VARCHAR(255),
    publisher_id BIGINT,
    publish_year INT,
    page_count INT,
    language VARCHAR(50) DEFAULT 'vi',
    dimensions VARCHAR(50),
    weight INT,
    price DECIMAL(12,2) NOT NULL,
    sale_price DECIMAL(12,2),
    stock_quantity INT NOT NULL DEFAULT 0,
    sold_quantity INT NOT NULL DEFAULT 0,
    status ENUM('available','out_of_stock','discontinued') NOT NULL DEFAULT 'available',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    CONSTRAINT fk_books_publisher FOREIGN KEY (publisher_id) REFERENCES publishers(id) ON DELETE SET NULL,
    INDEX idx_books_publisher (publisher_id),
    INDEX idx_books_status (status),
    INDEX idx_books_price (price)
) ENGINE=InnoDB;

-- 7. BOOK_CATEGORIES
CREATE TABLE book_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    book_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_bc_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    CONSTRAINT fk_bc_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE KEY uk_book_category (book_id, category_id),
    INDEX idx_bc_book (book_id),
    INDEX idx_bc_category (category_id)
) ENGINE=InnoDB;

-- 8. BOOK_AUTHORS
CREATE TABLE book_authors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    book_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    role ENUM('author','co_author','translator','editor') NOT NULL DEFAULT 'author',
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ba_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    CONSTRAINT fk_ba_author FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE,
    UNIQUE KEY uk_book_author (book_id, author_id),
    INDEX idx_ba_book (book_id),
    INDEX idx_ba_author (author_id)
) ENGINE=InnoDB;

-- 9. CARTS
CREATE TABLE carts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_carts_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    UNIQUE KEY uk_cart_user_book (user_id, book_id),
    INDEX idx_carts_user (user_id)
) ENGINE=InnoDB;

-- 10. COUPONS
CREATE TABLE coupons (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150),
    description TEXT,
    discount_type ENUM('percent','fixed') NOT NULL,
    discount_value DECIMAL(12,2) NOT NULL,
    max_discount DECIMAL(12,2),
    min_order_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    usage_limit INT,
    used_count INT NOT NULL DEFAULT 0,
    per_user_limit INT NOT NULL DEFAULT 1,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    status ENUM('active','inactive','expired') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_coupons_status (status),
    INDEX idx_coupons_date (start_date, end_date)
) ENGINE=InnoDB;

-- 11. ORDERS
CREATE TABLE orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_code VARCHAR(30) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    address_id BIGINT,
    shipping_address VARCHAR(500),
    subtotal DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    coupon_id BIGINT,
    shipping_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    payment_method ENUM('cod','banking','momo','vnpay','stripe') NOT NULL,
    payment_status ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
    order_status ENUM('pending','confirmed','shipping','delivered','cancelled','returned') NOT NULL DEFAULT 'pending',
    note TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_orders_address FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE SET NULL,
    CONSTRAINT fk_orders_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL,
    INDEX idx_orders_user (user_id),
    INDEX idx_orders_status (order_status),
    INDEX idx_orders_payment (payment_status),
    INDEX idx_orders_created (created_at)
) ENGINE=InnoDB;

-- 12. ORDER_ITEMS
CREATE TABLE order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_oi_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE RESTRICT,
    INDEX idx_oi_order (order_id),
    INDEX idx_oi_book (book_id)
) ENGINE=InnoDB;

-- 13. PAYMENTS
CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    method ENUM('cod','banking','momo','vnpay','stripe') NOT NULL,
    qr_data TEXT,
    qr_code_url VARCHAR(500),
    qr_expired_at DATETIME,
    bank_code VARCHAR(20),
    account_number VARCHAR(50),
    amount DECIMAL(12,2) NOT NULL,
    transaction_code VARCHAR(100),
    status ENUM('pending','success','failed','refunded') NOT NULL DEFAULT 'pending',
    paid_at DATETIME,
    note VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_payments_order (order_id),
    INDEX idx_payments_status (status),
    INDEX idx_payments_txn (transaction_code),
    INDEX idx_payments_qr_expired (qr_expired_at)
) ENGINE=InnoDB;

-- 14. REVIEWS
CREATE TABLE reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    book_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    order_id BIGINT,
    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_reviews_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    UNIQUE KEY uk_review_book_user_order (book_id, user_id, order_id),
    INDEX idx_reviews_book (book_id),
    INDEX idx_reviews_user (user_id),
    INDEX idx_reviews_status (status)
) ENGINE=InnoDB;

-- 15. USER_FAVORITE_CATEGORIES
CREATE TABLE user_favorite_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ufc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ufc_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_category (user_id, category_id),
    INDEX idx_ufc_user (user_id),
    INDEX idx_ufc_category (category_id)
) ENGINE=InnoDB;

-- 16. REFRESH_TOKENS
CREATE TABLE refresh_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    device_info VARCHAR(255),
    ip_address VARCHAR(45),
    expired_at DATETIME NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_rt_user (user_id),
    INDEX idx_rt_token (token),
    INDEX idx_rt_expired (expired_at)
) ENGINE=InnoDB;

-- 17. PASSWORD_RESET_TOKENS
CREATE TABLE password_reset_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expired_at DATETIME NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_prt_user (user_id),
    INDEX idx_prt_token (token)
) ENGINE=InnoDB;

-- 18. SEARCH_HISTORY
CREATE TABLE search_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    keyword VARCHAR(255) NOT NULL,
    result_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_sh_user (user_id),
    INDEX idx_sh_keyword (keyword),
    INDEX idx_sh_created (created_at)
) ENGINE=InnoDB;

-- =============================================
-- PHẦN 2: DATA
-- =============================================

-- 1. USERS
INSERT INTO users (id, username, password_hash, email, phone, full_name, avatar, gender, birthday, role, loyalty_points, has_set_preferences, preferences_updated_at, status, last_login_at, created_at, updated_at, deleted_at)
VALUES
(1, 'admin', '$2a$10$zt6dUMTjNSyzINTGyiAgluna3mPm7qdgl26vj4tFpsFO6WlK5lXNm', 'admin@bookstore.vn', '0901000001', 'Nguyễn Minh Anh', NULL, 'female', '1998-03-12', 'admin', 2500, 1, '2026-09-28 10:15:00', 'active', '2026-10-03 08:20:00', '2026-09-01 09:00:00', '2026-10-03 08:20:00', NULL),
(2, 'staff01', '$2a$10$zt6dUMTjNSyzINTGyiAgluna3mPm7qdgl26vj4tFpsFO6WlK5lXNm', 'staff01@bookstore.vn', '0901000002', 'Trần Quốc Huy', NULL, 'male', '1997-07-21', 'staff', 800, 1, '2026-09-29 14:20:00', 'active', '2026-10-03 08:05:00', '2026-09-01 09:05:00', '2026-10-03 08:05:00', NULL),
(3, 'staff02', '$2a$10$zt6dUMTjNSyzINTGyiAgluna3mPm7qdgl26vj4tFpsFO6WlK5lXNm', 'staff02@bookstore.vn', '0901000003', 'Lê Thu Trang', NULL, 'female', '1999-11-05', 'staff', 650, 1, '2026-09-30 16:10:00', 'active', '2026-10-02 17:40:00', '2026-09-01 09:10:00', '2026-10-02 17:40:00', NULL),
(4, 'user01', '$2a$10$zt6dUMTjNSyzINTGyiAgluna3mPm7qdgl26vj4tFpsFO6WlK5lXNm', 'user01@gmail.com', '0912000004', 'Phạm Ngọc Mai', NULL, 'female', '2001-04-18', 'customer', 320, 1, '2026-09-27 20:10:00', 'active', '2026-10-02 21:30:00', '2026-09-02 10:00:00', '2026-10-02 21:30:00', NULL),
(5, 'user02', '$2a$10$zt6dUMTjNSyzINTGyiAgluna3mPm7qdgl26vj4tFpsFO6WlK5lXNm', 'user02@gmail.com', '0912000005', 'Đỗ Hoàng Nam', NULL, 'male', '2000-12-09', 'customer', 180, 1, '2026-09-26 18:00:00', 'active', '2026-10-01 19:25:00', '2026-09-02 10:10:00', '2026-10-01 19:25:00', NULL),
(6, 'user03', '$2a$10$zt6dUMTjNSyzINTGyiAgluna3mPm7qdgl26vj4tFpsFO6WlK5lXNm', 'user03@gmail.com', '0912000006', 'Lý Thanh Tùng', NULL, 'male', '2002-08-15', 'customer', 0, 0, NULL, 'active', NULL, '2026-10-03 08:00:00', '2026-10-03 08:00:00', NULL);

-- 2. ADDRESSES
INSERT INTO addresses (id, user_id, receiver_name, receiver_phone, province, district, ward, detail, is_default, created_at, updated_at)
VALUES
(1, 4, 'Phạm Ngọc Mai', '0912000004', 'Hà Nội', 'Cầu Giấy', 'Dịch Vọng', '12 Trần Thái Tông', 1, '2026-09-03 10:00:00', '2026-09-03 10:00:00'),
(2, 4, 'Phạm Ngọc Mai', '0912000004', 'Hà Nội', 'Nam Từ Liêm', 'Mỹ Đình 2', '35 Nguyễn Cơ Thạch', 0, '2026-09-04 11:00:00', '2026-09-04 11:00:00'),
(3, 5, 'Đỗ Hoàng Nam', '0912000005', 'Hà Nội', 'Đống Đa', 'Láng Thượng', '88 Chùa Láng', 1, '2026-09-05 09:30:00', '2026-09-05 09:30:00'),
(4, 5, 'Đỗ Hoàng Nam', '0912000005', 'Hà Nội', 'Ba Đình', 'Ngọc Khánh', '21 Nguyễn Công Hoan', 0, '2026-09-06 14:20:00', '2026-09-06 14:20:00'),
(5, 4, 'Phạm Ngọc Mai', '0912000004', 'Hải Phòng', 'Lê Chân', 'Vĩnh Niệm', '15 Hồ Sen', 0, '2026-09-07 15:00:00', '2026-09-07 15:00:00');

-- 3. CATEGORIES (20 nhóm)
INSERT INTO categories (id, name, slug, description, image, sort_order, status, created_at, updated_at)
VALUES
(1, 'Văn học Việt Nam', 'van-hoc-viet-nam', 'Nhóm sách văn học việt nam', NULL, 1, 'active', '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(2, 'Văn học nước ngoài', 'van-hoc-nuoc-ngoai', 'Nhóm sách văn học nước ngoài', NULL, 2, 'active', '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(3, 'Tiểu thuyết', 'tieu-thuyet', 'Nhóm sách tiểu thuyết', NULL, 3, 'active', '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(4, 'Trinh thám', 'trinh-tham', 'Nhóm sách trinh thám', NULL, 4, 'active', '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(5, 'Kinh dị', 'kinh-di', 'Nhóm sách kinh dị', NULL, 5, 'active', '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(6, 'Ngôn tình', 'ngon-tinh', 'Nhóm sách ngôn tình', NULL, 6, 'active', '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(7, 'Tâm lý - Kỹ năng sống', 'tam-ly-ky-nang-song', 'Nhóm sách tâm lý - kỹ năng sống', NULL, 7, 'active', '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(8, 'Kinh doanh', 'kinh-doanh', 'Nhóm sách kinh doanh', NULL, 8, 'active', '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(9, 'Marketing', 'marketing', 'Nhóm sách marketing', NULL, 9, 'active', '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(10, 'Tài chính', 'tai-chinh', 'Nhóm sách tài chính', NULL, 10, 'active', '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(11, 'Công nghệ thông tin', 'cong-nghe-thong-tin', 'Nhóm sách công nghệ thông tin', NULL, 11, 'active', '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(12, 'Lập trình', 'lap-trinh', 'Nhóm sách lập trình', NULL, 12, 'active', '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(13, 'Khoa học', 'khoa-hoc', 'Nhóm sách khoa học', NULL, 13, 'active', '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(14, 'Lịch sử', 'lich-su', 'Nhóm sách lịch sử', NULL, 14, 'active', '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(15, 'Địa lý', 'dia-ly', 'Nhóm sách địa lý', NULL, 15, 'active', '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(16, 'Thiếu nhi', 'thieu-nhi', 'Nhóm sách thiếu nhi', NULL, 16, 'active', '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(17, 'Truyện tranh', 'truyen-tranh', 'Nhóm sách truyện tranh', NULL, 17, 'active', '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(18, 'Ngoại ngữ', 'ngoai-ngu', 'Nhóm sách ngoại ngữ', NULL, 18, 'active', '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(19, 'Giáo dục', 'giao-duc', 'Nhóm sách giáo dục', NULL, 19, 'active', '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(20, 'Phát triển bản thân', 'phat-trien-ban-than', 'Nhóm sách phát triển bản thân', NULL, 20, 'active', '2026-09-01 09:00:00', '2026-09-01 09:00:00');

-- 4. AUTHORS (Tác giả thực tế tương ứng với 100 tác phẩm)
INSERT INTO authors (id, name, slug, bio, avatar, nationality, birth_year, death_year, created_at, updated_at)
VALUES
(1, 'F. Scott Fitzgerald', 'f-scott-fitzgerald', 'Đại văn hào người Mỹ, tác giả The Great Gatsby.', NULL, 'Mỹ', 1896, 1940, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(2, 'Jane Austen', 'jane-austen', 'Nhà văn hiện thực lãng mạn kinh điển nước Anh.', NULL, 'Anh', 1775, 1817, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(3, 'Miguel de Cervantes', 'miguel-de-cervantes', 'Đại văn hào Tây Ban Nha, tác giả Don Quixote.', NULL, 'Tây Ban Nha', 1547, 1616, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(4, 'Lewis Carroll', 'lewis-carroll', 'Nhà văn, nhà toán học người Anh.', NULL, 'Anh', 1832, 1898, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(5, 'Bram Stoker', 'bram-stoker', 'Tác giả tiểu thuyết kinh dị Dracula.', NULL, 'Ireland', 1847, 1912, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(6, 'Herman Melville', 'herman-melville', 'Tiểu thuyết gia người Mỹ, tác giả Moby-Dick.', NULL, 'Mỹ', 1819, 1891, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(7, 'Mary Shelley', 'mary-shelley', 'Tác giả tác phẩm kinh điển Frankenstein.', NULL, 'Anh', 1797, 1851, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(8, 'Charles Dickens', 'charles-dickens', 'Đại văn hào nước Anh thời Victoria.', NULL, 'Anh', 1812, 1870, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(9, 'Charlotte Brontë', 'charlotte-bronte', 'Nhà văn nữ nổi tiếng nước Anh, tác giả Jane Eyre.', NULL, 'Anh', 1816, 1855, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(10, 'Emily Brontë', 'emily-bronte', 'Tác giả cuốn tiểu thuyết kinh điển Wuthering Heights.', NULL, 'Anh', 1818, 1848, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(11, 'Oscar Wilde', 'oscar-wilde', 'Nhà viết kịch và tiểu thuyết gia người Ireland.', NULL, 'Ireland', 1854, 1900, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(12, 'H. G. Wells', 'h-g-wells', 'Bậc thầy khoa học viễn tưởng nước Anh.', NULL, 'Anh', 1866, 1946, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(13, 'Mark Twain', 'mark-twain', 'Đại văn hào hiện thực trào phúng người Mỹ.', NULL, 'Mỹ', 1835, 1910, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(14, 'Rudyard Kipling', 'rudyard-kipling', 'Nhà văn người Anh đoạt giải Nobel Văn học.', NULL, 'Anh', 1865, 1936, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(15, 'Kenneth Grahame', 'kenneth-grahame', 'Nhà văn thiếu nhi người Scotland.', NULL, 'Anh', 1859, 1932, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(16, 'J. M. Barrie', 'j-m-barrie', 'Nhà viết kịch người Scotland sáng tạo nên Peter Pan.', NULL, 'Anh', 1860, 1937, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(17, 'Jonathan Swift', 'jonathan-swift', 'Nhà văn trào phúng người Ireland, tác giả Gulliver Du ký.', NULL, 'Ireland', 1667, 1745, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(18, 'Brothers Grimm', 'brothers-grimm', 'Hai anh em Jacob và Wilhelm Grimm sưu tầm truyện cổ tích.', NULL, 'Đức', 1785, 1863, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(19, 'Victor Hugo', 'victor-hugo', 'Đại văn hào Pháp theo chủ nghĩa lãng mạn.', NULL, 'Pháp', 1802, 1885, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(20, 'Leo Tolstoy', 'leo-tolstoy', 'Đại văn hào vĩ đại người Nga.', NULL, 'Nga', 1828, 1910, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(21, 'Fyodor Dostoevsky', 'fyodor-dostoevsky', 'Tiểu thuyết gia vĩ đại bậc thầy phân tích tâm lý người Nga.', NULL, 'Nga', 1821, 1881, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(22, 'Gustave Flaubert', 'gustave-flaubert', 'Tiểu thuyết gia hàng đầu của văn học Pháp.', NULL, 'Pháp', 1821, 1880, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(23, 'Walt Whitman', 'walt-whitman', 'Thi hào kiệt xuất của nước Mỹ thế kỷ 19.', NULL, 'Mỹ', 1819, 1892, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(24, 'Homer', 'homer', 'Đại thi hào Hy Lạp cổ đại sáng tác sử thi.', NULL, 'Hy Lạp', -800, -750, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(25, 'Dante Alighieri', 'dante-alighieri', 'Thi hào kiệt xuất thời Trung cổ người Ý.', NULL, 'Ý', 1265, 1321, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(26, 'John Milton', 'john-milton', 'Thi hào kinh điển nước Anh thế kỷ 17.', NULL, 'Anh', 1608, 1674, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(27, 'Geoffrey Chaucer', 'geoffrey-chaucer', 'Cha đẻ của thi ca tiếng Anh.', NULL, 'Anh', 1343, 1400, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(28, 'William Shakespeare', 'william-shakespeare', 'Nhà soạn kịch và thi hào vĩ đại nhất lịch sử nước Anh.', NULL, 'Anh', 1564, 1616, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(29, 'Robert Louis Stevenson', 'robert-louis-stevenson', 'Nhà văn Scotland sáng tạo nên Đảo giấu vàng.', NULL, 'Anh', 1850, 1894, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(30, 'Daniel Defoe', 'daniel-defoe', 'Tiểu thuyết gia người Anh, tác giả Robinson Crusoe.', NULL, 'Anh', 1660, 1731, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(31, 'Henry Fielding', 'henry-fielding', 'Tiểu thuyết gia và kịch tác gia người Anh.', NULL, 'Anh', 1707, 1754, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(32, 'John Bunyan', 'john-bunyan', 'Nhà văn và nhà thuyết giáo người Anh.', NULL, 'Anh', 1628, 1688, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(33, 'Vũ Trọng Phụng', 'vu-trong-phung', 'Nhà văn hiện thực phê phán xuất sắc của Việt Nam.', NULL, 'Việt Nam', 1912, 1939, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(34, 'Nguyễn Tuân', 'nguyen-tuan', 'Bậc thầy nghệ thuật ngôn từ và tùy bút Việt Nam.', NULL, 'Việt Nam', 1910, 1987, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(35, 'Nguyễn Nhật Ánh', 'nguyen-nhat-anh', 'Nhà văn thiếu nhi và tuổi mới lớn được yêu thích nhất Việt Nam.', NULL, 'Việt Nam', 1955, NULL, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(36, 'Đặng Thùy Trâm', 'dang-thuy-tram', 'Liệt sĩ, bác sĩ, tác giả nhật ký thời chiến.', NULL, 'Việt Nam', 1942, 1970, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(37, 'Nguyễn Văn Thạc', 'nguyen-van-thac', 'Liệt sĩ, tác giả Mãi mãi tuổi hai mươi.', NULL, 'Việt Nam', 1952, 1972, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(38, 'Dale Carnegie', 'dale-carnegie', 'Chuyên gia phát triển bản thân và diễn thuyết người Mỹ.', NULL, 'Mỹ', 1888, 1955, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(39, 'Paulo Coelho', 'paulo-coelho', 'Nhà văn người Brasil, tác giả Nhà giả kim.', NULL, 'Brasil', 1947, NULL, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(40, 'Haruki Murakami', 'haruki-murakami', 'Tiểu thuyết gia đương đại hàng đầu Nhật Bản.', NULL, 'Nhật Bản', 1949, NULL, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(41, 'Jared Diamond', 'jared-diamond', 'Nhà khoa học địa lý, sinh học và tác giả người Mỹ.', NULL, 'Mỹ', 1937, NULL, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(42, 'Milan Kundera', 'milan-kundera', 'Nhà văn hiện đại Pháp gốc Tiệp Khắc.', NULL, 'Pháp', 1929, 2023, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(43, 'Enid Blyton', 'enid-blyton', 'Nhà văn thiếu nhi kinh điển người Anh.', NULL, 'Anh', 1897, 1968, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(44, 'Aleksandr Grin', 'aleksandr-grin', 'Nhà văn lãng mạn người Nga.', NULL, 'Nga', 1880, 1932, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(45, 'Mizuki Tsujimura', 'mizuki-tsujimura', 'Tiểu thuyết gia người Nhật đoạt giải Naoki.', NULL, 'Nhật Bản', 1980, NULL, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(46, 'Lưu Liễm Tử', 'luu-liem-tu', 'Nhà văn cung đấu người Trung Quốc.', NULL, 'Trung Quốc', 1984, NULL, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(47, 'Louisa May Alcott', 'louisa-may-alcott', 'Tiểu thuyết gia người Mỹ, tác giả Little Women.', NULL, 'Mỹ', 1832, 1888, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(48, 'David Grann', 'david-grann', 'Nhà báo và tác giả phi hư cấu người Mỹ.', NULL, 'Mỹ', 1967, NULL, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(49, 'Nguyễn Văn Quỳ', 'nguyen-van-quy', 'Nhạc sĩ nổi tiếng của âm nhạc Việt Nam.', NULL, 'Việt Nam', 1925, 2022, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(50, 'Negi Haruba', 'negi-haruba', 'Mangaka Nhật Bản, tác giả Gotoubun no Hanayome.', NULL, 'Nhật Bản', 1991, NULL, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(51, 'Kouji Seo', 'kouji-seo', 'Mangaka chuyên thể loại lãng mạn Nhật Bản.', NULL, 'Nhật Bản', 1974, NULL, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(52, 'Shinobu Amano', 'shinobu-amano', 'Mangaka shoujo Nhật Bản, tác giả Last Game.', NULL, 'Nhật Bản', 1980, NULL, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(53, 'Tatsuya Endo', 'tatsuya-endo', 'Mangaka Nhật Bản, tác giả Spy x Family.', NULL, 'Nhật Bản', 1980, NULL, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(54, 'Yukinobu Tatsu', 'yukinobu-tatsu', 'Mangaka Nhật Bản, tác giả Dandadan.', NULL, 'Nhật Bản', 1984, NULL, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(55, 'Yuto Suzuki', 'yuto-suzuki', 'Mangaka Nhật Bản, tác giả Sakamoto Days.', NULL, 'Nhật Bản', 1993, NULL, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(56, 'Carolyn Keene', 'carolyn-keene', 'Bút danh tập thể dòng truyện trinh thám Nancy Drew.', NULL, 'Mỹ', 1930, NULL, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(57, 'Nguyễn Đình Chiểu', 'nguyen-dinh-chieu', 'Đại danh nhân văn hóa, nhà thơ yêu nước Việt Nam.', NULL, 'Việt Nam', 1822, 1888, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(58, 'Trịnh Văn Căn', 'trinh-van-can', 'Hồng y Công giáo dịch giả bản Kinh Thánh tiếng Việt.', NULL, 'Việt Nam', 1921, 1990, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(59, 'Phùng Quán', 'phung-quan', 'Nhà văn Việt Nam, tác giả Tuổi thơ dữ dội.', NULL, 'Việt Nam', 1932, 1995, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(60, 'Xuân Diệu', 'xuan-dieu', 'Ông hoàng thơ tình Việt Nam trong phong trào Thơ mới.', NULL, 'Việt Nam', 1916, 1985, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(61, 'Charles Darwin', 'charles-darwin', 'Nhà tự nhiên học người Anh đặt nền móng thuyết tiến hóa.', NULL, 'Anh', 1809, 1882, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(62, 'John Stuart Mill', 'john-stuart-mill', 'Triết gia và nhà kinh tế chính trị học người Anh.', NULL, 'Anh', 1806, 1873, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(63, 'Adam Smith', 'adam-smith', 'Nhà kinh tế học và triết gia Scotland, cha đẻ kinh tế hiện đại.', NULL, 'Anh', 1723, 1790, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(64, 'Immanuel Kant', 'immanuel-kant', 'Triết gia người Đức thời Khai sáng.', NULL, 'Đức', 1724, 1804, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(65, 'Karl Marx', 'karl-marx', 'Nhà triết học, nhà kinh tế chính trị học vĩ đại người Đức.', NULL, 'Đức', 1818, 1883, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(66, 'Friedrich Engels', 'friedrich-engels', 'Nhà triết học người Đức, đồng tác giả Tuyên ngôn Đảng Cộng sản.', NULL, 'Đức', 1820, 1895, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(67, 'Thomas Hobbes', 'thomas-hobbes', 'Triết gia chính trị kinh điển người Anh.', NULL, 'Anh', 1588, 1679, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(68, 'J. D. Salinger', 'j-d-salinger', 'Nhà văn người Mỹ, tác giả Bắt trẻ đồng xanh.', NULL, 'Mỹ', 1919, 2010, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(69, 'Khuyết Danh Cổ Đại', 'khuyet-danh-co-dai', 'Tác giả dân gian / văn bản cổ chưa rõ danh tính cụ thể.', NULL, 'Quốc tế', NULL, NULL, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(70, 'Johannes Gutenberg', 'johannes-gutenberg', 'Nhà phát minh máy in ép kim loại di động phương Tây.', NULL, 'Đức', 1400, 1468, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(71, 'George Orwell', 'george-orwell', 'Nhà văn tiểu thuyết viễn tưởng cảnh báo xã hội người Anh.', NULL, 'Anh', 1903, 1950, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(72, 'Harriet Beecher Stowe', 'harriet-beecher-stowe', 'Nhà văn người Mỹ chống chế độ nô lệ, tác giả Túp lều bác Tom.', NULL, 'Mỹ', 1811, 1896, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(73, 'Aldous Huxley', 'aldous-huxley', 'Nhà văn triết học người Anh, tác giả Brave New World.', NULL, 'Anh', 1894, 1963, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(74, 'Voltaire', 'voltaire', 'Đại văn hào và triết gia Pháp thời Khai sáng.', NULL, 'Pháp', 1694, 1778, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(75, 'Thomas More', 'thomas-more', 'Nhà tư tưởng nhân văn nước Anh thời Phục hưng.', NULL, 'Anh', 1478, 1535, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(76, 'Isaac Newton', 'isaac-newton', 'Nhà vật lý, toán học và thiên văn học kiệt xuất nước Anh.', NULL, 'Anh', 1643, 1727, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(77, 'Sigmund Freud', 'sigmund-freud', 'Bác sĩ thần kinh người Áo, cha đẻ ngành phân tâm học.', NULL, 'Áo', 1856, 1939, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(78, 'Denis Diderot', 'denis-diderot', 'Triết gia và chủ biên bộ Bách khoa toàn thư Pháp.', NULL, 'Pháp', 1713, 1784, '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(79, 'Thomas Jefferson', 'thomas-jefferson', 'Tác giả chính của Tuyên ngôn Độc lập Hoa Kỳ.', NULL, 'Mỹ', 1743, 1826, '2026-09-01 09:00:00', '2026-09-01 09:00:00');

-- 5. PUBLISHERS (10 Nhà xuất bản)
INSERT INTO publishers (id, name, slug, address, phone, email, website, logo, description, created_at, updated_at)
VALUES
(1, 'NXB Trẻ', 'nxb-tre', '10 Nguyễn Văn Cừ, Hà Nội', '0243000001', 'contact1@nxb.vn', 'https://nxbtre.com.vn', NULL, 'Nhà xuất bản Trẻ.', '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(2, 'NXB Kim Đồng', 'nxb-kim-dong', '20 Nguyễn Văn Cừ, Hà Nội', '0243000002', 'contact2@nxb.vn', 'https://nxbkimdong.com.vn', NULL, 'Nhà xuất bản Kim Đồng.', '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(3, 'NXB Phụ Nữ Việt Nam', 'nxb-phu-nu-viet-nam', '30 Nguyễn Văn Cừ, Hà Nội', '0243000003', 'contact3@nxb.vn', 'https://nxbphunu.com.vn', NULL, 'Nhà xuất bản Phụ Nữ Việt Nam.', '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(4, 'NXB Văn Học', 'nxb-van-hoc', '40 Nguyễn Văn Cừ, Hà Nội', '0243000004', 'contact4@nxb.vn', 'https://nxbvanhoc.com.vn', NULL, 'Nhà xuất bản Văn Học.', '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(5, 'NXB Lao Động', 'nxb-lao-dong', '50 Nguyễn Văn Cừ, Hà Nội', '0243000005', 'contact5@nxb.vn', 'https://nxblaodong.com.vn', NULL, 'Nhà xuất bản Lao Động.', '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(6, 'NXB Thế Giới', 'nxb-the-gioi', '60 Nguyễn Văn Cừ, Hà Nội', '0243000006', 'contact6@nxb.vn', 'https://nthegioi.com.vn', NULL, 'Nhà xuất bản Thế Giới.', '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(7, 'NXB Giáo Dục Việt Nam', 'nxb-giao-duc-viet-nam', '70 Nguyễn Văn Cừ, Hà Nội', '0243000007', 'contact7@nxb.vn', 'https://nxbgiaoduc.vn', NULL, 'Nhà xuất bản Giáo Dục Việt Nam.', '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(8, 'NXB Thanh Niên', 'nxb-thanh-nien', '80 Nguyễn Văn Cừ, Hà Nội', '0243000008', 'contact8@nxb.vn', 'https://nxbthanhnien.vn', NULL, 'Nhà xuất bản Thanh Niên.', '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(9, 'NXB Tổng Hợp TP.HCM', 'nxb-tong-hop-tphcm', '90 Nguyễn Văn Cừ, Hà Nội', '0243000009', 'contact9@nxb.vn', 'https://nxbhcm.com.vn', NULL, 'Nhà xuất bản Tổng Hợp TP.HCM.', '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(10, 'NXB Khoa Học và Kỹ Thuật', 'nxb-khoa-hoc-ky-thuat', '100 Nguyễn Văn Cừ, Hà Nội', '0243000010', 'contact10@nxb.vn', 'https://nxbkhkt.com.vn', NULL, 'Nhà xuất bản Khoa Học và Kỹ Thuật.', '2026-09-01 09:00:00', '2026-09-01 09:00:00');

-- 6. BOOKS (100 cuốn sách thực tế kèm cover_image từ Wikipedia)
INSERT INTO books (id, title, slug, isbn, description, cover_image, publisher_id, publish_year, page_count, language, dimensions, weight, price, sale_price, stock_quantity, sold_quantity, status, created_at, updated_at)
VALUES
(1, 'The Great Gatsby', 'the-great-gatsby', '9786041000001', 'Tác phẩm kinh điển về giấc mơ Mỹ của F. Scott Fitzgerald.', 'https://en.wikipedia.org/wiki/Special:FilePath/The_Great_Gatsby_Cover_1925_Retouched.jpg', 6, 1925, 218, 'vi', '14x21 cm', 260, 115000, 103500, 45, 12, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(2, 'Pride and Prejudice', 'pride-and-prejudice', '9786041000002', 'Kiệt tác lãng mạn hiện thực của nữ văn sĩ Jane Austen.', 'https://en.wikipedia.org/wiki/Special:FilePath/PrideAndPrejudiceTitlePage.jpg', 4, 1813, 432, 'vi', '14x21 cm', 420, 145000, 130500, 50, 18, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(3, 'Don Quixote', 'don-quixote', '9786041000003', 'Tiểu thuyết kinh điển về chàng hiệp sĩ xứ Mancha.', 'https://en.wikipedia.org/wiki/Special:FilePath/Don_Quixote_1.jpg', 4, 1605, 860, 'vi', '16x24 cm', 890, 235000, 211500, 30, 8, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(4, 'Alice in Wonderland', 'alice-in-wonderland', '9786041000004', 'Hành trình kỳ thú vào xứ sở thần tiên của cô bé Alice.', 'https://en.wikipedia.org/wiki/Special:FilePath/Alice_in_Wonderland_1920_title_page.jpg', 2, 1865, 192, 'vi', '13x19 cm', 220, 85000, 76500, 70, 25, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(5, 'Dracula', 'dracula', '9786041000005', 'Tác phẩm gothic kinh điển bất hủ về bá tước ma cà rồng Dracula.', 'https://en.wikipedia.org/wiki/Special:FilePath/Dracula_1st_ed_cover_1897.jpg', 5, 1897, 488, 'vi', '14x21 cm', 460, 165000, NULL, 40, 15, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(6, 'Moby-Dick', 'moby-dick', '9786041000006', 'Thiên anh hùng ca biển cả và cuộc săn cá voi trắng vĩ đại.', 'https://en.wikipedia.org/wiki/Special:FilePath/Moby-Dick_FE_title_page.jpg', 6, 1851, 630, 'vi', '16x24 cm', 650, 195000, 175500, 25, 9, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(7, 'Frankenstein', 'frankenstein', '9786041000007', 'Tiểu thuyết khoa học viễn tưởng và kinh dị đầu tiên của nhân loại.', 'https://en.wikipedia.org/wiki/Special:FilePath/Frankenstein_1818_edition_title_page.jpg', 4, 1818, 280, 'vi', '14x21 cm', 310, 120000, 108000, 55, 20, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(8, 'Oliver Twist', 'oliver-twist', '9786041000008', 'Bức tranh hiện thực trần trụi và số phận cậu bé mồ côi Oliver.', 'https://en.wikipedia.org/wiki/Special:FilePath/Oliver_Twist_title_page.jpg', 1, 1838, 512, 'vi', '14x21 cm', 500, 150000, 135000, 35, 14, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(9, 'Jane Eyre', 'jane-eyre', '9786041000009', 'Tác phẩm nữ quyền và tình yêu mãnh liệt của Charlotte Brontë.', 'https://en.wikipedia.org/wiki/Special:FilePath/Jane_Eyre_title_page.jpg', 3, 1847, 560, 'vi', '14x21 cm', 540, 203000, 182700, 60, 22, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(10, 'Wuthering Heights', 'wuthering-heights', '9786041000010', 'Câu chuyện tình yêu đầy thù hận trên đồng hoang Yorkshire.', 'https://en.wikipedia.org/wiki/Special:FilePath/Wuthering_Heights_title_page.jpg', 4, 1847, 416, 'vi', '14x21 cm', 430, 135000, NULL, 48, 16, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(11, 'Great Expectations', 'great-expectations', '9786041000011', 'Những kỳ vọng lớn lao và bài học đường đời của Pip.', 'https://en.wikipedia.org/wiki/Special:FilePath/Great_Expectations_title_page.jpg', 1, 1861, 540, 'vi', '14x21 cm', 510, 160000, 144000, 32, 10, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(12, 'The Picture of Dorian Gray', 'the-picture-of-dorian-gray', '9786041000012', 'Bức chân dung quỷ dữ và sự đồi đọa của cái đẹp suy đồi.', 'https://en.wikipedia.org/wiki/Special:FilePath/Picture_of_dorian_gray_1890_ward_lock_and_co.jpg', 6, 1890, 272, 'vi', '13x20 cm', 290, 110000, 99000, 65, 30, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(13, 'The Time Machine', 'the-time-machine', '9786041000013', 'Hành trình vượt thời gian đến tương lai xa xôi của H.G. Wells.', 'https://en.wikipedia.org/wiki/Special:FilePath/The_Time_Machine_%281895%29_first_edition.jpg', 10, 1895, 160, 'vi', '13x19 cm', 180, 75000, 67500, 80, 35, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(14, 'The War of the Worlds', 'the-war-of-the-worlds', '9786041000014', 'Cuộc chiến xâm lăng Trái Đất kinh hoàng của người Sao Hỏa.', 'https://en.wikipedia.org/wiki/Special:FilePath/The_War_of_the_Worlds_first_edition.jpg', 10, 1898, 224, 'vi', '13x19 cm', 240, 90000, 81000, 70, 28, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(15, 'Adventures of Huckleberry Finn', 'adventures-of-huckleberry-finn', '9786041000015', 'Chuyến phiêu lưu trên dòng sông Mississippi của cậu bé Huck Finn.', 'https://en.wikipedia.org/wiki/Special:FilePath/Adventures_of_huckleberry_finn_cover.jpg', 1, 1884, 360, 'vi', '14x21 cm', 380, 125000, NULL, 55, 19, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(16, 'The Jungle Book', 'the-jungle-book', '9786041000016', 'Cậu bé rừng xanh Mowgli và thế giới hoang dã diệu kỳ.', 'https://en.wikipedia.org/wiki/Special:FilePath/The_Jungle_Book_cover.jpg', 2, 1894, 240, 'vi', '14x20 cm', 260, 95000, 85500, 90, 42, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(17, 'The Wind in the Willows', 'the-wind-in-the-willows', '9786041000017', 'Câu chuyện ấm áp, thi vị về tình bạn bên dòng sông.', 'https://en.wikipedia.org/wiki/Special:FilePath/The_Wind_in_the_Willows_cover.jpg', 2, 1908, 260, 'vi', '13x19 cm', 280, 98000, 88200, 60, 21, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(18, 'Peter Pan', 'peter-pan', '9786041000018', 'Chú bé không bao giờ lớn và vùng đất Neverland diệu kỳ.', 'https://en.wikipedia.org/wiki/Special:FilePath/Peter_Pan_and_Wendy.jpg', 2, 1911, 230, 'vi', '13x19 cm', 250, 356000, 320400, 85, 39, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(19, 'Gulliver\'s Travels', 'gullivers-travels', '9786041000019', 'Hành trình trào phúng đến xứ người tí hon và người khổng lồ.', 'https://en.wikipedia.org/wiki/Special:FilePath/Gullivers_travels.jpg', 6, 1726, 350, 'vi', '14x21 cm', 370, 130000, 117000, 40, 11, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(20, 'Grimm\'s Fairy Tales', 'grimms-fairy-tales', '9786041000020', 'Tuyển tập truyện cổ tích Grimms gắn liền với tuổi thơ thế giới.', 'https://en.wikipedia.org/wiki/Special:FilePath/Grimm%27s_Fairy_Tales.jpg', 2, 1812, 580, 'vi', '16x24 cm', 620, 210000, NULL, 100, 48, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(21, 'A Tale of Two Cities', 'a-tale-of-two-cities', '9786041000021', 'Câu chuyện lịch sử tráng lệ London và Paris trong Cách mạng Pháp.', 'https://en.wikipedia.org/wiki/Special:FilePath/A_Tale_of_Two_Cities_title_page.jpg', 4, 1859, 448, 'vi', '14x21 cm', 470, 155000, 139500, 38, 12, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(22, 'Les Misérables', 'les-miserables', '9786041000022', 'Kiệt tác nhân đạo Những người khốn khổ của Victor Hugo.', 'https://en.wikipedia.org/wiki/Special:FilePath/Les_Miserables_Title_Page.jpg', 4, 1862, 1400, 'vi', '16x24 cm', 1450, 54000, 48600, 42, 15, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(23, 'Anna Karenina', 'anna-karenina', '9786041000023', 'Bản bi ca tình yêu và xã hội thượng lưu Nga của Lev Tolstoy.', 'https://en.wikipedia.org/wiki/Special:FilePath/Anna_Karenina_title_page.jpg', 6, 1877, 960, 'vi', '16x24 cm', 980, 260000, 234000, 36, 11, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(24, 'War and Peace', 'war-and-peace', '9786041000024', 'Đại sử thi Chiến tranh và Hòa bình của Lev Tolstoy.', 'https://en.wikipedia.org/wiki/Special:FilePath/War_and_Peace_title_page.jpg', 6, 1869, 1600, 'vi', '16x24 cm', 1700, 380000, 342000, 28, 7, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(25, 'Crime and Punishment', 'crime-and-punishment', '9786041000025', 'Tội ác và trừng phạt - bản phân tích tâm lý tội phạm vĩ đại.', 'https://en.wikipedia.org/wiki/Special:FilePath/Crime_and_Punishment_title_page.jpg', 4, 1866, 680, 'vi', '16x24 cm', 710, 195000, NULL, 50, 19, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(26, 'The Brothers Karamazov', 'the-brothers-karamazov', '9786041000026', 'Tác phẩm đỉnh cao về đức tin, đạo đức và số phận con người.', 'https://en.wikipedia.org/wiki/Special:FilePath/Brothers_Karamazov_title_page.jpg', 4, 1880, 920, 'vi', '16x24 cm', 950, 270000, 243000, 34, 13, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(27, 'Madame Bovary', 'madame-bovary', '9786041000027', 'Tiểu thuyết hiện thực trứ danh về ảo vọng tình ái của Flaubert.', 'https://en.wikipedia.org/wiki/Special:FilePath/Madame_Bovary_1857_title_page.jpg', 4, 1857, 420, 'vi', '14x21 cm', 440, 139000, 125100, 45, 17, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(28, 'Leaves of Grass', 'leaves-of-grass', '9786041000028', 'Tập thơ Lá cỏ khai phá nền thi ca hiện đại nước Mỹ.', 'https://en.wikipedia.org/wiki/Special:FilePath/Leaves_of_Grass_1855_title_page.jpg', 6, 1855, 340, 'vi', '14x21 cm', 360, 140000, 126000, 40, 12, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(29, 'The Odyssey', 'the-odyssey', '9786041000029', 'Sử thi phiêu lưu kỳ vĩ của người anh hùng Odysseus.', 'https://en.wikipedia.org/wiki/Special:FilePath/The_Odyssey_title_page.jpg', 6, -800, 480, 'vi', '16x24 cm', 520, 180000, 162000, 30, 8, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(30, 'Iliad', 'iliad', '9786041000030', 'Bản hùng ca cuộc chiến thành Troy và cơn thịnh nộ của Achilles.', 'https://en.wikipedia.org/wiki/Special:FilePath/Iliad_title_page.jpg', 6, -750, 560, 'vi', '16x24 cm', 580, 190000, NULL, 32, 9, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(31, 'Divine Comedy', 'divine-comedy', '9786041000031', 'Thần khúc - hành trình qua Địa ngục, Luyện ngục và Thiên đường.', 'https://en.wikipedia.org/wiki/Special:FilePath/Divine_Comedy_title_page.jpg', 6, 1320, 720, 'vi', '16x24 cm', 790, 207000, 186300, 28, 6, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(32, 'Paradise Lost', 'paradise-lost', '9786041000032', 'Thiên đường đã mất - bản trường ca tôn giáo và triết lý kinh điển.', 'https://en.wikipedia.org/wiki/Special:FilePath/Paradise_Lost_title_page.jpg', 6, 1667, 440, 'vi', '14x21 cm', 470, 165000, 148500, 30, 7, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(33, 'The Canterbury Tales', 'the-canterbury-tales', '9786041000033', 'Những câu chuyện kể trên đường hành hương Canterbury.', 'https://en.wikipedia.org/wiki/Special:FilePath/Canterbury_Tales_title_page.jpg', 4, 1400, 520, 'vi', '14x21 cm', 540, 175000, 157500, 35, 11, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(34, 'Hamlet', 'hamlet', '9786041000034', 'Vở bi kịch vĩ đại về sự báo thù và do dự của hoàng tử Đan Mạch.', 'https://en.wikipedia.org/wiki/Special:FilePath/Hamlet_title_page.jpg', 4, 1601, 240, 'vi', '13x19 cm', 260, 95000, 85500, 75, 31, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(35, 'Macbeth', 'macbeth', '9786041000035', 'Bi kịch về tham vọng quyền lực và sự sa ngã lương tri.', 'https://en.wikipedia.org/wiki/Special:FilePath/Macbeth_title_page.jpg', 4, 1606, 210, 'vi', '13x19 cm', 230, 275000, NULL, 65, 26, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(36, 'Romeo and Juliet', 'romeo-and-juliet', '9786041000036', 'Bi kịch tình yêu bất hủ vượt lên thù hận gia tộc.', 'https://en.wikipedia.org/wiki/Special:FilePath/Romeo_and_Juliet_title_page.jpg', 4, 1597, 220, 'vi', '13x19 cm', 240, 292000, 262800, 80, 36, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(37, 'Othello', 'othello', '9786041000037', 'Bi kịch ghen tuông mù quáng bị thao túng bởi kẻ thù.', 'https://en.wikipedia.org/wiki/Special:FilePath/Othello_title_page.jpg', 4, 1603, 230, 'vi', '13x19 cm', 250, 92000, 82800, 70, 24, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(38, 'King Lear', 'king-lear', '9786041000038', 'Bi kịch về tình phụ tử, quyền lực và sự bạc bẽo.', 'https://en.wikipedia.org/wiki/Special:FilePath/King_Lear_title_page.jpg', 4, 1606, 250, 'vi', '13x19 cm', 270, 98000, 88200, 60, 22, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(39, 'A Midsummer Night\'s Dream', 'a-midsummer-nights-dream', '9786041000039', 'Giấc mộng đêm hè - hài kịch tình yêu lãng mạn huyền ảo.', 'https://en.wikipedia.org/wiki/Special:FilePath/A_Midsummer_Nights_Dream_title_page.jpg', 4, 1600, 190, 'vi', '13x19 cm', 210, 85000, 76500, 75, 29, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(40, 'The Tempest', 'the-tempest', '9786041000040', 'Cơn bão - khúc ca tha thứ và hòa giải của Shakespeare.', 'https://en.wikipedia.org/wiki/Special:FilePath/The_Tempest_title_page.jpg', 4, 1611, 200, 'vi', '13x19 cm', 220, 88000, NULL, 60, 19, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(41, 'Treasure Island', 'treasure-island', '9786041000041', 'Hành trình săn vàng và chạm trán hải tặc trên đảo giấu vàng.', 'https://en.wikipedia.org/wiki/Special:FilePath/Treasure_Island_title_page.jpg', 2, 1883, 310, 'vi', '14x20 cm', 330, 110000, 99000, 65, 27, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(42, 'Dr Jekyll and Mr Hyde', 'dr-jekyll-and-mr-hyde', '9786041000042', 'Hai mặt thiện ác giằng xé trong nội tâm con người.', 'https://en.wikipedia.org/wiki/Special:FilePath/Dr_Jekyll_and_Mr_Hyde_title_page.jpg', 5, 1886, 160, 'vi', '13x19 cm', 180, 78000, 70200, 80, 33, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(43, 'Robinson Crusoe', 'robinson-crusoe', '9786041000043', 'Bản lĩnh sinh tồn kiên cường suốt 28 năm trên đảo hoang.', 'https://en.wikipedia.org/wiki/Special:FilePath/Robinson_Crusoe_title_page.jpg', 1, 1719, 410, 'vi', '14x21 cm', 430, 135000, 121500, 55, 18, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(44, 'Tom Jones', 'tom-jones', '9786041000044', 'Tiểu thuyết hài hước châm biếm sâu cay đời sống xã hội Anh.', 'https://en.wikipedia.org/wiki/Special:FilePath/Tom_Jones_title_page.jpg', 4, 1749, 780, 'vi', '16x24 cm', 800, 58000, 52200, 30, 9, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(45, 'The Pilgrim\'s Progress', 'the-pilgrims-progress', '9786041000045', 'Hành trình của người hành hương tìm kiếm sự cứu rỗi.', 'https://en.wikipedia.org/wiki/Special:FilePath/The_Pilgrims_Progress_title_page.jpg', 6, 1678, 330, 'vi', '14x21 cm', 350, 75000, NULL, 40, 11, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(46, 'Sense and Sensibility', 'sense-and-sensibility', '9786041000046', 'Lý trí và tình cảm - xung đột nội tâm của hai chị em gái.', 'https://en.wikipedia.org/wiki/Special:FilePath/Sense_and_Sensibility_title_page.jpg', 4, 1811, 400, 'vi', '14x21 cm', 420, 130000, 117000, 48, 16, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(47, 'Emma', 'emma', '9786041000047', 'Cô nàng mối lái rắc rối nhưng đáng mến Emma Woodhouse.', 'https://en.wikipedia.org/wiki/Special:FilePath/Emma_title_page.jpg', 4, 1815, 480, 'vi', '14x21 cm', 490, 140000, 126000, 52, 21, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(48, 'Persuasion', 'persuasion', '9786041000048', 'Thuyết phục - thiên truyện lãng mạn trầm lắng cuối đời của Austen.', 'https://en.wikipedia.org/wiki/Special:FilePath/Persuasion_title_page.jpg', 4, 1817, 300, 'vi', '14x21 cm', 320, 115000, 103500, 45, 14, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(49, 'Northanger Abbey', 'northanger-abbey', '9786041000049', 'Tu viện Northanger - sự châm biếm tinh tế truyện kinh dị gothic.', 'https://en.wikipedia.org/wiki/Special:FilePath/Northanger_Abbey_title_page.jpg', 4, 1817, 270, 'vi', '14x21 cm', 290, 105000, 94500, 40, 12, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(50, 'Mansfield Park', 'mansfield-park', '9786041000050', 'Công viên Mansfield và câu chuyện luân lý tình yêu sâu sắc.', 'https://en.wikipedia.org/wiki/Special:FilePath/Mansfield_Park_title_page.jpg', 4, 1814, 460, 'vi', '14x21 cm', 480, 145000, NULL, 35, 10, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(51, 'Số đỏ', 'so-do', '9786041000051', 'Kiệt tác trào phúng đỉnh cao của văn học Việt Nam về Xuân Tóc Đỏ.', 'https://vi.wikipedia.org/wiki/Special:FilePath/Sodobanindau.jpg', 4, 1936, 260, 'vi', '13x20 cm', 280, 95000, 85500, 90, 45, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(52, 'Chữ người tử tù', 'chu-nguoi-tu-tu', '9786041000052', 'Khí phách hiên ngang và cái đẹp thiên lương nơi ngục tù tăm tối.', 'https://vi.wikipedia.org/wiki/Special:FilePath/Chu_nguoi_tu_tu.jpeg', 4, 1939, 180, 'vi', '13x19 cm', 200, 75000, 67500, 85, 38, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(53, 'Cho tôi xin một vé đi tuổi thơ', 'cho-toi-xin-mot-ve-di-tuoi-tho', '9786041000053', 'Tấm vé đưa người đọc trở lại miền ký ức trong trẻo tuổi ấu thơ.', 'https://vi.wikipedia.org/wiki/Special:FilePath/Cho_tôi_xin_một_vé_đi_tuổi_thơ.jpg', 1, 2008, 220, 'vi', '13x20 cm', 240, 88000, 79200, 120, 65, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(54, 'Làm đĩ', 'lam-di', '9786041000054', 'Bản luận về giáo dục giới tính và sự tha hóa xã hội thời thực dân.', 'https://vi.wikipedia.org/wiki/Special:FilePath/Lam_di.jpg', 4, 1937, 240, 'vi', '13x20 cm', 250, 228000, 205200, 50, 21, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(55, 'Mãi mãi tuổi hai mươi', 'mai-mai-tuoi-hai-muoi', '9786041000055', 'Trang nhật ký hào hùng, xúc động của liệt sĩ Nguyễn Văn Thạc.', 'https://vi.wikipedia.org/wiki/Special:FilePath/Maimaituoi20.jpg', 8, 2005, 320, 'vi', '14x20 cm', 340, 105000, NULL, 60, 24, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(56, 'Đắc nhân tâm', 'dac-nhan-tam', '9786041000056', 'Nghệ thuật thu phục lòng người và giao tiếp đỉnh cao nhân loại.', 'https://vi.wikipedia.org/wiki/Special:FilePath/Đắc_nhân_tâm.jpg', 1, 1936, 320, 'vi', '14x21 cm', 360, 110000, 99000, 150, 80, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(57, 'Nhà giả kim', 'nha-gia-kim', '9786041000057', 'Cuộc truy tìm kho báu và bài học lắng nghe số phận của cậu bé chăn cừu.', 'https://vi.wikipedia.org/wiki/Special:FilePath/Nhà_giả_kim_(sách).jpg', 6, 1988, 228, 'vi', '13x20 cm', 240, 279000, 251100, 160, 85, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(58, 'Rừng Na Uy', 'rung-na-uy', '9786041000058', 'Bản tình ca u buồn về tuổi trẻ, nỗi cô đơn và sự mất mát.', 'https://vi.wikipedia.org/wiki/Special:FilePath/Rừng_Na_Uy_Murakami_Haruki.jpg', 6, 1987, 460, 'vi', '14x21 cm', 480, 145000, 130500, 75, 34, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(59, 'Súng, Vi trùng và Thép', 'sung-vi-trung-va-thep', '9786041000059', 'Nguồn gốc sự bất bình đẳng giữa các xã hội loài người qua lịch sử.', 'https://vi.wikipedia.org/wiki/Special:FilePath/Súng,_Vi_trùng_và_Thép_bìa_sách.png', 10, 1997, 650, 'vi', '16x24 cm', 720, 230000, 207000, 45, 18, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(60, 'Đời nhẹ khôn kham', 'doi-nhe-khon-kham', '9786041000060', 'Sự nhẹ nhõm không thể chịu đựng nổi của kiếp người theo Kundera.', 'https://vi.wikipedia.org/wiki/Special:FilePath/Đời_nhẹ_khôn_kham.jpg', 6, 1984, 410, 'vi', '14x21 cm', 440, 140000, NULL, 50, 19, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(61, 'Kính vạn hoa', 'kinh-van-hoa', '9786041000061', 'Bộ truyện học trò nổi tiếng với Quý ròm, Tiểu Long và nhỏ Hạnh.', 'https://vi.wikipedia.org/wiki/Special:FilePath/Bìa_truyện_Kính_vạn_hoa_2012.jpg', 2, 1995, 380, 'vi', '13x19 cm', 390, 115000, 103500, 95, 46, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(62, 'Bộ Năm trên đảo giấu vàng', 'bo-nam-tren-dao-giau-vang', '9786041000062', 'Chuyến thám hiểm ly kỳ đầu tiên của Bộ Năm nổi tiếng.', 'https://vi.wikipedia.org/wiki/Special:FilePath/Bộ_Năm_trên_đảo_giấu_vàng.jpg', 2, 1942, 240, 'vi', '13x19 cm', 260, 89000, 80100, 80, 31, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(63, 'Cánh buồm đỏ thắm', 'canh-buom-do-tham', '9786041000063', 'Câu chuyện cổ tích tuyệt đẹp về niềm tin và tình yêu lãng mạn.', 'https://vi.wikipedia.org/wiki/Special:FilePath/Cánh_buồm_đỏ_thắm_(sách).jpg', 2, 1923, 180, 'vi', '13x19 cm', 200, 381000, 342900, 70, 25, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(64, 'Cô thành trong gương', 'co-thanh-trong-guong', '9786041000064', 'Tiểu thuyết chữa lành tâm hồn tuổi trẻ đoạt giải thưởng sách Nhật Bản.', 'https://vi.wikipedia.org/wiki/Special:FilePath/Bìa_tiểu_thuyết_Cô_thành_trong_gương.jpg', 2, 2017, 520, 'vi', '14x20 cm', 530, 160000, 144000, 60, 27, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(65, 'Chân Hoàn Truyện', 'chan-hoan-truyen', '9786041000065', 'Đại tác phẩm cung đấu kinh điển Trung Hoa về số phận Chân Hoàn.', 'https://vi.wikipedia.org/wiki/Special:FilePath/Bìa_Chân_Hoàn_Truyện_(Bộ_8_Tập).jpg', 3, 2007, 750, 'vi', '16x24 cm', 820, 250000, NULL, 40, 16, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(66, 'Những cô gái nhỏ', 'nhung-co-gai-nho', '9786041000066', 'Bốn chị em nhà March và bài học gia đình sâu sắc.', 'https://vi.wikipedia.org/wiki/Special:FilePath/Nhgcogainho.jpg', 3, 1868, 480, 'vi', '14x21 cm', 490, 145000, 130500, 65, 23, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(67, 'Vầng trăng máu', 'vang-trang-mau', '9786041000067', 'Kỳ án sát hại người bản địa Osage và sự ra đời của FBI.', 'https://vi.wikipedia.org/wiki/Special:FilePath/Bìa_sách_Vầng_trăng_máu.jpg', 5, 2017, 430, 'vi', '14x21 cm', 460, 155000, 139500, 48, 17, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(68, 'Tác phẩm âm nhạc Nguyễn Văn Quỳ', 'tac-pham-am-nhac-nguyen-van-quy', '9786041000068', 'Tuyển tập nhạc phổ và di sản sonata vĩ đại của nhạc sĩ Nguyễn Văn Quỳ.', 'https://vi.wikipedia.org/wiki/Special:FilePath/Sách_tác_phẩm_âm_nhạc_của_Nguyễn_Văn_Quỳ.jpg', 7, 2005, 300, 'vi', '19x27 cm', 580, 220000, 198000, 20, 5, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(69, 'Go-Tōbun no Hanayome', 'go-tobun-no-hanayome', '9786041000069', 'Manga rom-com ăn khách Nhà có 5 nàng dâu.', 'https://vi.wikipedia.org/wiki/Special:FilePath/Go-Tōbun_no_Hanayome_bìa_chương_1.jpg', 2, 2017, 192, 'vi', '11x18 cm', 180, 45000, 40500, 180, 95, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(70, 'Kimi no Iru Machi', 'kimi-no-iru-machi', '9786041000070', 'Manga tình cảm thị trấn nơi em sống đầy cảm xúc.', 'https://vi.wikipedia.org/wiki/Special:FilePath/Kimi_no_Iru_Machi_bìa_tập_1.jpg', 2, 2008, 190, 'vi', '11x18 cm', 180, 130000, NULL, 90, 40, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(71, 'Last Game', 'last-game', '9786041000071', 'Manga học đường đối đầu tình cảm 10 năm hài hước và ngọt ngào.', 'https://vi.wikipedia.org/wiki/Special:FilePath/Ảnh_bìa_tập_1_Last_Game.jpg', 2, 2011, 192, 'vi', '11x18 cm', 180, 45000, 40500, 110, 52, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(72, 'Spy × Family', 'spy-family', '9786041000072', 'Gia đình điệp viên, sát thủ và cô bé ngoại cảm siêu hài hước.', 'https://vi.wikipedia.org/wiki/Special:FilePath/Bìa_manga_Spy_×_Family_tập_1_thuộc_nhà_xuất_bản_Kim_Đồng.jpg', 2, 2019, 210, 'vi', '11x18 cm', 200, 164000, 147600, 200, 110, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(73, 'Dandadan', 'dandadan', '9786041000073', 'Manga siêu nhiên, ma quỷ, người ngoài hành tinh gay cấn bùng nổ.', 'https://vi.wikipedia.org/wiki/Special:FilePath/Dandadan_vol_1.jpg', 2, 2021, 200, 'vi', '11x18 cm', 190, 50000, 45000, 140, 70, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(74, 'Sakamoto Days', 'sakamoto-days', '9786041000074', 'Cựu sát thủ huyền thoại quy ẩn mở tiệm tạp hóa bảo vệ bình yên.', 'https://vi.wikipedia.org/wiki/Special:FilePath/SakamotoDaysTankobon.jpg', 2, 2020, 192, 'vi', '11x18 cm', 190, 50000, 45000, 150, 78, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(75, 'Hit and Run Holiday (Nancy Drew)', 'hit-and-run-holiday-nancy-drew', '9786041000075', 'Tập truyện phiêu lưu trinh thám nổi tiếng của thiếu nữ thám tử Nancy Drew.', 'https://vi.wikipedia.org/wiki/Special:FilePath/NDHARH.jpg', 2, 1986, 160, 'vi', '13x19 cm', 170, 70000, NULL, 65, 20, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(76, 'Lục Vân Tiên', 'luc-van-tien', '9786041000076', 'Truyện thơ Nôm giáo dục luân lý nghĩa khí ngời sáng của Đồ Chiểu.', 'https://commons.wikimedia.org/wiki/Special:FilePath/Tranh_Ngưu_Lang_Chức_Nữ_thời_nhà_Nguyễn_trong_sách_Vân_Tiên_Cổ_Tích_Truyện_(1897).jpg', 4, 1854, 210, 'vi', '14x20 cm', 230, 80000, 72000, 75, 30, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(77, 'Kinh Thánh (Bản tiếng Việt)', 'kinh-thanh-ban-tieng-viet', '9786041000077', 'Kinh Thánh Cựu Ước và Tân Ước do Hồng y Trịnh Văn Căn chủ dịch.', 'https://commons.wikimedia.org/wiki/Special:FilePath/Kinh_Thánh_(G.M.Trịnh_Văn_Căn_dịch,_1985).jpg', 7, 1985, 1800, 'vi', '16x24 cm', 1850, 350000, 315000, 40, 15, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(78, 'Tuổi thơ dữ dội', 'tuoi-tho-du-doi', '9786041000078', 'Hùng ca cảm động rơi nước mắt về đội thiếu niên trinh sát Vệ Quốc Đoàn.', 'https://vi.wikipedia.org/wiki/Special:FilePath/Tuổi_thơ_dữ_dội.jpg', 2, 1988, 760, 'vi', '14x20 cm', 780, 195000, 175500, 90, 47, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(79, 'Thơ thơ (Xuân Diệu)', 'tho-tho-xuan-dieu', '9786041000079', 'Tập thơ đầu tay đánh dấu đỉnh cao thơ lãng mạn Việt Nam.', 'https://vi.wikipedia.org/wiki/Special:FilePath/Thơ_thơ.jpg', 4, 1938, 140, 'vi', '13x19 cm', 160, 68000, 61200, 70, 26, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(80, 'Vang bóng một thời', 'vang-bong-mot-thoi', '9786041000080', 'Tập truyện ngắn ghi lại thú chơi tao nhã một thời xưa cũ của cụ Nguyễn Tuân.', 'https://vi.wikipedia.org/wiki/Special:FilePath/Vang_bóng_một_thời.jpg', 4, 1940, 210, 'vi', '13x20 cm', 230, 85000, NULL, 80, 32, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(81, 'First Folio (Shakespeare)', 'first-folio-shakespeare', '9786041000081', 'Bộ tập hợp toàn diện các vở kịch kinh điển đầu tiên của Shakespeare.', 'https://en.wikipedia.org/wiki/Special:FilePath/First_Folio.jpg', 6, 1623, 900, 'vi', '20x30 cm', 1900, 317000, 285300, 20, 5, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(82, 'Origin of Species', 'origin-of-species', '9786041000082', 'Nguồn gốc các loài - tác phẩm làm thay đổi vĩnh viễn tư duy khoa học.', 'https://en.wikipedia.org/wiki/Special:FilePath/Origin_of_Species_title_page.jpg', 10, 1859, 500, 'vi', '16x24 cm', 600, 185000, 166500, 45, 14, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(83, 'On Liberty', 'on-liberty', '9786041000083', 'Bàn về tự do - luận thuyết chính trị và tự do cá nhân mẫu mực của Mill.', 'https://en.wikipedia.org/wiki/Special:FilePath/On_Liberty_title_page.jpg', 6, 1859, 210, 'vi', '14x21 cm', 240, 351000, 315900, 50, 18, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(84, 'The Wealth of Nations', 'the-wealth-of-nations', '9786041000084', 'Của cải của các dân tộc - nền tảng kinh tế thị trường cổ điển.', 'https://en.wikipedia.org/wiki/Special:FilePath/Wealth_of_Nations_title_page.jpg', 9, 1776, 950, 'vi', '16x24 cm', 1100, 320000, 288000, 35, 11, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(85, 'Critique of Pure Reason', 'critique-of-pure-reason', '9786041000085', 'Phê phán lý tính thuần túy - kiệt tác triết học nhận thức của Kant.', 'https://en.wikipedia.org/wiki/Special:FilePath/Critique_of_Pure_Reason_title_page.jpg', 6, 1781, 800, 'vi', '16x24 cm', 950, 290000, NULL, 25, 6, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(86, 'The Communist Manifesto', 'the-communist-manifesto', '9786041000086', 'Tuyên ngôn của Đảng Cộng sản của Karl Marx và Friedrich Engels.', 'https://en.wikipedia.org/wiki/Special:FilePath/The_Communist_Manifesto_title_page.jpg', 5, 1848, 120, 'vi', '13x19 cm', 150, 50000, 45000, 100, 35, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(87, 'Leviathan', 'leviathan', '9786041000087', 'Khế ước xã hội và quyền lực nhà nước bảo đảm an ninh của Hobbes.', 'https://en.wikipedia.org/wiki/Special:FilePath/Leviathan_title_page.jpg', 6, 1651, 620, 'vi', '16x24 cm', 720, 210000, 189000, 30, 8, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(88, 'The Catcher in the Rye', 'the-catcher-in-the-rye', '9786041000088', 'Bắt trẻ đồng xanh - bức tranh tâm lý nổi loạn của tuổi trưởng thành.', 'https://en.wikipedia.org/wiki/Special:FilePath/The_Catcher_in_the_Rye_(1951,_first_edition_cover).jpg', 6, 1951, 260, 'vi', '13x20 cm', 280, 105000, 94500, 80, 36, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(89, 'Beowulf', 'beowulf', '9786041000089', 'Sử thi anh hùng cổ tiếng Anh chiến đấu diệt quái vật Grendel.', 'https://en.wikipedia.org/wiki/Special:FilePath/Beowulf_cotton_ms_vitellius_a_xv_f._132r.jpg', 4, 1000, 230, 'vi', '14x21 cm', 260, 95000, 85500, 40, 10, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(90, 'Gutenberg Bible', 'gutenberg-bible', '9786041000090', 'Bản in Kinh Thánh lịch sử mở đầu kỷ nguyên in ấn phương Tây.', 'https://en.wikipedia.org/wiki/Special:FilePath/Gutenberg_Bible_B42_Genesis.JPG', 6, 1455, 1280, 'vi', '22x32 cm', 2600, 100000, NULL, 15, 3, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(91, '1984', '1984-george-orwell', '9786041000091', 'Tiểu thuyết phản địa đàng kinh điển về sự kiểm soát và mất tự do.', 'https://en.wikipedia.org/wiki/Special:FilePath/1984_first_edition_cover.jpg', 6, 1949, 368, 'vi', '14x21 cm', 390, 125000, 112500, 110, 58, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(92, 'Animal Farm', 'animal-farm', '9786041000092', 'Chuyện ở nông trại - ngụ ngôn trào phúng chính trị sâu sắc.', 'https://en.wikipedia.org/wiki/Special:FilePath/Animal_Farm_-_1st_edition.jpg', 6, 1945, 160, 'vi', '13x19 cm', 180, 75000, 67500, 120, 62, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(93, 'Uncle Tom\'s Cabin', 'uncle-toms-cabin', '9786041000093', 'Túp lều bác Tom - hồi chuông đòi tự do và nhân phẩm cho người nô lệ.', 'https://en.wikipedia.org/wiki/Special:FilePath/Uncle_Toms_Cabin_title_page.jpg', 4, 1852, 480, 'vi', '14x21 cm', 510, 145000, 130500, 50, 16, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(94, 'Brave New World', 'brave-new-world', '9786041000094', 'Thế giới mới tươi đẹp - cảnh báo công nghệ kiểm soát tương lai con người.', 'https://en.wikipedia.org/wiki/Special:FilePath/BraveNewWorld_FirstEdition.jpg', 6, 1932, 310, 'vi', '14x21 cm', 340, 120000, 108000, 65, 29, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(95, 'Candide', 'candide', '9786041000095', 'Chàng ngây thơ - tiểu thuyết triết học đả kích thuyết lạc quan mù quáng.', 'https://en.wikipedia.org/wiki/Special:FilePath/Candide_title_page.jpg', 4, 1759, 190, 'vi', '13x19 cm', 210, 78000, NULL, 55, 17, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(96, 'Utopia', 'utopia', '9786041000096', 'Xứ sở địa đàng lý tưởng và phê phán trật tự xã hội của Thomas More.', 'https://en.wikipedia.org/wiki/Special:FilePath/Utopia_title_page.jpg', 6, 1516, 200, 'vi', '13x19 cm', 220, 202000, 181800, 45, 13, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(97, 'Principia Mathematica', 'principia-mathematica', '9786041000097', 'Các nguyên lý toán học của triết học tự nhiên tạo nền tảng cơ học cổ điển.', 'https://en.wikipedia.org/wiki/Special:FilePath/Principia_Mathematica_title_page.jpg', 10, 1687, 540, 'vi', '17x25 cm', 890, 295000, 265500, 25, 4, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(98, 'The Interpretation of Dreams', 'the-interpretation-of-dreams', '9786041000098', 'Diễn giải các giấc mơ - tác phẩm đột phá trong ngành phân tâm học.', 'https://en.wikipedia.org/wiki/Special:FilePath/The_interpretation_of_dreams_title_page.jpg', 10, 1899, 640, 'vi', '16x24 cm', 740, 215000, 193500, 40, 12, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(99, 'Encyclopédie', 'encyclopedie', '9786041000099', 'Đại bách khoa toàn thư thế kỷ Ánh sáng của Diderot và cộng sự.', 'https://en.wikipedia.org/wiki/Special:FilePath/Encyclopedie_title_page.jpg', 6, 1751, 980, 'vi', '20x28 cm', 1800, 360000, 324000, 20, 3, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00'),
(100, 'Declaration of Independence', 'declaration-of-independence', '9786041000100', 'Tuyên ngôn Độc lập Hoa Kỳ khẳng định quyền bình đẳng và mưu cầu hạnh phúc.', 'https://en.wikipedia.org/wiki/Special:FilePath/Declaration_of_Independence_broadside.jpg', 6, 1776, 100, 'vi', '14x20 cm', 130, 65000, 58500, 60, 22, 'available', '2026-09-01 09:00:00', '2026-10-03 08:00:00');

-- 7. BOOK_CATEGORIES (Mỗi cuốn sách chuẩn xác đúng 1 Thể loại Chính và 2 Thể loại Phụ)
INSERT INTO book_categories (book_id, category_id, is_primary)
VALUES
(1, 2, TRUE), (1, 3, FALSE), (1, 7, FALSE),
(2, 2, TRUE), (2, 3, FALSE), (2, 6, FALSE),
(3, 2, TRUE), (3, 3, FALSE), (3, 14, FALSE),
(4, 16, TRUE), (4, 2, FALSE), (4, 3, FALSE),
(5, 2, TRUE), (5, 5, FALSE), (5, 3, FALSE),
(6, 2, TRUE), (6, 3, FALSE), (6, 15, FALSE),
(7, 2, TRUE), (7, 5, FALSE), (7, 13, FALSE),
(8, 2, TRUE), (8, 3, FALSE), (8, 14, FALSE),
(9, 2, TRUE), (9, 6, FALSE), (9, 3, FALSE),
(10, 2, TRUE), (10, 6, FALSE), (10, 3, FALSE),
(11, 2, TRUE), (11, 3, FALSE), (11, 7, FALSE),
(12, 2, TRUE), (12, 3, FALSE), (12, 7, FALSE),
(13, 13, TRUE), (13, 2, FALSE), (13, 3, FALSE),
(14, 13, TRUE), (14, 2, FALSE), (14, 3, FALSE),
(15, 2, TRUE), (15, 16, FALSE), (15, 3, FALSE),
(16, 16, TRUE), (16, 2, FALSE), (16, 19, FALSE),
(17, 16, TRUE), (17, 2, FALSE), (17, 3, FALSE),
(18, 16, TRUE), (18, 2, FALSE), (18, 3, FALSE),
(19, 2, TRUE), (19, 3, FALSE), (19, 15, FALSE),
(20, 16, TRUE), (20, 2, FALSE), (20, 19, FALSE),
(21, 2, TRUE), (21, 14, FALSE), (21, 3, FALSE),
(22, 2, TRUE), (22, 14, FALSE), (22, 3, FALSE),
(23, 2, TRUE), (23, 6, FALSE), (23, 3, FALSE),
(24, 2, TRUE), (24, 14, FALSE), (24, 3, FALSE),
(25, 2, TRUE), (25, 7, FALSE), (25, 4, FALSE),
(26, 2, TRUE), (26, 7, FALSE), (26, 3, FALSE),
(27, 2, TRUE), (27, 3, FALSE), (27, 7, FALSE),
(28, 2, TRUE), (28, 19, FALSE), (28, 20, FALSE),
(29, 2, TRUE), (29, 14, FALSE), (29, 15, FALSE),
(30, 2, TRUE), (30, 14, FALSE), (30, 19, FALSE),
(31, 2, TRUE), (31, 14, FALSE), (31, 19, FALSE),
(32, 2, TRUE), (32, 14, FALSE), (32, 19, FALSE),
(33, 2, TRUE), (33, 14, FALSE), (33, 19, FALSE),
(34, 2, TRUE), (34, 7, FALSE), (34, 14, FALSE),
(35, 2, TRUE), (35, 14, FALSE), (35, 7, FALSE),
(36, 2, TRUE), (36, 6, FALSE), (36, 14, FALSE),
(37, 2, TRUE), (37, 7, FALSE), (37, 14, FALSE),
(38, 2, TRUE), (38, 14, FALSE), (38, 19, FALSE),
(39, 2, TRUE), (39, 6, FALSE), (39, 16, FALSE),
(40, 2, TRUE), (40, 14, FALSE), (40, 19, FALSE),
(41, 16, TRUE), (41, 2, FALSE), (41, 3, FALSE),
(42, 5, TRUE), (42, 13, FALSE), (42, 4, FALSE),
(43, 2, TRUE), (43, 3, FALSE), (43, 15, FALSE),
(44, 2, TRUE), (44, 3, FALSE), (44, 14, FALSE),
(45, 2, TRUE), (45, 14, FALSE), (45, 19, FALSE),
(46, 2, TRUE), (46, 6, FALSE), (46, 3, FALSE),
(47, 2, TRUE), (47, 6, FALSE), (47, 3, FALSE),
(48, 2, TRUE), (48, 6, FALSE), (48, 3, FALSE),
(49, 2, TRUE), (49, 5, FALSE), (49, 3, FALSE),
(50, 2, TRUE), (50, 6, FALSE), (50, 3, FALSE),
(51, 1, TRUE), (51, 3, FALSE), (51, 14, FALSE),
(52, 1, TRUE), (52, 14, FALSE), (52, 19, FALSE),
(53, 1, TRUE), (53, 16, FALSE), (53, 3, FALSE),
(54, 1, TRUE), (54, 7, FALSE), (54, 3, FALSE),
(55, 1, TRUE), (55, 14, FALSE), (55, 19, FALSE),
(56, 7, TRUE), (56, 20, FALSE), (56, 19, FALSE),
(57, 20, TRUE), (57, 2, FALSE), (57, 3, FALSE),
(58, 2, TRUE), (58, 3, FALSE), (58, 6, FALSE),
(59, 13, TRUE), (59, 14, FALSE), (59, 15, FALSE),
(60, 2, TRUE), (60, 3, FALSE), (60, 7, FALSE),
(61, 1, TRUE), (61, 16, FALSE), (61, 3, FALSE),
(62, 16, TRUE), (62, 4, FALSE), (62, 2, FALSE),
(63, 2, TRUE), (63, 16, FALSE), (63, 6, FALSE),
(64, 2, TRUE), (64, 7, FALSE), (64, 16, FALSE),
(65, 2, TRUE), (65, 3, FALSE), (65, 14, FALSE),
(66, 2, TRUE), (66, 7, FALSE), (66, 16, FALSE),
(67, 4, TRUE), (67, 5, FALSE), (67, 3, FALSE),
(68, 1, TRUE), (68, 14, FALSE), (68, 19, FALSE),
(69, 17, TRUE), (69, 6, FALSE), (69, 2, FALSE),
(70, 17, TRUE), (70, 6, FALSE), (70, 16, FALSE),
(71, 17, TRUE), (71, 6, FALSE), (71, 16, FALSE),
(72, 17, TRUE), (72, 4, FALSE), (72, 16, FALSE),
(73, 17, TRUE), (73, 13, FALSE), (73, 5, FALSE),
(74, 17, TRUE), (74, 4, FALSE), (74, 16, FALSE),
(75, 2, TRUE), (75, 3, FALSE), (75, 17, FALSE),
(76, 1, TRUE), (76, 14, FALSE), (76, 19, FALSE),
(77, 14, TRUE), (77, 18, FALSE), (77, 19, FALSE),
(78, 1, TRUE), (78, 14, FALSE), (78, 16, FALSE),
(79, 1, TRUE), (79, 6, FALSE), (79, 19, FALSE),
(80, 1, TRUE), (80, 14, FALSE), (80, 3, FALSE),
(81, 2, TRUE), (81, 18, FALSE), (81, 14, FALSE),
(82, 13, TRUE), (82, 14, FALSE), (82, 19, FALSE),
(83, 13, TRUE), (83, 14, FALSE), (83, 19, FALSE),
(84, 8, TRUE), (84, 10, FALSE), (84, 14, FALSE),
(85, 13, TRUE), (85, 19, FALSE), (85, 20, FALSE),
(86, 14, TRUE), (86, 13, FALSE), (86, 8, FALSE),
(87, 14, TRUE), (87, 13, FALSE), (87, 19, FALSE),
(88, 2, TRUE), (88, 7, FALSE), (88, 20, FALSE),
(89, 14, TRUE), (89, 18, FALSE), (89, 2, FALSE),
(90, 14, TRUE), (90, 18, FALSE), (90, 19, FALSE),
(91, 13, TRUE), (91, 2, FALSE), (91, 3, FALSE),
(92, 2, TRUE), (92, 14, FALSE), (92, 8, FALSE),
(93, 2, TRUE), (93, 14, FALSE), (93, 3, FALSE),
(94, 13, TRUE), (94, 11, FALSE), (94, 2, FALSE),
(95, 2, TRUE), (95, 7, FALSE), (95, 20, FALSE),
(96, 14, TRUE), (96, 13, FALSE), (96, 15, FALSE),
(97, 13, TRUE), (97, 12, FALSE), (97, 19, FALSE),
(98, 7, TRUE), (98, 13, FALSE), (98, 20, FALSE),
(99, 13, TRUE), (99, 19, FALSE), (99, 14, FALSE),
(100, 14, TRUE), (100, 18, FALSE), (100, 19, FALSE);

-- 8. BOOK_AUTHORS (Liên kết đúng tác giả thực tế vào từng cuốn sách)
INSERT INTO book_authors (book_id, author_id, role, sort_order)
VALUES
(1, 1, 'author', 1),   -- The Great Gatsby -> F. Scott Fitzgerald
(2, 2, 'author', 1),   -- Pride and Prejudice -> Jane Austen
(3, 3, 'author', 1),   -- Don Quixote -> Miguel de Cervantes
(4, 4, 'author', 1),   -- Alice in Wonderland -> Lewis Carroll
(5, 5, 'author', 1),   -- Dracula -> Bram Stoker
(6, 6, 'author', 1),   -- Moby-Dick -> Herman Melville
(7, 7, 'author', 1),   -- Frankenstein -> Mary Shelley
(8, 8, 'author', 1),   -- Oliver Twist -> Charles Dickens
(9, 9, 'author', 1),   -- Jane Eyre -> Charlotte Brontë
(10, 10, 'author', 1), -- Wuthering Heights -> Emily Brontë
(11, 8, 'author', 1),  -- Great Expectations -> Charles Dickens
(12, 11, 'author', 1), -- The Picture of Dorian Gray -> Oscar Wilde
(13, 12, 'author', 1), -- The Time Machine -> H. G. Wells
(14, 12, 'author', 1), -- The War of the Worlds -> H. G. Wells
(15, 13, 'author', 1), -- Adventures of Huckleberry Finn -> Mark Twain
(16, 14, 'author', 1), -- The Jungle Book -> Rudyard Kipling
(17, 15, 'author', 1), -- The Wind in the Willows -> Kenneth Grahame
(18, 16, 'author', 1), -- Peter Pan -> J. M. Barrie
(19, 17, 'author', 1), -- Gulliver's Travels -> Jonathan Swift
(20, 18, 'author', 1), -- Grimm's Fairy Tales -> Brothers Grimm
(21, 8, 'author', 1),  -- A Tale of Two Cities -> Charles Dickens
(22, 19, 'author', 1), -- Les Misérables -> Victor Hugo
(23, 20, 'author', 1), -- Anna Karenina -> Leo Tolstoy
(24, 20, 'author', 1), -- War and Peace -> Leo Tolstoy
(25, 21, 'author', 1), -- Crime and Punishment -> Fyodor Dostoevsky
(26, 21, 'author', 1), -- The Brothers Karamazov -> Fyodor Dostoevsky
(27, 22, 'author', 1), -- Madame Bovary -> Gustave Flaubert
(28, 23, 'author', 1), -- Leaves of Grass -> Walt Whitman
(29, 24, 'author', 1), -- The Odyssey -> Homer
(30, 24, 'author', 1), -- Iliad -> Homer
(31, 25, 'author', 1), -- Divine Comedy -> Dante Alighieri
(32, 26, 'author', 1), -- Paradise Lost -> John Milton
(33, 27, 'author', 1), -- The Canterbury Tales -> Geoffrey Chaucer
(34, 28, 'author', 1), -- Hamlet -> William Shakespeare
(35, 28, 'author', 1), -- Macbeth -> William Shakespeare
(36, 28, 'author', 1), -- Romeo and Juliet -> William Shakespeare
(37, 28, 'author', 1), -- Othello -> William Shakespeare
(38, 28, 'author', 1), -- King Lear -> William Shakespeare
(39, 28, 'author', 1), -- A Midsummer Night's Dream -> William Shakespeare
(40, 28, 'author', 1), -- The Tempest -> William Shakespeare
(41, 29, 'author', 1), -- Treasure Island -> Robert Louis Stevenson
(42, 29, 'author', 1), -- Dr Jekyll and Mr Hyde -> Robert Louis Stevenson
(43, 30, 'author', 1), -- Robinson Crusoe -> Daniel Defoe
(44, 31, 'author', 1), -- Tom Jones -> Henry Fielding
(45, 32, 'author', 1), -- The Pilgrim's Progress -> John Bunyan
(46, 2, 'author', 1),  -- Sense and Sensibility -> Jane Austen
(47, 2, 'author', 1),  -- Emma -> Jane Austen
(48, 2, 'author', 1),  -- Persuasion -> Jane Austen
(49, 2, 'author', 1),  -- Northanger Abbey -> Jane Austen
(50, 2, 'author', 1),  -- Mansfield Park -> Jane Austen
(51, 33, 'author', 1), -- Số đỏ -> Vũ Trọng Phụng
(52, 34, 'author', 1), -- Chữ người tử tù -> Nguyễn Tuân
(53, 35, 'author', 1), -- Cho tôi xin một vé đi tuổi thơ -> Nguyễn Nhật Ánh
(54, 33, 'author', 1), -- Làm đĩ -> Vũ Trọng Phụng
(55, 37, 'author', 1), -- Mãi mãi tuổi hai mươi -> Nguyễn Văn Thạc
(56, 38, 'author', 1), -- Đắc nhân tâm -> Dale Carnegie
(57, 39, 'author', 1), -- Nhà giả kim -> Paulo Coelho
(58, 40, 'author', 1), -- Rừng Na Uy -> Haruki Murakami
(59, 41, 'author', 1), -- Súng, Vi trùng và Thép -> Jared Diamond
(60, 42, 'author', 1), -- Đời nhẹ khôn kham -> Milan Kundera
(61, 35, 'author', 1), -- Kính vạn hoa -> Nguyễn Nhật Ánh
(62, 43, 'author', 1), -- Bộ Năm trên đảo giấu vàng -> Enid Blyton
(63, 44, 'author', 1), -- Cánh buồm đỏ thắm -> Aleksandr Grin
(64, 45, 'author', 1), -- Cô thành trong gương -> Mizuki Tsujimura
(65, 46, 'author', 1), -- Chân Hoàn Truyện -> Lưu Liễm Tử
(66, 47, 'author', 1), -- Những cô gái nhỏ -> Louisa May Alcott
(67, 48, 'author', 1), -- Vầng trăng máu -> David Grann
(68, 49, 'author', 1), -- Tác phẩm âm nhạc Nguyễn Văn Quỳ -> Nguyễn Văn Quỳ
(69, 50, 'author', 1), -- Go-Tōbun no Hanayome -> Negi Haruba
(70, 51, 'author', 1), -- Kimi no Iru Machi -> Kouji Seo
(71, 52, 'author', 1), -- Last Game -> Shinobu Amano
(72, 53, 'author', 1), -- Spy × Family -> Tatsuya Endo
(73, 54, 'author', 1), -- Dandadan -> Yukinobu Tatsu
(74, 55, 'author', 1), -- Sakamoto Days -> Yuto Suzuki
(75, 56, 'author', 1), -- NDHARH -> Carolyn Keene
(76, 57, 'author', 1), -- Lục Vân Tiên -> Nguyễn Đình Chiểu
(77, 58, 'author', 1), -- Kinh Thánh (Bản tiếng Việt) -> Trịnh Văn Căn
(78, 59, 'author', 1), -- Tuổi thơ dữ dội -> Phùng Quán
(79, 60, 'author', 1), -- Thơ thơ (Xuân Diệu) -> Xuân Diệu
(80, 34, 'author', 1), -- Vang bóng một thời -> Nguyễn Tuân
(81, 28, 'author', 1), -- First Folio -> William Shakespeare
(82, 61, 'author', 1), -- Origin of Species -> Charles Darwin
(83, 62, 'author', 1), -- On Liberty -> John Stuart Mill
(84, 63, 'author', 1), -- The Wealth of Nations -> Adam Smith
(85, 64, 'author', 1), -- Critique of Pure Reason -> Immanuel Kant
(86, 65, 'author', 1), -- The Communist Manifesto -> Karl Marx
(86, 66, 'co_author', 2), -- The Communist Manifesto -> Friedrich Engels
(87, 67, 'author', 1), -- Leviathan -> Thomas Hobbes
(88, 68, 'author', 1), -- The Catcher in the Rye -> J. D. Salinger
(89, 69, 'author', 1), -- Beowulf -> Khuyết Danh Cổ Đại
(90, 70, 'author', 1), -- Gutenberg Bible -> Johannes Gutenberg
(91, 71, 'author', 1), -- 1984 -> George Orwell
(92, 71, 'author', 1), -- Animal Farm -> George Orwell
(93, 72, 'author', 1), -- Uncle Tom's Cabin -> Harriet Beecher Stowe
(94, 73, 'author', 1), -- Brave New World -> Aldous Huxley
(95, 74, 'author', 1), -- Candide -> Voltaire
(96, 75, 'author', 1), -- Utopia -> Thomas More
(97, 76, 'author', 1), -- Principia Mathematica -> Isaac Newton
(98, 77, 'author', 1), -- The Interpretation of Dreams -> Sigmund Freud
(99, 78, 'author', 1), -- Encyclopédie -> Denis Diderot
(100, 79, 'author', 1); -- Declaration of Independence -> Thomas Jefferson

-- 9. CARTS
INSERT INTO carts (id, user_id, book_id, quantity, added_at, updated_at)
VALUES
(1, 4, 3, 1, '2026-10-02 20:10:00', '2026-10-02 20:10:00'),
(2, 4, 17, 2, '2026-10-02 20:12:00', '2026-10-02 20:12:00'),
(3, 5, 28, 1, '2026-10-01 19:00:00', '2026-10-01 19:00:00'),
(4, 5, 44, 1, '2026-10-01 19:05:00', '2026-10-01 19:05:00');

-- 10. COUPONS
INSERT INTO coupons (id, code, name, description, discount_type, discount_value, max_discount, min_order_amount, usage_limit, used_count, per_user_limit, start_date, end_date, status, created_at, updated_at)
VALUES
(1, 'WELCOME10', 'Chào mừng khách hàng mới', 'Giảm 10% cho đơn đầu tiên', 'percent', 10, 50000, 200000, 100, 2, 1, '2026-09-01 00:00:00', '2026-12-31 23:59:59', 'active', '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(2, 'BOOK50K', 'Giảm 50.000đ', 'Giảm trực tiếp 50.000đ', 'fixed', 50000, NULL, 300000, 100, 1, 1, '2026-09-01 00:00:00', '2026-11-30 23:59:59', 'active', '2026-09-01 09:00:00', '2026-09-01 09:00:00'),
(3, 'SALE15', 'Ưu đãi tháng 10', 'Giảm 15% tối đa 100.000đ', 'percent', 15, 100000, 400000, 200, 0, 1, '2026-10-01 00:00:00', '2026-10-31 23:59:59', 'active', '2026-09-25 09:00:00', '2026-09-25 09:00:00'),
(4, 'OLD20', 'Khuyến mãi cũ', 'Mã đã hết hạn', 'percent', 20, 100000, 200000, 50, 0, 1, '2026-06-01 00:00:00', '2026-07-31 23:59:59', 'expired', '2026-06-01 09:00:00', '2026-08-01 09:00:00');

-- 11. ORDERS
INSERT INTO orders (id, order_code, user_id, address_id, shipping_address, subtotal, discount_amount, coupon_id, shipping_fee, total_amount, payment_method, payment_status, order_status, note, created_at, updated_at)
VALUES
(1, 'ORD2026090001', 4, 1, 'Hà Nội, Cầu Giấy, Dịch Vọng, 12 Trần Thái Tông', 1118000, 0, NULL, 0, 1118000, 'banking', 'paid', 'delivered', NULL, '2026-09-11 11:20:00', '2026-09-11 11:20:00'),
(2, 'ORD2026090002', 5, 3, 'Hà Nội, Đống Đa, Láng Thượng, 88 Chùa Láng', 1275000, 0, NULL, 0, 1275000, 'momo', 'paid', 'delivered', NULL, '2026-09-12 12:20:00', '2026-09-12 12:20:00'),
(3, 'ORD2026090003', 4, 1, 'Hà Nội, Cầu Giấy, Dịch Vọng, 12 Trần Thái Tông', 255000, 25500, 1, 30000, 259500, 'vnpay', 'paid', 'delivered', 'Giao giờ hành chính', '2026-09-13 13:20:00', '2026-09-13 13:20:00'),
(4, 'ORD2026090004', 5, 3, 'Hà Nội, Đống Đa, Láng Thượng, 88 Chùa Láng', 863000, 0, NULL, 0, 863000, 'cod', 'pending', 'confirmed', NULL, '2026-09-14 14:20:00', '2026-09-14 14:20:00'),
(5, 'ORD2026090005', 4, 1, 'Hà Nội, Cầu Giấy, Dịch Vọng, 12 Trần Thái Tông', 485000, 50000, 2, 0, 435000, 'banking', 'refunded', 'cancelled', NULL, '2026-09-15 15:20:00', '2026-09-15 15:20:00'),
(6, 'ORD2026090006', 5, 3, 'Hà Nội, Đống Đa, Láng Thượng, 88 Chùa Láng', 579000, 0, NULL, 0, 579000, 'momo', 'paid', 'delivered', 'Giao giờ hành chính', '2026-09-16 16:20:00', '2026-09-16 16:20:00'),
(7, 'ORD2026090007', 4, 1, 'Hà Nội, Cầu Giấy, Dịch Vọng, 12 Trần Thái Tông', 1166000, 50000, 1, 0, 1116000, 'vnpay', 'paid', 'delivered', NULL, '2026-09-17 17:20:00', '2026-09-17 17:20:00'),
(8, 'ORD2026090008', 5, 3, 'Hà Nội, Đống Đa, Láng Thượng, 88 Chùa Láng', 695000, 0, NULL, 0, 695000, 'cod', 'pending', 'shipping', NULL, '2026-09-18 18:20:00', '2026-09-18 18:20:00'),
(9, 'ORD2026090009', 4, 1, 'Hà Nội, Cầu Giấy, Dịch Vọng, 12 Trần Thái Tông', 425000, 0, NULL, 0, 425000, 'banking', 'paid', 'confirmed', 'Giao giờ hành chính', '2026-09-19 19:20:00', '2026-09-19 19:20:00'),
(10, 'ORD2026090010', 5, 3, 'Hà Nội, Đống Đa, Láng Thượng, 88 Chùa Láng', 475000, 0, NULL, 0, 475000, 'momo', 'refunded', 'cancelled', NULL, '2026-09-20 10:20:00', '2026-09-20 10:20:00');

-- 12. ORDER_ITEMS
INSERT INTO order_items (order_id, book_id, quantity, unit_price, discount, subtotal)
VALUES
(1, 9, 2, 203000, 0, 406000),
(1, 18, 2, 356000, 0, 712000),
(2, 18, 3, 356000, 0, 1068000),
(2, 31, 1, 207000, 0, 207000),
(3, 27, 1, 139000, 0, 139000),
(3, 44, 2, 58000, 0, 116000),
(4, 36, 2, 292000, 0, 584000),
(4, 57, 1, 279000, 0, 279000),
(5, 45, 3, 75000, 0, 225000),
(5, 70, 2, 130000, 0, 260000),
(6, 54, 1, 228000, 0, 228000),
(6, 83, 1, 351000, 0, 351000),
(7, 63, 2, 381000, 0, 762000),
(7, 96, 2, 202000, 0, 404000),
(8, 72, 3, 164000, 0, 492000),
(8, 9, 1, 203000, 0, 203000),
(9, 81, 1, 317000, 0, 317000),
(9, 22, 2, 54000, 0, 108000),
(10, 90, 2, 100000, 0, 200000),
(10, 35, 1, 275000, 0, 275000);

-- 13. PAYMENTS
INSERT INTO payments (id, order_id, method, qr_data, qr_code_url, qr_expired_at, bank_code, account_number, amount, transaction_code, status, paid_at, note, created_at, updated_at)
VALUES
(1, 1, 'banking', 'BOOKSTORE|ORD2026090001|1118000|VCB|1234567890', '/qr/ORD2026090001.png', '2026-09-11 12:20:00', 'VCB', '1234567890', 1118000, 'TXN2026090001', 'success', '2026-09-11 11:25:00', NULL, '2026-09-11 11:20:00', '2026-09-11 11:20:00'),
(2, 2, 'momo', 'BOOKSTORE|ORD2026090002|1275000|MOMO|0987654321', '/qr/ORD2026090002.png', '2026-09-12 13:20:00', 'MOMO', '0987654321', 1275000, 'TXN2026090002', 'success', '2026-09-12 12:25:00', NULL, '2026-09-12 12:20:00', '2026-09-12 12:20:00'),
(3, 3, 'vnpay', 'BOOKSTORE|ORD2026090003|259500|VNPAY|1122334455', '/qr/ORD2026090003.png', '2026-09-13 14:20:00', 'VNPAY', '1122334455', 259500, 'TXN2026090003', 'success', '2026-09-13 13:25:00', NULL, '2026-09-13 13:20:00', '2026-09-13 13:20:00'),
(4, 4, 'cod', NULL, NULL, NULL, NULL, NULL, 863000, NULL, 'pending', NULL, 'Thu tiền khi giao hàng', '2026-09-14 14:20:00', '2026-09-14 14:20:00'),
(5, 5, 'banking', 'BOOKSTORE|ORD2026090005|435000|VCB|1234567890', '/qr/ORD2026090005.png', '2026-09-15 16:20:00', 'VCB', '1234567890', 435000, 'TXN2026090005', 'refunded', NULL, NULL, '2026-09-15 15:20:00', '2026-09-15 15:20:00'),
(6, 6, 'momo', 'BOOKSTORE|ORD2026090006|579000|MOMO|0987654321', '/qr/ORD2026090006.png', '2026-09-16 17:20:00', 'MOMO', '0987654321', 579000, 'TXN2026090006', 'success', '2026-09-16 16:25:00', NULL, '2026-09-16 16:20:00', '2026-09-16 16:20:00'),
(7, 7, 'vnpay', 'BOOKSTORE|ORD2026090007|1116000|VNPAY|1122334455', '/qr/ORD2026090007.png', '2026-09-17 18:20:00', 'VNPAY', '1122334455', 1116000, 'TXN2026090007', 'success', '2026-09-17 17:25:00', NULL, '2026-09-17 17:20:00', '2026-09-17 17:20:00'),
(8, 8, 'cod', NULL, NULL, NULL, NULL, NULL, 695000, NULL, 'pending', NULL, 'Thu tiền khi giao hàng', '2026-09-18 18:20:00', '2026-09-18 18:20:00'),
(9, 9, 'banking', 'BOOKSTORE|ORD2026090009|425000|VCB|1234567890', '/qr/ORD2026090009.png', '2026-09-19 20:20:00', 'VCB', '1234567890', 425000, 'TXN2026090009', 'success', '2026-09-19 19:25:00', NULL, '2026-09-19 19:20:00', '2026-09-19 19:20:00'),
(10, 10, 'momo', 'BOOKSTORE|ORD2026090010|475000|MOMO|0987654321', '/qr/ORD2026090010.png', '2026-09-20 11:20:00', 'MOMO', '0987654321', 475000, 'TXN2026090010', 'refunded', NULL, NULL, '2026-09-20 10:20:00', '2026-09-20 10:20:00');

-- 13. REVIEWS
INSERT INTO reviews (id, book_id, user_id, order_id, rating, comment, status, created_at, updated_at)
VALUES
(1, 9, 4, 1, 4, 'Sách hữu ích và trình bày đẹp.', 'approved', '2026-09-25 18:00:00', '2026-09-25 18:00:00'),
(2, 18, 4, 1, 4, 'Chất lượng sách tốt.', 'approved', '2026-09-25 18:00:00', '2026-09-25 18:00:00'),
(3, 18, 5, 2, 4, 'Đúng mô tả, sẽ mua thêm.', 'approved', '2026-09-25 18:00:00', '2026-09-25 18:00:00'),
(4, 31, 5, 2, 5, 'Sách hữu ích và trình bày đẹp.', 'approved', '2026-09-25 18:00:00', '2026-09-25 18:00:00'),
(5, 27, 4, 3, 4, 'Sách hữu ích và trình bày đẹp.', 'approved', '2026-09-25 18:00:00', '2026-09-25 18:00:00'),
(6, 44, 4, 3, 5, 'Sách hữu ích và trình bày đẹp.', 'approved', '2026-09-25 18:00:00', '2026-09-25 18:00:00'),
(7, 54, 5, 6, 4, 'Nội dung hay, giao hàng nhanh.', 'approved', '2026-09-25 18:00:00', '2026-09-25 18:00:00'),
(8, 83, 5, 6, 5, 'Nội dung hay, giao hàng nhanh.', 'approved', '2026-09-25 18:00:00', '2026-09-25 18:00:00'),
(9, 63, 4, 7, 4, 'Chất lượng sách tốt.', 'approved', '2026-09-25 18:00:00', '2026-09-25 18:00:00'),
(10, 96, 4, 7, 5, 'Chất lượng sách tốt.', 'approved', '2026-09-25 18:00:00', '2026-09-25 18:00:00');

-- 14. USER_FAVORITE_CATEGORIES
INSERT INTO user_favorite_categories (id, user_id, category_id, sort_order, created_at)
VALUES
(1, 4, 1, 1, '2026-09-20 10:00:00'),
(2, 4, 3, 2, '2026-09-20 10:00:00'),
(3, 4, 6, 3, '2026-09-20 10:00:00'),
(4, 4, 11, 4, '2026-09-20 10:00:00'),
(5, 4, 12, 5, '2026-09-20 10:00:00'),
(6, 5, 2, 1, '2026-09-20 10:00:00'),
(7, 5, 4, 2, '2026-09-20 10:00:00'),
(8, 5, 7, 3, '2026-09-20 10:00:00'),
(9, 5, 14, 4, '2026-09-20 10:00:00'),
(10, 5, 16, 5, '2026-09-20 10:00:00');

-- 15. REFRESH_TOKENS
INSERT INTO refresh_tokens (user_id, token, device_info, ip_address, expired_at, revoked, created_at)
VALUES
(1, 'sample_refresh_token_admin_001', 'Chrome - Windows', '127.0.0.1', '2026-12-31 23:59:59', FALSE, '2026-10-03 08:20:00'),
(2, 'sample_refresh_token_staff01_001', 'Firefox - Windows', '127.0.0.1', '2026-12-31 23:59:59', FALSE, '2026-10-03 08:05:00'),
(4, 'sample_refresh_token_user01_001', 'Safari - iPhone', '127.0.0.1', '2026-12-31 23:59:59', FALSE, '2026-10-02 21:30:00');

-- 16. PASSWORD_RESET_TOKENS
INSERT INTO password_reset_tokens (user_id, token, expired_at, used, created_at)
VALUES
(4, 'reset_token_user01_demo', '2026-10-10 23:59:59', FALSE, '2026-10-03 09:00:00');

-- 17. SEARCH_HISTORY
INSERT INTO search_history (user_id, keyword, result_count, created_at)
VALUES
(4, 'tiểu thuyết', 45, '2026-10-01 20:00:00'),
(4, 'lập trình java', 12, '2026-10-02 09:00:00'),
(4, 'sách kinh doanh', 30, '2026-10-02 15:00:00'),
(5, 'trinh thám', 25, '2026-10-01 19:30:00'),
(5, 'thiếu nhi', 18, '2026-10-02 10:00:00'),
(NULL, 'sách mới', 100, '2026-10-03 07:00:00');

-- =============================================
-- PHẦN 3: VERIFY
-- =============================================
SELECT 'users' AS tbl, COUNT(*) AS cnt FROM users UNION ALL
SELECT 'addresses', COUNT(*) FROM addresses UNION ALL
SELECT 'categories', COUNT(*) FROM categories UNION ALL
SELECT 'authors', COUNT(*) FROM authors UNION ALL
SELECT 'publishers', COUNT(*) FROM publishers UNION ALL
SELECT 'books', COUNT(*) FROM books UNION ALL
SELECT 'book_categories', COUNT(*) FROM book_categories UNION ALL
SELECT 'book_authors', COUNT(*) FROM book_authors UNION ALL
SELECT 'carts', COUNT(*) FROM carts UNION ALL
SELECT 'coupons', COUNT(*) FROM coupons UNION ALL
SELECT 'orders', COUNT(*) FROM orders UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items UNION ALL
SELECT 'payments', COUNT(*) FROM payments UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews UNION ALL
SELECT 'user_favorite_categories', COUNT(*) FROM user_favorite_categories UNION ALL
SELECT 'refresh_tokens', COUNT(*) FROM refresh_tokens UNION ALL
SELECT 'password_reset_tokens', COUNT(*) FROM password_reset_tokens UNION ALL
SELECT 'search_history', COUNT(*) FROM search_history;

-- Kiểm tra tính toàn vẹn (tất cả các query sau phải trả về 0 dòng rỗng)
SELECT book_id, COUNT(*) AS cnt FROM book_categories GROUP BY book_id HAVING cnt <> 3;
SELECT book_id, SUM(is_primary) AS primary_cnt FROM book_categories GROUP BY book_id HAVING primary_cnt <> 1;
SELECT b.id, COUNT(ba.author_id) AS author_cnt FROM books b LEFT JOIN book_authors ba ON ba.book_id = b.id GROUP BY b.id HAVING author_cnt < 1;
SELECT o.id, o.subtotal, SUM(oi.subtotal) AS items_total FROM orders o JOIN order_items oi ON oi.order_id = o.id GROUP BY o.id, o.subtotal HAVING o.subtotal <> items_total;

