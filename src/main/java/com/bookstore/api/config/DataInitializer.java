package com.bookstore.api.config;

import com.bookstore.api.entity.*;
import com.bookstore.api.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final AuthorRepository authorRepository;
    private final PublisherRepository publisherRepository;
    private final BookRepository bookRepository;
    private final CouponRepository couponRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() == 0) {
            log.info("Seeding initial bookstore demo data...");
            seedUsers();
            seedCategoriesAuthorsPublishersBooksAndCoupons();
            log.info("Demo data seeding completed successfully!");
        }
    }

    private void seedUsers() {
        User admin = User.builder()
                .username("admin")
                .email("admin@bookstore.vn")
                .passwordHash(passwordEncoder.encode("admin123"))
                .fullName("Quản Trị Viên")
                .phone("0901234567")
                .role(User.Role.ADMIN)
                .status(User.Status.ACTIVE)
                .build();

        User staff = User.builder()
                .username("staff")
                .email("staff@bookstore.vn")
                .passwordHash(passwordEncoder.encode("staff123"))
                .fullName("Nhân Viên Bán Hàng")
                .phone("0902345678")
                .role(User.Role.STAFF)
                .status(User.Status.ACTIVE)
                .build();

        User customer = User.builder()
                .username("customer")
                .email("customer@bookstore.vn")
                .passwordHash(passwordEncoder.encode("password123"))
                .fullName("Nguyễn Văn Khách")
                .phone("0903456789")
                .role(User.Role.CUSTOMER)
                .gender(User.Gender.MALE)
                .birthday(LocalDate.of(1998, 5, 20))
                .loyaltyPoints(50)
                .hasSetPreferences(false)
                .status(User.Status.ACTIVE)
                .build();

        userRepository.saveAll(List.of(admin, staff, customer));
    }

    private void seedCategoriesAuthorsPublishersBooksAndCoupons() {
        // Categories
        Category cat1 = categoryRepository.save(Category.builder().name("Văn Học").slug("van-hoc").description("Tiểu thuyết, truyện ngắn, tác phẩm kinh điển").displayOrder(1).active(true).build());
        Category cat2 = categoryRepository.save(Category.builder().name("Kinh Tế - Quản Trị").slug("kinh-te-quan-tri").description("Kinh doanh, tài chính cá nhân, khởi nghiệp").displayOrder(2).active(true).build());
        Category cat3 = categoryRepository.save(Category.builder().name("Tâm Lý - Kỹ Năng Sống").slug("tam-ly-ky-nang-song").description("Phát triển bản thân, tư duy tích cực, thấu hiểu tâm lý").displayOrder(3).active(true).build());
        Category cat4 = categoryRepository.save(Category.builder().name("Khoa Học - Công Nghệ").slug("khoa-hoc-cong-nghe").description("Lập trình, AI, khoa học đời sống, vũ trụ").displayOrder(4).active(true).build());
        Category cat5 = categoryRepository.save(Category.builder().name("Lịch Sử - Triết Học").slug("lich-su-triet-hoc").description("Lịch sử Việt Nam và thế giới, tư tưởng triết học").displayOrder(5).active(true).build());
        Category cat6 = categoryRepository.save(Category.builder().name("Thiếu Nhi").slug("thieu-nhi").description("Truyện tranh, sách khám phá dành cho các bạn nhỏ").displayOrder(6).active(true).build());
        Category cat7 = categoryRepository.save(Category.builder().name("Tiểu Thuyết Giả Tưởng").slug("tieu-thuyet-gia-tuong").description("Khoa học viễn tưởng, kỳ ảo phiêu lưu").displayOrder(7).active(true).build());

        // Authors
        Author a1 = authorRepository.save(Author.builder().name("Nguyễn Nhật Ánh").slug("nguyen-nhat-anh").bio("Nhà văn Việt Nam chuyên viết cho thanh thiếu niên").nationality("Việt Nam").birthYear(1955).build());
        Author a2 = authorRepository.save(Author.builder().name("Haruki Murakami").slug("haruki-murakami").bio("Nhà văn nổi tiếng của Nhật Bản").nationality("Nhật Bản").birthYear(1949).build());
        Author a3 = authorRepository.save(Author.builder().name("James Clear").slug("james-clear").bio("Tác giả cuốn sách bán chạy Atomic Habits").nationality("Mỹ").birthYear(1986).build());
        Author a4 = authorRepository.save(Author.builder().name("Yuval Noah Harari").slug("yuval-noah-harari").bio("Nhà sử học, tác giả cuốn Sapiens").nationality("Israel").birthYear(1976).build());
        Author a5 = authorRepository.save(Author.builder().name("Morgan Housel").slug("morgan-housel").bio("Chuyên gia đối tác của Collaborative Fund").nationality("Mỹ").birthYear(1984).build());

        // Publishers
        Publisher p1 = publisherRepository.save(Publisher.builder().name("NXB Trẻ").slug("nxb-tre").address("161B Lý Chính Thắng, Q.3, TP.HCM").phone("02839316289").email("hopthu@nxbtre.com.vn").build());
        Publisher p2 = publisherRepository.save(Publisher.builder().name("NXB Kim Đồng").slug("nxb-kim-dong").address("55 Quang Trung, Hà Nội").phone("02439434730").email("cskh_online@nxbkimdong.com.vn").build());
        Publisher p3 = publisherRepository.save(Publisher.builder().name("NXB Thế Giới").slug("nxb-the-gioi").address("46 Trần Hưng Đạo, Hà Nội").phone("02438253841").email("thegioi@hn.vnn.vn").build());
        Publisher p4 = publisherRepository.save(Publisher.builder().name("NXB Hội Nhà Văn").slug("nxb-hoi-nha-van").address("65 Nguyễn Du, Hà Nội").phone("02438222135").build());

        // Books
        Book b1 = Book.builder()
                .title("Mắt Biếc")
                .slug("mat-biec")
                .isbn("9786041088765")
                .description("Mắt Biếc là một tác phẩm tiểu thuyết lãng mạn đầy cảm xúc của nhà văn Nguyễn Nhật Ánh về mối tình đơn phương của Ngạn dành cho Hà Lan.")
                .price(new BigDecimal("110000"))
                .salePrice(new BigDecimal("88000"))
                
                .stockQuantity(50)
                .soldQuantity(120)
                .publishYear(2021)
                .pageCount(296)
                .language("Tiếng Việt")
                .coverImage("https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80")
                
                .publisher(p1)
                
                .status(Book.Status.AVAILABLE)
                
                
                
                .build();

        Book b2 = Book.builder()
                .title("Rừng Na Uy")
                .slug("rung-na-uy")
                .isbn("9786045377891")
                .description("Tác phẩm kinh điển thế giới của Haruki Murakami kể về ký ức tình yêu, tuổi trẻ và sự trưởng thành của nhân vật Toru Watanabe.")
                .price(new BigDecimal("155000"))
                .salePrice(new BigDecimal("124000"))
                
                .stockQuantity(35)
                .soldQuantity(85)
                .publishYear(2020)
                .pageCount(440)
                .language("Tiếng Việt")
                .coverImage("https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80")
                
                .publisher(p4)
                
                .status(Book.Status.AVAILABLE)
                
                
                
                .build();

        Book b3 = Book.builder()
                .title("Thay Đổi Tí Hon, Hiệu Quả Bất Ngờ (Atomic Habits)")
                .slug("thay-doi-ti-hon-hieu-qua-bat-ngo-atomic-habits")
                .isbn("9786047761890")
                .description("Học cách xây dựng thói quen tốt và từ bỏ thói quen xấu với phương pháp khoa học đã được kiểm chứng bởi James Clear.")
                .price(new BigDecimal("189000"))
                .salePrice(new BigDecimal("142000"))
                
                .stockQuantity(100)
                .soldQuantity(340)
                .publishYear(2022)
                .pageCount(360)
                .language("Tiếng Việt")
                .coverImage("https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=600&q=80")
                
                .publisher(p3)
                
                .status(Book.Status.AVAILABLE)
                
                
                
                .build();

        Book b4 = Book.builder()
                .title("Sapiens - Lược Sử Loài Người")
                .slug("sapiens-luoc-su-loai-nguoi")
                .isbn("9786049887711")
                .description("Cuốn sách đưa độc giả vào chuyến du hành vượt thời gian từ kỷ nguyên đồ đá tới cách mạng công nghệ số hiện đại.")
                .price(new BigDecimal("240000"))
                .salePrice(new BigDecimal("192000"))
                
                .stockQuantity(60)
                .soldQuantity(210)
                .publishYear(2021)
                .pageCount(560)
                .language("Tiếng Việt")
                .coverImage("https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80")
                
                .publisher(p3)
                
                .status(Book.Status.AVAILABLE)
                
                
                
                .build();

        Book b5 = Book.builder()
                .title("Tâm Lý Học Về Tiền (The Psychology of Money)")
                .slug("tam-ly-hoc-ve-tien")
                .isbn("9786043124567")
                .description("Khám phá cách con người suy nghĩ về tiền bạc và đưa ra quyết định tài chính quan trọng trong cuộc đời.")
                .price(new BigDecimal("169000"))
                .salePrice(new BigDecimal("135000"))
                
                .stockQuantity(40)
                .soldQuantity(180)
                .publishYear(2022)
                .pageCount(328)
                .language("Tiếng Việt")
                .coverImage("https://images.unsplash.com/photo-1592496431122-2349e0fbc666?auto=format&fit=crop&w=600&q=80")
                
                .publisher(p1)
                
                .status(Book.Status.AVAILABLE)
                
                
                
                .build();

        Book b6 = Book.builder()
                .title("Cho Tôi Xin Một Vé Đi Tuổi Thơ")
                .slug("cho-toi-xin-mot-ve-di-tuoi-tho")
                .isbn("9786041023451")
                .description("Hành trình trở về tuổi thơ hồn nhiên, trong trẻo với những trò nghịch ngợm đáng yêu của bốn đứa trẻ.")
                .price(new BigDecimal("95000"))
                .salePrice(new BigDecimal("76000"))
                
                .stockQuantity(80)
                .soldQuantity(290)
                .publishYear(2020)
                .pageCount(212)
                .language("Tiếng Việt")
                .coverImage("https://images.unsplash.com/photo-1532012164546-f432f2e3725b?auto=format&fit=crop&w=600&q=80")
                
                .publisher(p1)
                
                .status(Book.Status.AVAILABLE)
                
                
                
                .build();

        bookRepository.saveAll(List.of(b1, b2, b3, b4, b5, b6));

        // Coupons
        Coupon c1 = Coupon.builder()
                .code("CHAOBANMOI")
                .description("Giảm 10% cho thành viên mới")
                .discountType(Coupon.DiscountType.PERCENTAGE)
                .discountValue(new BigDecimal("10"))
                .minOrderAmount(new BigDecimal("100000"))
                .maxDiscountAmount(new BigDecimal("50000"))
                .startDate(LocalDateTime.now().minusDays(10))
                .endDate(LocalDateTime.now().plusMonths(3))
                .usageLimit(1000)
                .usedCount(0)
                .active(true)
                .build();

        Coupon c2 = Coupon.builder()
                .code("GIAM30K")
                .description("Giảm ngay 30,000 VND cho đơn từ 200,000 VND")
                .discountType(Coupon.DiscountType.FIXED_AMOUNT)
                .discountValue(new BigDecimal("30000"))
                .minOrderAmount(new BigDecimal("200000"))
                .startDate(LocalDateTime.now().minusDays(10))
                .endDate(LocalDateTime.now().plusMonths(3))
                .usageLimit(500)
                .usedCount(0)
                .active(true)
                .build();

        couponRepository.saveAll(List.of(c1, c2));
    }
}
