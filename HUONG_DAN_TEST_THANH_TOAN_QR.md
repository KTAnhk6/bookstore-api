# Hướng dẫn test thanh toán QR (VietQR + đối soát MB Bank)

## 1. Chức năng đã làm

| Yêu cầu | Cách hoạt động |
|---|---|
| Mỗi khách, mỗi phiên một mã QR riêng | Mỗi phiên gắn với 1 đơn hàng, có **nội dung chuyển khoản duy nhất** dạng `BKxxxxxxxx` (8 ký tự ngẫu nhiên, bỏ các ký tự dễ nhầm 0/O/1/I). QR theo chuẩn VietQR (NAPAS EMVCo), app ngân hàng nào quét cũng tự điền sẵn số TK, số tiền và nội dung. |
| Giới hạn 10 phút | Hết 10 phút → phiên `EXPIRED`, đơn bị hủy, **hoàn lại tồn kho**. Đổi thời gian bằng `payment.qr.session-minutes`. |
| Chọn sản phẩm khác → hủy phiên cũ | Gọi tạo phiên với giỏ/sản phẩm khác → phiên cũ `CANCELLED`, đơn cũ hủy + hoàn kho, sinh **QR và nội dung mới**. Gọi lại với đúng sản phẩm, số lượng và địa chỉ cũ thì giữ nguyên QR cũ (không tạo đơn trùng). |
| Server tự xác nhận thanh toán | Mỗi 15 giây server đọc lịch sử giao dịch MB Bank và tìm nội dung `BK...` trong tiền **vào**. Đủ tiền → phiên `PAID`, đơn `CONFIRMED`, payment `SUCCESS`. Mỗi giao dịch ngân hàng (refNo) chỉ được tính **một lần**. |
| Các trường hợp như ngân hàng thật | Chuyển **thiếu**: `PARTIAL` (cộng dồn, chuyển nốt phần còn lại là đủ). Tiền về **sau khi hủy/hết hạn**: `LATE`. Phiên đã trả rồi mà còn tiền về: `DUPLICATE`. Hai loại cuối hiện ở màn quản trị để hoàn tiền thủ công. |

Có 2 chế độ ngân hàng:

- **GIẢ LẬP** (mặc định, khi chưa đặt `BANK_HISTORY_URL`): "ngân hàng" nằm ngay trong server, bấm nút là có tiền về, không mất tiền thật. Định dạng sao kê giống hệt API MB Bank.
- **MB BANK THẬT**: đặt biến môi trường `BANK_HISTORY_URL` = link API lịch sử giao dịch. Link này chứa token nên **chỉ để trong biến môi trường, không ghi vào file nào trong repo** (repo đang public).

---

## 2. Test tự động (không cần MySQL)

JDK 21 portable nằm sẵn trong `.tools/` (đã thêm vào `.gitignore`). Mở PowerShell tại thư mục dự án:

```powershell
$env:JAVA_HOME = "$PWD\.tools\jdk-21.0.12.1+1"
.\mvnw.cmd test "-Dtest=QrPaymentFlowTest,VietQrGeneratorTest,BankHistoryParsingTest"
```

Kết quả mong đợi: `Tests run: 12, Failures: 0, Errors: 0` và `BUILD SUCCESS` (các dòng log `ERROR … not found / không thể hủy` là test cố tình gọi sai, không phải lỗi).

| Test | Kiểm tra |
|---|---|
| `VietQrGeneratorTest` | CRC16 đúng chuẩn. Chuỗi QR **khớp từng byte** với QR do img.vietqr.io sinh ra cho cùng tài khoản. Ảnh PNG quét ngược lại ra đúng chuỗi. |
| `BankHistoryParsingTest` | Đọc đúng JSON của API MB Bank, bỏ qua tiền ra, báo lỗi khi API trả lỗi hoặc HTML. Tìm được mã khi app ngân hàng đổi chữ thường, chèn dấu cách hoặc dấu chấm. |
| `QrPaymentFlowTest` | Toàn bộ luồng qua HTTP thật trên H2: giữ QR khi cùng sản phẩm; đổi sản phẩm thì hủy phiên cũ và hoàn kho; trả đủ thì `PAID` (lần 2 là `DUPLICATE`); trả thiếu `PARTIAL` rồi trả nốt `PAID`; hết hạn thì `EXPIRED`, hoàn kho, tiền về muộn là `LATE`; tự hủy phiên; không xem được phiên của người khác; khách không gọi được API quản trị. |

> Chạy `.\mvnw.cmd test` không kèm `-Dtest`: test `BookstoreApiApplicationTests.contextLoads` có sẵn từ trước cần MySQL (XAMPP) đang bật, vì nó kết nối database `bookstore` thật. Tắt MySQL thì riêng test này lỗi. Đó không phải lỗi của chức năng QR.

---

## 3. Chạy server để test bằng tay

### Cách A: MySQL trên XAMPP (database `bookstore` thật)

`application.properties` đang trỏ tới `jdbc:mysql://localhost:3306/bookstore`, user `root`, **mật khẩu trống** (mặc định của XAMPP). Máy nào đặt mật khẩu cho root thì khai báo bằng biến môi trường, không sửa file: `$env:SPRING_DATASOURCE_PASSWORD = "..."`.

**Chuyển đổi database (làm 1 lần).** File `bookstore.sql` gốc lệch với code Java: enum viết thường, một số cột và bảng đặt tên khác entity (`order_status`, `unit_price`, `carts`...). Chạy thẳng thì Hibernate báo lỗi DDL, đăng nhập và tạo đơn đều lỗi. Script `db/chuyen_doi_bookstore_khop_code.sql` sửa schema cho khớp code mà **giữ nguyên dữ liệu**: 100 sách, tài khoản, đơn hàng, giỏ hàng, mã giảm giá.

1. Bật **MySQL** trong XAMPP Control Panel.
2. Nếu chưa có database: import `bookstore.sql` (bằng phpMyAdmin, hoặc `C:\xampp\mysql\bin\mysql.exe -uroot < bookstore.sql`).
3. Sao lưu, rồi chạy script chuyển đổi (PowerShell tại thư mục dự án):

```powershell
mkdir db-backup -Force
C:\xampp\mysql\bin\mysqldump.exe -uroot --databases bookstore > db-backup\bookstore_truoc_chuyen_doi.sql
cmd /c "C:\xampp\mysql\bin\mysql.exe -uroot bookstore < db\chuyen_doi_bookstore_khop_code.sql"
```

> Script chỉ chạy **một lần** trên DB tạo từ `bookstore.sql`. Chạy lần 2 sẽ báo lỗi cột không tồn tại (DB đã đúng rồi, bỏ qua lỗi đó). Muốn làm lại từ đầu: `cmd /c "C:\xampp\mysql\bin\mysql.exe -uroot < db-backup\bookstore_truoc_chuyen_doi.sql"`. `db-backup/` đã được `.gitignore` vì chứa dữ liệu người dùng.

Chạy server:

```powershell
$env:JAVA_HOME = "$PWD\.tools\jdk-21.0.12.1+1"
.\mvnw.cmd spring-boot:run
```

Lần chạy đầu, Hibernate tự tạo thêm bảng `payment_sessions` và `bank_transactions`. Tài khoản trong `bookstore.sql` (`admin@bookstore.vn`, `user01@gmail.com`...) đăng nhập bằng **mật khẩu gốc của nhóm** (file chỉ lưu mã băm). Để test, bấm **Đăng ký** trên trang test để tạo khách mới.

### Cách B: nhanh, không cần MySQL (H2 trong bộ nhớ, tắt server là mất dữ liệu)

```powershell
$env:JAVA_HOME = "$PWD\.tools\jdk-21.0.12.1+1"
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.useTestClasspath=true" "-Dspring-boot.run.arguments=--spring.datasource.url=jdbc:h2:mem:demo;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1 --spring.datasource.username=sa --spring.datasource.password= --spring.datasource.driver-class-name=org.h2.Driver --spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect --spring.jpa.hibernate.ddl-auto=create-drop"
```

DB trống nên `DataInitializer` tự thêm sách và tài khoản mẫu (chỉ có ở cách B):

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Khách | `customer@bookstore.vn` | `password123` |
| Quản trị | `admin@bookstore.vn` | `admin123` |

### Mở trang test

Mở terminal thứ hai:

```powershell
node frontend/server.js
```

Vào **http://localhost:3000/payment-test.html**. Góc trên bên phải hiện chế độ ngân hàng: **GIẢ LẬP** hoặc **MB BANK THẬT**.

---

## 4. Kịch bản test ở chế độ GIẢ LẬP

| # | Thao tác trên trang | Kết quả đúng |
|---|---|---|
| 1 | Cách B: bấm **Đăng nhập** (đã điền sẵn tài khoản khách). Cách A (XAMPP): sửa email thành email mới, nhập mật khẩu ≥ 6 ký tự, bấm **Đăng ký** | "Đang đăng nhập: …" |
| 2 | Bấm **Thanh toán QR** ở sách A | Hiện QR, số tiền, nội dung `BK...`, đồng hồ 10:00 đếm lùi. Cột "Kho" của sách A giảm. |
| 3 | Bấm lại **Thanh toán QR** ở sách A, cùng số lượng | Nhật ký: "Cùng sản phẩm → giữ phiên", QR và nội dung **không đổi** |
| 4 | Bấm **Thanh toán QR** ở sách B | Nhật ký: "Đổi sản phẩm → hủy phiên #…", **nội dung mới**. Kho sách A được trả lại. Bảng "Lịch sử phiên" có phiên cũ `CANCELLED`. |
| 5 | (Tùy chọn) Quét QR bằng app ngân hàng thật nhưng **không chuyển** | App tự điền MB Bank, 0396902081, NGUYEN KIEU TUAN ANH, đúng số tiền và nội dung |
| 6 | Bấm **Chuyển thiếu 10.000đ** | Vẫn `PENDING`, "Đã nhận" tăng |
| 7 | Bấm **Chuyển nốt phần còn thiếu** | Vài giây sau: `PAID`, banner xanh "Thanh toán thành công" |
| 8 | Bấm **Chuyển đúng tiền + nội dung** lần nữa | Phần Quản trị (bấm **Xem**): giao dịch `DUPLICATE` |
| 9 | Chọn sách C rồi bấm **Hủy phiên**, sau đó **Chuyển đúng tiền** | Phiên `CANCELLED`, kho hoàn lại. Quản trị: `LATE`, "cần hoàn tiền thủ công". |
| 10 | Chọn sách D và để yên 10 phút (hoặc tạm đặt `payment.qr.session-minutes=1`) | Đồng hồ về 00:00, trong vòng ~15 giây phiên chuyển `EXPIRED`, đơn hủy, kho hoàn lại |
| 11 | Chuyển tùy chỉnh, nội dung sai (ví dụ `BKSAIMA123`) | Không phiên nào được xác nhận |

Ngân hàng giả lập cố tình viết nội dung giống app thật: chữ thường, có dấu cách giữa mã, kèm tên người chuyển và "Ma GD ACSP…". Như vậy test đúng phần nhận diện mã của server.

---

## 5. Test với MB Bank THẬT

1. Tắt server rồi chạy lại, có đặt biến môi trường (chỉ tồn tại trong cửa sổ PowerShell đó, không ghi vào file):

   ```powershell
   $env:BANK_HISTORY_URL = "https://id.xapi.vn/historyapimbbank/<token của bạn>"
   .\mvnw.cmd spring-boot:run
   ```

2. Trang test sẽ báo **MB BANK THẬT**, và ô ngân hàng giả lập bị ẩn (server cũng chặn API giả lập).
3. Tăng số lượng hoặc chọn sách rẻ nhất để có đơn nhỏ. Bấm **Thanh toán QR**, dùng app ngân hàng quét QR và chuyển **đúng số tiền, giữ nguyên nội dung**.
4. Chờ tối đa ~15–30 giây (tùy độ trễ của API xapi), hoặc bấm **Tôi đã chuyển khoản**. Phiên chuyển `PAID`.
5. Kiểm tra lại ở phần **Quản trị → Xem**: có giao dịch với mã GD thật của ngân hàng.

Nếu không thấy xác nhận, bấm **Đối soát ngay** ở phần Quản trị. Nhật ký sẽ báo `LỖI …` khi không gọi được API ngân hàng. Khi API ngân hàng lỗi, server **cho phiên thêm 5 phút** trước khi hết hạn, để khách đã chuyển tiền không bị hủy oan.

---

## 6. Danh sách API

Mọi API (trừ `/api/test/**`) cần header `Authorization: Bearer <token>` lấy từ `POST /api/auth/login`.

| Method | Đường dẫn | Mô tả |
|---|---|---|
| POST | `/api/payments/qr/session` | Tạo phiên (hoặc trả lại phiên cũ nếu cùng sản phẩm). Body như `OrderRequest`: `directItems: [{bookId, quantity}]` (không gửi thì lấy giỏ hàng), `recipientName, phone, province, district, ward, detailAddress`, `couponCode`, `pointsToUse`. `paymentMethod` luôn là QR. |
| GET | `/api/payments/qr/session/active` | Phiên đang chờ của tôi (`data: null` nếu không có) |
| GET | `/api/payments/qr/session/{id}` | Trạng thái phiên (frontend gọi 3 giây/lần) |
| POST | `/api/payments/qr/session/{id}/check` | "Tôi đã chuyển khoản": đối soát ngay rồi trả trạng thái |
| POST | `/api/payments/qr/session/{id}/cancel` | Khách hủy phiên và đơn |
| GET | `/api/payments/qr/sessions` | Lịch sử phiên của tôi |
| GET | `/api/payments/qr/admin/sessions?status=PENDING` | (ADMIN) Tất cả phiên |
| GET | `/api/payments/qr/admin/bank-transactions` | (ADMIN) Giao dịch ngân hàng đã khớp: PAID / PARTIAL / LATE / DUPLICATE |
| POST | `/api/payments/qr/admin/sync` | (ADMIN) Đối soát ngay |
| GET | `/api/test/mock-bank/status` | Chế độ ngân hàng + thông tin tài khoản nhận |
| POST | `/api/test/mock-bank/transfer` | (Giả lập) `{amount, description, senderName}` |
| GET / DELETE | `/api/test/mock-bank/history` | (Giả lập) Xem sao kê theo định dạng MB Bank / xóa sao kê |

Phiên trả về có các trường `sessionId, status, orderCode, items, bankName, accountNo, accountName, amount, receivedAmount, paymentCode, qrPayload, qrImage (PNG base64), expiresAt, remainingSeconds, paidAt, bankRefNo, cancelReason`.

Cấu hình trong `application.properties`:

| Thuộc tính | Ý nghĩa |
|---|---|
| `payment.qr.bank-bin` / `account-no` / `account-name` | Tài khoản nhận tiền (MB Bank 970422 / 0396902081 / NGUYEN KIEU TUAN ANH) |
| `payment.qr.session-minutes` | Thời gian giữ QR (10) |
| `payment.qr.code-prefix` | Tiền tố nội dung chuyển khoản (BK) |
| `payment.bank.history-url` | Lấy từ biến môi trường `BANK_HISTORY_URL`; để trống = giả lập |
| `payment.bank.poll-interval-ms` | Chu kỳ đọc sao kê (15000) |
