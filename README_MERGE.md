# BookNest — bản hợp nhất đầy đủ main11 + tương thích triển khai

## Nguồn và phạm vi
- Nghiệp vụ/UI lấy từ ZIP `bookstore-api-main11`, không thay bằng bản main đơn giản hóa.
- Hạ tầng lấy từ GitHub main fetch read-only: `44a0b3214b29a59c27216409351a7703d0be703f`.
- Chỉ làm local. Không push, deploy, kết nối/sửa DB thật, gọi ngân hàng hoặc gửi SMTP thật.
- ZIP là source hoàn chỉnh để build; không kèm target/JAR, JDK, Maven cache, .git, IDE, mật khẩu, dump production. Ảnh uploads và frontend được giữ.

## Giữ nguyên chức năng
Duyệt review/chỉ người nhận sách được viết; phí vận chuyển vùng và Google Maps tùy cấu hình; dùng điểm checkout, thưởng khi DELIVERED và hoàn/thu hồi điểm; admin lọc/sort/phân trang sách/người dùng/đơn/review và KPI điều hướng; sở thích thể loại, lịch sử tìm kiếm; mail SMTP thật; cập nhật kho/coupon có điều kiện ở DB và khóa user. Giữ COD, VietQR + polling sao kê, refresh token, profile, địa chỉ, wishlist, giỏ hàng, danh mục/tác giả/NXB, đề xuất và xuất Excel/PDF. WebConfig vẫn ưu tiên classpath frontend. `/api/books` giữ controller/response main11, không đổi hợp đồng bot.

## Sửa/hợp nhất
- Sửa compile blocker: UserServiceImpl triển khai searchForAdmin, chuyển keyword thành pattern và giữ role/status/Pageable; bổ sung findByToken repository.
- UI reset đồng nhất backend 16 ký tự/1 giờ/dùng một lần ở cả ba bản frontend. Giữ SMTP JavaMailSender.send, bỏ ghi mã reset vào log khi chưa cấu hình SMTP. Không tuyên bố có khóa sau 5 lần sai; failed_attempts chỉ giữ tương thích entity main11.
- Bỏ bypass captcha đầu vào cố định. Captcha vẫn có cờ tắt chủ động cho test, production mặc định bật.
- DataInitializer dùng đúng bản main: chỉ seed nếu không có users, lấy DEMO_* từ môi trường; không đổi mật khẩu của user có sẵn, không tạo/mặc định mật khẩu thật.
- Giữ Jenkinsfile/Jenkinsfile.k3s/Dockerfile/Dockerfile.linux/.dockerignore/Maven wrapper của main. Compose bổ sung chuyển tiếp JWT, SMTP, QR, mock-bank, JPA và DEMO env; JWT bắt buộc. Jenkins hiện vẫn skip chạy tests theo baseline; không chạy pipeline khi tạo ZIP.
- JPA mặc định none, không tự migration. Mock-bank mặc định false. Xóa credential mặc định DB/SMTP/JWT và tài khoản nhận tiền cá nhân; JWT_SECRET bắt buộc.
- Thêm APP_SEARCH_HISTORY_ENABLED=false cho máy chỉ đọc; primary mặc định true và vẫn ghi lịch sử tìm kiếm. Cờ này không biến các API ghi khác thành read-only.
- Gỡ hai testExcludes cũ; cập nhật test model/atomic inventory/token contract, bỏ javaagent đường dẫn tuyệt đối; thêm regression captcha/admin search/mail/read-only search.

## Build và kết quả thực tế
JDK 21, Maven wrapper đã chạy `clean package`: **60 tests, 0 failures, 0 errors, 0 skipped; BUILD SUCCESS**. Không còn loại BookServiceTest/OrderServiceTest khỏi compile.

Linux chạy lại (các password dưới chỉ dành cho test H2):
```sh
DEMO_ADMIN_PASSWORD=admin123 DEMO_STAFF_PASSWORD=staff123 DEMO_CUSTOMER_PASSWORD=password123 bash mvnw -B clean package
```
PowerShell: đặt ba biến `$env:DEMO_ADMIN_PASSWORD`, `$env:DEMO_STAFF_PASSWORD`, `$env:DEMO_CUSTOMER_PASSWORD` thành các giá trị test tương ứng, rồi `./mvnw.cmd -B clean package`.
Test sử dụng H2 in-memory và mock-bank bật rõ trong profile test, SMTP host rỗng; không gọi ngân hàng thật. Có integration QR/mock HTTP, context boot, shipping, report/recommendation và unit regression. Có cảnh báo deprecated API/unchecked test, không phải lỗi build.

`validation/` chứa log build thật (các dòng token/log test đã được lọc nếu nhạy cảm), kết quả static, diff entity và inventory thay đổi. JAR đã kiểm CRC và mọi file frontend được đóng gói trùng byte; JS main đã node --check. Jenkins chỉ kiểm nội dung đúng SHA, cấu trúc cơ bản và endpoint healthcheck, chưa lint trên Jenkins hay chạy Docker Windows/K3s.

## Checklist trước triển khai
1. Sao lưu DB primary (mysqldump với tài khoản backup, password prompt/secret store; include routines/triggers/events nếu sử dụng) và thư mục uploads; xác minh restore vào DB thử. Lưu image/env hiện hành để rollback. Không dùng dump ZIP cũ.
2. Xác định đúng primary, schema được chọn, phiên bản MySQL/MariaDB và replication filters. Chạy SELECT precheck trong `migrations/001_main11_additions.sql`; kiểm SHOW CREATE TABLE orders/reviews/password_reset_tokens và so với `validation/entity-schema.diff`. Script không có database name cố định, ALTER được comment để không vô tình chạy.
3. Chỉ thực thi ALTER cho cột còn thiếu sau rehearsal/backup: orders.points_used INT NULL, points_discount DECIMAL(12,2) NULL, points_earned INT NULL; reviews.status VARCHAR(20) NOT NULL DEFAULT 'APPROVED'; password_reset_tokens.failed_attempts INT NOT NULL DEFAULT 0. Nếu cột đã tồn tại, so type/default trước; không chạy lại mù quáng. MySQL DDL implicit commit, không rollback bằng transaction thông thường.
4. Không backfill điểm đơn cũ: NULL points_used là dấu hiệu backend dùng để tránh thưởng lại các đơn mà bản cũ đã cộng khi tạo. Không suy đoán số dư lịch sử để tự điều chỉnh. Review cũ được giữ công khai APPROVED; review mới Java tạo PENDING. Không drop/truncate/import/reset users.
5. Nếu replication hiện có đang hoạt động, DDL chạy trên primary với binlog sẽ đến replica theo cấu hình/filter. Kiểm trạng thái SQL/IO thread, lag, lỗi và các cột trên replica; không ALTER đồng thời hai phía và không tắt read_only/super_read_only để chạy script trên replica. ZIP không tự cài replication/promote/failover. Nếu không có replication, dừng và lập kế hoạch riêng, không giả định dữ liệu tự đồng bộ.
6. Giữ Ubuntu/K3s `SPRING_JPA_HIBERNATE_DDL_AUTO=none`. Với DB user chỉ đọc đặt `APP_SEARCH_HISTORY_ENABLED=false`; chỉ browsing được hỗ trợ, login/checkout/admin/refresh và các job ghi cần primary writable hoặc routing riêng. Không tự promote hay nới quyền replica. DB rỗng trên replica không phù hợp DataInitializer.
7. Điền env theo `.env.example` ngoài Git. Windows Jenkins đọc `C:\Monitoring\bookstore.env`: bắt buộc thêm JWT_SECRET ngẫu nhiên >=32 ký tự bên cạnh DB_PASSWORD/ADMIN_PASSWORD. Bổ sung SMTP/from, QR account, BANK_HISTORY_URL khi dùng; không bật mock-bank trên production. K3s dùng Secret/env hiện có tương ứng, không kèm kubeconfig. Đổi JWT secret có thể làm phiên cũ mất hiệu lực.
8. Compose baseline dùng Windows NAT/DB host hiện hành; không chạy compose này trên Linux. Linux dùng Dockerfile.linux + Jenkinsfile.k3s, namespace/ServiceAccount/kubeconfig/import helper hiện có. Uploads vẫn lưu thư mục làm việc: cần mount storage bền vững phù hợp từng OS, giữ/migrate uploads hiện hành trước rollout (Dockerfile không đóng gói uploads ngoài JAR).
9. Chỉ với DB demo trống được chủ động khởi tạo mới, cung cấp đủ DEMO_ADMIN_PASSWORD/DEMO_STAFF_PASSWORD/DEMO_CUSTOMER_PASSWORD và tạo schema theo kế hoạch riêng. Không bật ddl-auto=update/create trên DB triển khai để thay migration thủ công.
10. Smoke test staging sau migration: `/api/books`, frontend, admin filters, captcha, reset email thực nhận, COD/points/delivery/cancel, moderation, QR với môi trường test được phép, bot contract. Xác minh dữ liệu hai máy trước rollout. Rollback image không xóa cột đã thêm; không rollback DB bằng import đè khi có giao dịch mới.

## Giới hạn và tồn tại không bị che giấu
- Chưa chạy với schema/data live, SQL migration trên MySQL, SMTP/network bank thật, Docker Windows/K3s, UI browser E2E hay kiểm tra tải/concurrency đầy đủ. 60 tests không chứng minh mọi chức năng production đã nghiệm thu.
- Không nhập endpoint payment-session DEMO mới của main đơn giản hóa; giữ flow VietQR thật từ main11, không tự xác nhận tiền bằng mock.
- Các hạn chế đã biết của main11 vẫn cần quyết định nghiệp vụ riêng: fallback số mẫu/nhãn dashboard, lịch sử khách giới hạn 50 đơn UI, chu trình thể loại hậu duệ, chưa có payment callback/cổng ngoài QR, phạm vi admin payments, token reset đồng thời/rate-limiting. Không mở rộng thành viết lại toàn bộ ứng dụng.
- SMTP thất bại vẫn trả thông báo chung chống dò tài khoản; vận hành phải theo dõi mail error logs. Secret từng nằm trong bản gốc cần được chủ sở hữu thu hồi/rotate, dù đã bỏ khỏi ZIP này.
- Tài liệu/SQL backup cũ, local credential config, Postman/test_suite.js cũ và launcher .tools đã được loại khỏi handoff do có tài khoản/schema lỗi thời; danh sách trong validation/merge-inventory.json. Không bỏ mã nghiệp vụ Java hay ảnh để giảm dung lượng.
