# BookNest - Hệ Thống Giao Diện Web Bookstore Hiện Đại & Quản Trị Tri Thức

Dự án giao diện người dùng hoàn chỉnh đáp ứng 100% các yêu cầu chức năng và kỹ thuật trong đề bài.

---

## 🌟 1. Danh Sách Chức Năng Đã Triển Khai

### A. Giao Diện Khách Hàng (Customer Portal - Quang)
1. **Popup Chọn 5 Thể Loại Yêu Thích (Favorite Genres Onboarding):**
   - Modal hiển thị trực quan các danh mục sách với icon, bộ đếm `0/5` và thanh tiến độ tương tác.
   - Cho phép chọn/bỏ chọn, giới hạn chuẩn 5 thể loại, lưu sở thích vào hồ sơ người dùng để kích hoạt bộ máy gợi ý AI.
2. **Trang Chủ (Home Page):**
   - **Hero Banner Slider:** Carousel tự động chuyển slide và nút bấm mượt mà, quảng bá các cuốn sách nổi bật.
   - **Sách Đề Xuất (Recommended For You):** Cá nhân hóa tự động theo 5 thể loại sở thích của độc giả.
   - **Sách Mới Phát Hành (New Arrivals):** Nhãn badge `MỚI`, cập nhật các tác phẩm mới nhất.
   - **Sách Bán Chạy Nhất (Bestsellers):** Nhãn thứ hạng `TOP #1`, số lượng đã bán, đánh giá sao.
   - **Flash Sale Giờ Vàng:** Đồng hồ đếm ngược thời gian thực (Countdown Timer).
   - **Danh Mục Nhanh (Quick Category Pills):** Chuyển nhanh giữa các chủ đề sách.
3. **Danh Mục Sách & Tìm Kiếm / Lọc Đa Tiêu Chí (Catalog / Search / Faceted Filter):**
   - Tìm kiếm thời gian thực (Live Search Debounce) với gợi ý dropdown tức thì.
   - Bộ lọc đa chiều: Theo Thể loại, Tác giả, Nhà xuất bản, Khoảng giá, Đánh giá sao.
   - Thanh công cụ hiển thị số lượng kết quả, gỡ chip lọc nhanh, sắp xếp (Bán chạy, Mới nhất, Giá tăng/giảm, Đánh giá).
4. **Chi Tiết Sách (Book Details):**
   - Gallery ảnh bìa lớn + danh sách thumbnail xem nhiều góc.
   - Thông số chi tiết: Tác giả, NXB, Năm XB, Số trang, Ngôn ngữ, Định dạng, ISBN.
   - Bộ chọn số lượng mua `+ -`, nút **"Thêm vào giỏ hàng"** và **"Mua ngay"**.
   - Tabs chuyển đổi: Mô tả tóm tắt, Thông số kỹ thuật, Đánh giá độc giả.
   - Form viết đánh giá tương tác với chấm điểm sao (1 - 5 sao).
   - Danh sách Sách liên quan cùng chủ đề/tác giả.
5. **Giỏ Hàng (Shopping Cart):**
   - Bảng sản phẩm, điều chỉnh số lượng, xoá món.
   - Nhập mã giảm giá Coupon (`BOOK20`, `FREESHIP`, `VIP50`) với tính toán tự động.
   - Tóm tắt chi phí (Tạm tính, Giảm giá voucher, Phí ship, Tổng tiền).
6. **Thanh Toán & Mã VietQR (Checkout):**
   - Form nhập thông tin nhận hàng có kiểm tra validation chặt chẽ (Họ tên, SĐT, Địa chỉ).
   - Phương thức thanh toán: COD tiền mặt và **Chuyển khoản VietQR**.
   - Hiển thị mã **VietQR động** chuẩn NAPAS với đầy đủ Tên chủ TK, Số tài khoản, Số tiền, Nội dung chuyển khoản theo mã đơn hàng, nút sao chép nhanh 1 chạm.
7. **Đăng Nhập / Đăng Ký (Authentication):**
   - Validation kiểm tra định dạng email, độ dài mật khẩu, khớp mật khẩu.
   - **Visual Canvas Captcha:** Vẽ mã xác thực ngẫu nhiên chống bot kèm nút làm mới.
   - Xử lý lưu trữ JWT Token vào LocalStorage, tự động đính kèm `Authorization: Bearer <token>` vào mọi Axios request.
   - Nút đăng nhập mẫu 1 chạm cho tài khoản Khách hàng (Quang) và Quản trị (Minh Anh).
8. **Trang Cá Nhân (User Profile Hub):**
   - Quản lý và theo dõi lịch sử đơn hàng kèm trạng thái (Đang xử lý, Đang giao, Hoàn thành, Huỷ đơn, Mua lại).
   - Sổ địa chỉ giao hàng (Thêm, sửa, đặt mặc định).
   - Quản lý & chỉnh sửa lại 5 thể loại yêu thích bất kỳ lúc nào.
9. **Trang Sách Yêu Thích (Wishlist):**
   - Quản lý danh sách sách đã bấm tim yêu thích, thêm nhanh vào giỏ.
10. **Trang Đề Xuất (Recommendations):**
    - Trang chuyên biệt hiển thị kho sách được thuật toán AI lọc theo đúng 5 sở thích của người dùng.

---

### B. Giao Diện Quản Trị (Admin Portal - Minh Anh)
1. **Dashboard Thống Kê & Báo Cáo:**
   - 4 Thẻ KPI: Doanh thu thực, Tổng đơn hàng, Sách trong kho, Khách hàng mới.
   - **Biểu Đồ Doanh Thu 12 Tháng:** Vẽ bằng Canvas HD sắc nét với hiệu ứng gradient.
   - **Biểu Đồ Cơ Cấu Thể Loại Sách:** Donut Chart phân tích tỷ trọng doanh thu.
   - Bảng đơn hàng gần đây nhất.
2. **Quản Lý Sách (Book Management):**
   - Bảng dữ liệu sách kèm ảnh thumbnail, giá bán, tồn kho, trạng thái.
   - Modal Form Thêm mới / Cập nhật sách.
   - **Upload Ảnh Bìa Sách:** Vùng kéo thả file (Drag & Drop) và xem trước ảnh tức thì (Instant Preview) hoặc dán link ảnh.
   - Sửa & Xoá sách kèm popup xác nhận.
3. **Quản Lý Thể Loại (Cấu Trúc Dạng Cây - Tree View):**
   - Cây danh mục đa cấp Cha - Con trực quan.
   - Nút mở rộng/thu gọn nhánh cây (`+ -`).
   - Thêm danh mục con trực tiếp vào nút cha, sửa tên, xoá nhánh thể loại.
   - Thêm mới thể loại gốc (Root Category).
4. **Quản Lý Tác Giả & Nhà Xuất Bản (NXB):**
   - Quản lý danh sách tác giả (Ảnh đại diện, quốc tịch, tiểu sử).
   - Quản lý danh sách NXB (Mã NXB, địa chỉ, số điện thoại).
5. **Quản Lý Đơn Hàng:**
   - Xem danh sách đơn hàng toàn hệ thống và cập nhật trạng thái đơn (Đang xử lý, Đang giao, Hoàn thành, Đã huỷ).

---

## 🛠️ 2. Yêu Cầu Kỹ Thuật
- **REST API Client (Axios):** Cấu hình `baseURL: 'http://localhost:8080/api'` kết nối trực tiếp Spring Boot Backend.
- **JWT Header Interceptor:** Tự động đính kèm `Authorization: Bearer <token>` và bắt mã lỗi `401/403`.
- **Mock Fallback Engine:** Tích hợp sẵn cơ sở dữ liệu mẫu phong phú, tự động hoạt động trơn tru ngay cả khi Backend chưa bật.
- **Visual Captcha:** Thuật toán tạo mã Captcha trên thẻ `<canvas>` với đường kẻ nhiễu và biến dạng ký tự.
- **VietQR Payment Generator:** Sinh mã QR thanh toán ngân hàng chính xác theo mã đơn hàng và số tiền.
- **Giao Diện Siêu Đẹp (Rich Aesthetics):** Dark/Light mode toggle, Font Google Fonts *Plus Jakarta Sans*, Glassmorphism, Micro-animations, Responsive 100% Mobile & Desktop.

---

## 🚀 3. Hướng Dẫn Khởi Chạy

### Cách 1: Khởi chạy bằng Node.js Server (Khuyên dùng)
Chạy lệnh sau tại thư mục gốc dự án:
```powershell
node frontend/server.js
```
Truy cập trình duyệt tại: **`http://localhost:3000`**

### Cách 2: Mở trực tiếp File HTML
Mở trực tiếp file `frontend/index.html` trong bất kỳ trình duyệt nào (Chrome, Edge, Firefox).

---

## 👥 Tài Khoản Trải Nghiệm Mẫu

| Vai trò | Email | Mật khẩu | Chức năng nổi bật |
| :--- | :--- | :--- | :--- |
| **Khách Hàng (Quang)** | `quang@booknest.vn` | `123456` | Mua sách, Đề xuất 5 thể loại, VietQR, Đơn hàng, Wishlist |
| **Quản Trị (Minh Anh)** | `admin@booknest.vn` | `admin123` | Dashboard biểu đồ, Quản lý sách & upload ảnh, Quản lý cây thể loại |
