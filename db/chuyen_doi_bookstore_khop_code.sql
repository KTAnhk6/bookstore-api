-- =====================================================================
-- Chuyển database tạo từ bookstore.sql sang đúng cấu trúc mà code Java (entity JPA) dùng.
-- Giữ nguyên toàn bộ dữ liệu (sách, tác giả, user, đơn hàng...), chỉ đổi:
--   * enum chữ thường -> CHỮ HOA (Java dùng @Enumerated(EnumType.STRING))
--   * đổi tên cột lệch với entity (order_status -> status, unit_price -> price, note -> notes...)
--   * đổi giá trị lệch nghĩa (percent -> PERCENTAGE, paid -> SUCCESS, status 'active' -> active = 1)
--   * bảng carts -> cart_items
--   * nới NOT NULL / độ dài cột cho khớp entity để INSERT từ Java không lỗi
-- Các bảng mới (payment_sessions, bank_transactions) do Hibernate tự tạo khi chạy app.
--
-- Cách chạy (CHỈ CHẠY 1 LẦN, nhớ sao lưu trước):
--   C:\xampp\mysql\bin\mysqldump.exe -uroot --databases bookstore > bookstore_backup.sql
--   C:\xampp\mysql\bin\mysql.exe -uroot bookstore < db\chuyen_doi_bookstore_khop_code.sql
-- =====================================================================

SET NAMES utf8mb4;

-- ---------- users ----------
ALTER TABLE `users`
  MODIFY COLUMN `gender` VARCHAR(16) NULL DEFAULT NULL,
  MODIFY COLUMN `role` VARCHAR(16) NOT NULL DEFAULT 'customer',
  MODIFY COLUMN `status` VARCHAR(16) NULL DEFAULT 'active';
UPDATE `users` SET `gender` = UPPER(`gender`), `role` = UPPER(`role`), `status` = UPPER(`status`);
ALTER TABLE `users`
  MODIFY COLUMN `gender` ENUM('FEMALE','MALE','OTHER') NULL DEFAULT NULL,
  MODIFY COLUMN `role` ENUM('ADMIN','CUSTOMER','STAFF') NOT NULL DEFAULT 'CUSTOMER',
  MODIFY COLUMN `status` ENUM('ACTIVE','BANNED','INACTIVE') NULL DEFAULT 'ACTIVE';

-- ---------- books / book_authors ----------
ALTER TABLE `books` MODIFY COLUMN `status` VARCHAR(16) NOT NULL DEFAULT 'available';
UPDATE `books` SET `status` = UPPER(`status`);
ALTER TABLE `books` MODIFY COLUMN `status` ENUM('AVAILABLE','DISCONTINUED','OUT_OF_STOCK') NOT NULL DEFAULT 'AVAILABLE';

ALTER TABLE `book_authors` MODIFY COLUMN `role` VARCHAR(16) NOT NULL DEFAULT 'author';
UPDATE `book_authors` SET `role` = UPPER(`role`);
ALTER TABLE `book_authors` MODIFY COLUMN `role` ENUM('AUTHOR','CO_AUTHOR','EDITOR','TRANSLATOR') NOT NULL DEFAULT 'AUTHOR';

-- ---------- addresses: receiver_* -> recipient_*, detail -> detail_address ----------
ALTER TABLE `addresses`
  CHANGE COLUMN `receiver_name` `recipient_name` VARCHAR(100) NOT NULL,
  CHANGE COLUMN `receiver_phone` `phone` VARCHAR(20) NOT NULL,
  CHANGE COLUMN `detail` `detail_address` VARCHAR(255) NOT NULL,
  ADD COLUMN `address_type` ENUM('HOME','OFFICE','OTHER') NULL DEFAULT 'HOME';

-- ---------- categories: sort_order -> display_order, status -> active ----------
ALTER TABLE `categories`
  CHANGE COLUMN `sort_order` `display_order` INT(11) NULL DEFAULT 0,
  ADD COLUMN `active` BIT(1) NOT NULL DEFAULT b'1';
UPDATE `categories` SET `active` = (`status` = 'active');
ALTER TABLE `categories` DROP COLUMN `status`;

-- ---------- coupons: max_discount -> max_discount_amount, status -> active, percent/fixed ----------
ALTER TABLE `coupons`
  CHANGE COLUMN `max_discount` `max_discount_amount` DECIMAL(12,2) NULL DEFAULT NULL,
  ADD COLUMN `active` BIT(1) NOT NULL DEFAULT b'1',
  MODIFY COLUMN `discount_type` VARCHAR(16) NOT NULL DEFAULT 'percent';
UPDATE `coupons` SET `active` = (`status` = 'active'),
  `discount_type` = CASE `discount_type` WHEN 'percent' THEN 'PERCENTAGE' WHEN 'fixed' THEN 'FIXED_AMOUNT' ELSE UPPER(`discount_type`) END;
ALTER TABLE `coupons`
  MODIFY COLUMN `discount_type` ENUM('FIXED_AMOUNT','PERCENTAGE') NOT NULL DEFAULT 'PERCENTAGE',
  DROP COLUMN `status`;

-- ---------- orders: order_status -> status, paid -> SUCCESS, thêm QR_CODE ----------
ALTER TABLE `orders`
  CHANGE COLUMN `order_status` `status` VARCHAR(16) NOT NULL DEFAULT 'pending',
  MODIFY COLUMN `payment_status` VARCHAR(16) NOT NULL DEFAULT 'pending',
  MODIFY COLUMN `payment_method` VARCHAR(16) NOT NULL DEFAULT 'cod';
UPDATE `orders` SET `status` = UPPER(`status`), `payment_method` = UPPER(`payment_method`),
  `payment_status` = CASE `payment_status` WHEN 'paid' THEN 'SUCCESS' ELSE UPPER(`payment_status`) END;
ALTER TABLE `orders`
  MODIFY COLUMN `status` ENUM('CANCELLED','CONFIRMED','DELIVERED','PENDING','PROCESSING','RETURNED','SHIPPING') NOT NULL DEFAULT 'PENDING',
  MODIFY COLUMN `payment_status` ENUM('FAILED','PENDING','REFUNDED','SUCCESS') NOT NULL DEFAULT 'PENDING',
  MODIFY COLUMN `payment_method` ENUM('BANKING','COD','MOMO','QR_CODE','STRIPE','VNPAY') NOT NULL DEFAULT 'COD';

-- ---------- order_items: unit_price -> price, thêm tên/ảnh sách tại thời điểm mua ----------
ALTER TABLE `order_items`
  CHANGE COLUMN `unit_price` `price` DECIMAL(12,2) NOT NULL,
  ADD COLUMN `book_title` VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN `book_cover_image` VARCHAR(500) NULL DEFAULT NULL;
UPDATE `order_items` oi JOIN `books` b ON b.id = oi.book_id
  SET oi.book_title = b.title, oi.book_cover_image = b.cover_image;
ALTER TABLE `order_items` MODIFY COLUMN `book_title` VARCHAR(255) NOT NULL;

-- ---------- payments: note -> notes, enum chữ hoa, thêm QR_CODE ----------
ALTER TABLE `payments`
  CHANGE COLUMN `note` `notes` TEXT NULL DEFAULT NULL,
  MODIFY COLUMN `method` VARCHAR(16) NOT NULL DEFAULT 'cod',
  MODIFY COLUMN `status` VARCHAR(16) NOT NULL DEFAULT 'pending';
UPDATE `payments` SET `method` = UPPER(`method`), `status` = UPPER(`status`);
ALTER TABLE `payments`
  MODIFY COLUMN `method` ENUM('BANKING','COD','MOMO','QR_CODE','STRIPE','VNPAY') NOT NULL DEFAULT 'COD',
  MODIFY COLUMN `status` ENUM('FAILED','PENDING','REFUNDED','SUCCESS') NOT NULL DEFAULT 'PENDING';

-- ---------- carts -> cart_items ----------
RENAME TABLE `carts` TO `cart_items`;
ALTER TABLE `cart_items` CHANGE COLUMN `added_at` `created_at` DATETIME NULL DEFAULT current_timestamp();

-- ---------- Nới NOT NULL / độ dài cho khớp entity (dữ liệu không đổi) ----------
ALTER TABLE `addresses`
  MODIFY COLUMN `created_at` datetime NULL DEFAULT current_timestamp(),
  MODIFY COLUMN `updated_at` datetime NULL DEFAULT current_timestamp() ON UPDATE CURRENT_TIMESTAMP();

ALTER TABLE `authors`
  MODIFY COLUMN `nationality` varchar(255) NULL DEFAULT NULL,
  MODIFY COLUMN `created_at` datetime NULL DEFAULT current_timestamp(),
  MODIFY COLUMN `updated_at` datetime NULL DEFAULT current_timestamp() ON UPDATE CURRENT_TIMESTAMP();

ALTER TABLE `book_authors`
  MODIFY COLUMN `created_at` datetime NULL DEFAULT current_timestamp();

ALTER TABLE `books`
  MODIFY COLUMN `isbn` varchar(50) NULL DEFAULT NULL,
  MODIFY COLUMN `description` longtext NULL DEFAULT NULL,
  MODIFY COLUMN `cover_image` varchar(500) NULL DEFAULT NULL,
  MODIFY COLUMN `sold_quantity` int(11) NULL DEFAULT 0,
  MODIFY COLUMN `created_at` datetime NULL DEFAULT current_timestamp(),
  MODIFY COLUMN `updated_at` datetime NULL DEFAULT current_timestamp() ON UPDATE CURRENT_TIMESTAMP();

ALTER TABLE `cart_items`
  MODIFY COLUMN `updated_at` datetime NULL DEFAULT current_timestamp() ON UPDATE CURRENT_TIMESTAMP();

ALTER TABLE `categories`
  MODIFY COLUMN `created_at` datetime NULL DEFAULT current_timestamp(),
  MODIFY COLUMN `updated_at` datetime NULL DEFAULT current_timestamp() ON UPDATE CURRENT_TIMESTAMP();

ALTER TABLE `coupons`
  MODIFY COLUMN `min_order_amount` decimal(12,2) NULL DEFAULT 0.00,
  MODIFY COLUMN `used_count` int(11) NULL DEFAULT 0,
  MODIFY COLUMN `start_date` datetime NULL DEFAULT NULL,
  MODIFY COLUMN `end_date` datetime NULL DEFAULT NULL,
  MODIFY COLUMN `created_at` datetime NULL DEFAULT current_timestamp(),
  MODIFY COLUMN `updated_at` datetime NULL DEFAULT current_timestamp() ON UPDATE CURRENT_TIMESTAMP();

ALTER TABLE `orders`
  MODIFY COLUMN `order_code` varchar(64) NOT NULL,
  MODIFY COLUMN `created_at` datetime NULL DEFAULT current_timestamp(),
  MODIFY COLUMN `updated_at` datetime NULL DEFAULT current_timestamp() ON UPDATE CURRENT_TIMESTAMP();

ALTER TABLE `password_reset_tokens`
  MODIFY COLUMN `created_at` datetime NULL DEFAULT current_timestamp();

ALTER TABLE `payments`
  MODIFY COLUMN `created_at` datetime NULL DEFAULT current_timestamp(),
  MODIFY COLUMN `updated_at` datetime NULL DEFAULT current_timestamp() ON UPDATE CURRENT_TIMESTAMP();

ALTER TABLE `publishers`
  MODIFY COLUMN `phone` varchar(255) NULL DEFAULT NULL,
  MODIFY COLUMN `email` varchar(255) NULL DEFAULT NULL,
  MODIFY COLUMN `website` varchar(255) NULL DEFAULT NULL,
  MODIFY COLUMN `created_at` datetime NULL DEFAULT current_timestamp(),
  MODIFY COLUMN `updated_at` datetime NULL DEFAULT current_timestamp() ON UPDATE CURRENT_TIMESTAMP();

ALTER TABLE `refresh_tokens`
  MODIFY COLUMN `created_at` datetime NULL DEFAULT current_timestamp();

ALTER TABLE `reviews`
  MODIFY COLUMN `created_at` datetime NULL DEFAULT current_timestamp(),
  MODIFY COLUMN `updated_at` datetime NULL DEFAULT current_timestamp() ON UPDATE CURRENT_TIMESTAMP();

ALTER TABLE `search_history`
  MODIFY COLUMN `created_at` datetime NULL DEFAULT current_timestamp();

ALTER TABLE `user_favorite_categories`
  MODIFY COLUMN `created_at` datetime NULL DEFAULT current_timestamp();

ALTER TABLE `users`
  MODIFY COLUMN `loyalty_points` int(11) NULL DEFAULT 0,
  MODIFY COLUMN `has_set_preferences` tinyint(1) NULL DEFAULT 0,
  MODIFY COLUMN `created_at` datetime NULL DEFAULT current_timestamp(),
  MODIFY COLUMN `updated_at` datetime NULL DEFAULT current_timestamp() ON UPDATE CURRENT_TIMESTAMP();
