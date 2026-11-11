# BOOKSTORE API - PHIÊN BẢN HOÀN THIỆN MAIN 6 (TỔNG HỢP MAIN 4 & MAIN 5)

Dự án **`bookstore-api-main6`** được tạo tự động bằng cách kết hợp toàn bộ những điểm mạnh vượt trội của 2 phiên bản `bookstore-api-main4` và `bookstore-api-main5`:

---

## 🌟 CÁC TÍNH NĂNG ĐƯỢC TÍCH HỢP TOÀN DIỆN

### 1. Từ Phiên bản Main 4:
- **Cây thể loại phân cấp hoàn chỉnh (Category Tree View)**:
  - Cấu trúc cha - con (`parent_id`) trong entity `Category`.
  - API `GET /api/categories/tree` dựng cây phân cấp với khả năng chống gán cha lặp vòng (`parentId.equals(id)`).
  - Giao diện Admin hỗ trợ xem dạng cây, thêm nhánh con trực tiếp trên từng hàng danh mục, mở rộng / thu gọn nhánh.
- **Hệ thống Báo cáo Doanh thu & Xuất file chuyên nghiệp**:
  - `AdminReportController` + `ReportService` lọc doanh thu theo khoảng thời gian.
  - Xuất file **Excel (.xlsx)** qua thư viện Apache POI (`poi-ooxml 5.2.5`).
  - Xuất file **PDF (.pdf)** qua thư viện OpenPDF (`openpdf 1.3.39`).
  - Giao diện Admin có tab Báo cáo doanh thu với các nút bấm tải file trực tiếp.
- **Bộ Kiểm Thử Tự Động Hóa E2E (`test_suite.js`)**:
  - Kịch bản kiểm thử toàn diện toàn bộ các chức năng từ giao diện đến API.
- **Tập hợp file ảnh bìa sách cục bộ**:
  - Thư mục `frontend/images/covers/` đầy đủ ảnh minh họa sách.

### 2. Từ Phiên bản Main 5:
- **Hệ thống Bảo mật Xác thực nâng cao (JWT Refresh Token Rotation)**:
  - Access Token sống ngắn (15 phút), Refresh Token (30 ngày) được mã hóa băm SHA-256 lưu an toàn trong CSDL (`RefreshToken` entity).
  - Tự động gia hạn ngầm (Axios Response Interceptor): khi Access Token hết hạn (HTTP 401), client tự động gọi `/api/auth/refresh` lấy token mới và thực hiện lại request cũ trong suốt với người dùng.
- **Xác thực Captcha chuẩn Server-side**:
  - `CaptchaService` sinh ảnh captcha Base64 phía backend.
  - `CaptchaAspect` (Spring AOP) chặn và kiểm tra `X-Captcha-Id` và `X-Captcha-Code` trước khi vào Controller cho Đăng ký, Đăng nhập, Quên mật khẩu.
- **Gửi Email khôi phục mật khẩu**:
  - Tích hợp `MailService`: khi quên mật khẩu, mã OTP 10 ký tự (hạn 1 giờ, dùng 1 lần) được gửi tới email người dùng (che email `m***l@domain.com`) hoặc ghi log nếu chưa cấu hình SMTP.
- **Đăng xuất Đa thiết bị**:
  - API `/api/auth/logout` và `/api/auth/logout-all`.
  - Nút bấm *"Đăng Xuất Khỏi Tất Cả Thiết Bị"* trên trang Profile. Tự động đăng xuất mọi nơi khi đổi mật khẩu.
- **Thanh toán QR thông minh & Trạng thái `CLAIMED`**:
  - Khi khách nhấn *"Tôi đã chuyển khoản"* mà ngân hàng chưa có tiền, phiên chuyển sang `CLAIMED` (không bị tự hủy sau 10 phút, tự xác nhận khi tiền về muộn).
  - Admin có chức năng xác nhận thanh toán thủ công (`/admin/sessions/{id}/confirm`) hoặc từ chối đơn (`/admin/sessions/{id}/reject`).
- **Quy trình Đơn hàng & Hoàn tiền chặt chẽ**:
  - Chặn khách tự hủy đơn đã thanh toán.
  - Quy trình chờ hoàn tiền `REFUND_PENDING` -> Admin xác nhận đã hoàn tiền `REFUNDED` (`/admin/orders/{id}/refunded`).
  - Kiểm tra ràng buộc mã giảm giá: kiểm tra mã đơn đầu tiên (`firstOrderOnly`), chặn dùng lại mã, hoàn lại lượt dùng khi hủy đơn (`restoreCoupon`).
- **Quản lý Đánh giá Sách (Reviews)**:
  - Cho phép người dùng trực tiếp **Sửa** và **Xóa** đánh giá do chính mình viết trên giao diện chi tiết sách.
- **Xóa sách an toàn**:
  - Chặn xóa sách nếu đã có trong đơn hàng, tự dọn dẹp danh sách yêu thích (Wishlist).

---

## 🚀 HƯỚNG DẪN KHỞI CHẠY DỰ ÁN

### 1. Chuẩn bị Cơ sở dữ liệu:
- Mở XAMPP / MySQL Server trên cổng `3306`.
- Import file SQL hoàn chỉnh: `bookstore.sql` vào database `bookstore`.
*(Mật khẩu database mặc định là `Kieu3110@` hoặc có thể đặt biến môi trường `SPRING_DATASOURCE_PASSWORD` theo máy của bạn).*

### 2. Khởi chạy Backend (Spring Boot):
Mở terminal trong thư mục `bookstore-api-main6` và chạy:
```powershell
.\mvnw.cmd spring-boot:run
```
Backend sẽ khởi động tại: **`http://localhost:8080`**

### 3. Khởi chạy Frontend (Giao diện Web):
Chạy file batch có sẵn:
```powershell
.\start-web.bat
```
Hoặc chạy lệnh Node.js:
```powershell
node frontend\server.js
```
Trình duyệt sẽ tự động mở giao diện tại: **`http://localhost:3000`**

### 4. Chạy Kiểm thử Đơn vị (Unit Tests):
Chạy lệnh kiểm thử tự động toàn bộ 31 test cases (H2 in-memory DB):
```powershell
.\mvnw.cmd test
```
*Kết quả: 31/31 test cases PASS (100% BUILD SUCCESS).*
