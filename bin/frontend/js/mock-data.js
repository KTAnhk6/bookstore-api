/**
 * BOOKNEST DATA REPOSITORY
 * Realistic mock data & sample catalog for Books, Categories (Tree structure),
 * Authors, Publishers, Coupons, Reviews, Orders & Stats.
 */

const BOOKNEST_DATA = {
    categories: [
        {
            id: "cat_cntt",
            name: "Công Nghệ & Lập Trình",
            slug: "cntt",
            icon: "fa-solid fa-code",
            description: "Sách chuyên ngành IT, lập trình, trí tuệ nhân tạo, an ninh mạng",
            parentId: null,
            children: [
                { id: "cat_cntt_web", name: "Lập trình Web & Frontend", slug: "web-dev", parentId: "cat_cntt" },
                { id: "cat_cntt_ai", name: "AI & Machine Learning", slug: "ai-ml", parentId: "cat_cntt" },
                { id: "cat_cntt_arch", name: "Kiến trúc Phần mềm & Clean Code", slug: "software-architecture", parentId: "cat_cntt" },
                { id: "cat_cntt_sec", name: "An ninh mạng & DevOps", slug: "security-devops", parentId: "cat_cntt" }
            ]
        },
        {
            id: "cat_kinhte",
            name: "Kinh Tế & Khởi Nghiệp",
            slug: "kinhte",
            icon: "fa-solid fa-chart-line",
            description: "Tài chính cá nhân, quản trị kinh doanh, đầu tư và khởi nghiệp",
            parentId: null,
            children: [
                { id: "cat_kinhte_dautu", name: "Đầu tư & Chứng khoán", slug: "investment", parentId: "cat_kinhte" },
                { id: "cat_kinhte_startup", name: "Khởi nghiệp & Đổi mới", slug: "startup", parentId: "cat_kinhte" },
                { id: "cat_kinhte_marketing", name: "Marketing & Bán hàng", slug: "marketing", parentId: "cat_kinhte" }
            ]
        },
        {
            id: "cat_vanhoc",
            name: "Văn Học & Tiểu Thuyết",
            slug: "vanhoc",
            icon: "fa-solid fa-feather-pointed",
            description: "Tiểu thuyết kinh điển, văn học hiện đại, trinh thám kỳ bí",
            parentId: null,
            children: [
                { id: "cat_vanhoc_vn", name: "Văn học Việt Nam", slug: "vietnamese-literature", parentId: "cat_vanhoc" },
                { id: "cat_vanhoc_trinhtham", name: "Trinh thám & Ly kỳ", slug: "mystery-thriller", parentId: "cat_vanhoc" },
                { id: "cat_vanhoc_kinhdien", name: "Kinh điển Thế giới", slug: "classic-novels", parentId: "cat_vanhoc" }
            ]
        },
        {
            id: "cat_tamly",
            name: "Tâm Lý & Kỹ Năng Sống",
            slug: "tamly",
            icon: "fa-solid fa-brain",
            description: "Phát triển bản thân, tư duy tích cực, thói quen và giao tiếp",
            parentId: null,
            children: [
                { id: "cat_tamly_thoiquen", name: "Xây dựng Thói quen", slug: "habit-building", parentId: "cat_tamly" },
                { id: "cat_tamly_giaotiep", name: "Nghệ thuật Giao tiếp", slug: "communication", parentId: "cat_tamly" },
                { id: "cat_tamly_hanhphuc", name: "Tâm lý học Hạnh phúc", slug: "positive-psychology", parentId: "cat_tamly" }
            ]
        },
        {
            id: "cat_khoahoc",
            name: "Khoa Học & Vũ Trụ",
            slug: "khoahoc",
            icon: "fa-solid fa-atom",
            description: "Khám phá vũ trụ, vật lý hiện đại, sinh học và tự nhiên",
            parentId: null,
            children: [
                { id: "cat_khoahoc_vutru", name: "Thiên văn & Vũ trụ", slug: "astronomy", parentId: "cat_khoahoc" },
                { id: "cat_khoahoc_lichsu", name: "Lược sử Tự nhiên", slug: "history-science", parentId: "cat_khoahoc" }
            ]
        },
        {
            id: "cat_lichsu",
            name: "Lịch Sử & Triết Học",
            slug: "lichsu",
            icon: "fa-solid fa-landmark",
            description: "Lịch sử thế giới, văn minh nhân loại, tư tưởng triết học",
            parentId: null,
            children: [
                { id: "cat_lichsu_thegioi", name: "Lịch sử Thế giới", slug: "world-history", parentId: "cat_lichsu" },
                { id: "cat_triethoc_cotrung", name: "Triết học Khắc kỷ", slug: "stoicism", parentId: "cat_lichsu" }
            ]
        },
        {
            id: "cat_thieunhi",
            name: "Thiếu Nhi & Truyện Tranh",
            slug: "thieunhi",
            icon: "fa-solid fa-shapes",
            description: "Truyện tranh, sách tranh minh họa, nuôi dạy con cái",
            parentId: null,
            children: [
                { id: "cat_thieunhi_manga", name: "Manga & Comic", slug: "manga", parentId: "cat_thieunhi" },
                { id: "cat_thieunhi_khampha", name: "Sách Bách Khoa Trẻ Em", slug: "kids-encyclopedia", parentId: "cat_thieunhi" }
            ]
        },
        {
            id: "cat_ngoaingu",
            name: "Ngoại Ngữ & Du Lịch",
            slug: "ngoaingu",
            icon: "fa-solid fa-earth-asia",
            description: "Học tiếng Anh, tiếng Nhật, tiếng Trung và cẩm nang du lịch",
            parentId: null,
            children: [
                { id: "cat_ngoaingu_ielts", name: "Luyện thi IELTS & TOEIC", slug: "ielts-toeic", parentId: "cat_ngoaingu" }
            ]
        }
    ],

    authors: [
        {
            id: "auth_uncle_bob",
            name: "Robert C. Martin (Uncle Bob)",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
            nationality: "Mỹ",
            bio: "Huyền thoại ngành công nghệ thông tin, tác giả cuốn Clean Code kinh điển và là một trong những người sáng lập Agile Manifesto."
        },
        {
            id: "auth_james_clear",
            name: "James Clear",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
            nationality: "Mỹ",
            bio: "Chuyên gia hàng đầu thế giới về hình thành thói quen và tối ưu hóa hiệu suất làm việc, tác giả cuốn sách Atomic Habits bán hơn 15 triệu bản."
        },
        {
            id: "auth_morgan_housel",
            name: "Morgan Housel",
            avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
            nationality: "Mỹ",
            bio: "Đối tác tại Quỹ Hợp tác Collaborative Fund và cựu cây bút kỳ cựu của The Wall Street Journal, nổi tiếng với cuốn Tâm Lý Học Về Tiền."
        },
        {
            id: "auth_nguyen_nhat_anh",
            name: "Nguyễn Nhật Ánh",
            avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80",
            nationality: "Việt Nam",
            bio: "Nhà văn tài hoa gắn liền với tuổi thơ nhiều thế hệ độc giả Việt Nam với hàng loạt tác phẩm được chuyển thể thành phim điện ảnh ăn khách."
        },
        {
            id: "auth_yuval_harari",
            name: "Yuval Noah Harari",
            avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80",
            nationality: "Israel",
            bio: "Nhà sử học, triết gia và giáo sư tại Đại học Hebrew ở Jerusalem, tác giả bộ ba Sapiens, Homo Deus và 21 Bài Học Cho Thế Kỷ 21."
        },
        {
            id: "auth_dan_brown",
            name: "Dan Brown",
            avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80",
            nationality: "Mỹ",
            bio: "Tác giả của những siêu phẩm trinh thám lịch sử và biểu tượng tôn giáo như Mật Mã Da Vinci, Thiên Thần Và Ác Quỷ."
        }
    ],

    publishers: [
        {
            id: "pub_tre",
            name: "NXB Trẻ",
            code: "NXBTRE",
            logo: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=150&q=80",
            address: "161B Lý Chính Thắng, Phường Võ Thị Sáu, Quận 3, TP.HCM",
            phone: "028 3931 6289",
            email: "hopthu@nxbtre.com.vn"
        },
        {
            id: "pub_kimdong",
            name: "NXB Kim Đồng",
            code: "KIMDONG",
            logo: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=150&q=80",
            address: "55 Quang Trung, Hai Bà Trưng, Hà Nội",
            phone: "024 3943 4730",
            email: "cskh@nxbkimdong.com.vn"
        },
        {
            id: "pub_nhanam",
            name: "Nhã Nam",
            code: "NHANAM",
            logo: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=150&q=80",
            address: "59 Đỗ Quang, Trung Hòa, Cầu Giấy, Hà Nội",
            phone: "024 3514 6875",
            email: "contact@nhanam.vn"
        },
        {
            id: "pub_oreilly",
            name: "O'Reilly Media",
            code: "OREILLY",
            logo: "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=150&q=80",
            address: "Sebastopol, California, United States",
            phone: "+1 707 827 7000",
            email: "order@oreilly.com"
        }
    ],

    books: [
        {
            id: "book_01",
            title: "Clean Code - Mã Sạch Trong Nghệ Thuật Phần Mềm",
            authorId: "auth_uncle_bob",
            authorName: "Robert C. Martin",
            categoryId: "cat_cntt",
            categoryName: "Công Nghệ & Lập Trình",
            subCategoryId: "cat_cntt_arch",
            subCategoryName: "Kiến trúc Phần mềm & Clean Code",
            publisherId: "pub_oreilly",
            publisherName: "O'Reilly Media",
            price: 245000,
            originalPrice: 310000,
            discountPercent: 21,
            coverImage: "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=800&q=80",
            gallery: [
                "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80"
            ],
            rating: 4.9,
            reviewCount: 148,
            soldCount: 1850,
            stock: 45,
            pages: 464,
            publishYear: 2024,
            isbn: "978-0132350884",
            language: "Tiếng Việt (Bản dịch chuẩn)",
            format: "Bìa Mềm Tay Gấp",
            isNew: false,
            isBestseller: true,
            isFeatured: true,
            isFlashSale: true,
            description: "Ngay cả mã xấu cũng có thể hoạt động. Nhưng nếu mã không sạch, nó có thể làm suy kiệt toàn bộ tổ chức phát triển phần mềm. Cuốn sách Clean Code của Uncle Bob là cẩm nang bắt buộc cho mọi kỹ sư phần mềm muốn nâng cao tay nghề, viết mã thanh lịch, dễ bảo trì và mở rộng.",
            highlight: "Cuốn sách số 1 mọi lập trình viên đều phải đọc ít nhất một lần trong sự nghiệp."
        },
        {
            id: "book_02",
            title: "Atomic Habits - Thay Đổi Tí Hon, Hiệu Quả Bất Ngờ",
            authorId: "auth_james_clear",
            authorName: "James Clear",
            categoryId: "cat_tamly",
            categoryName: "Tâm Lý & Kỹ Năng Sống",
            subCategoryId: "cat_tamly_thoiquen",
            subCategoryName: "Xây dựng Thói quen",
            publisherId: "pub_nhanam",
            publisherName: "Nhã Nam",
            price: 159000,
            originalPrice: 199000,
            discountPercent: 20,
            coverImage: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
            gallery: [
                "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80"
            ],
            rating: 4.95,
            reviewCount: 320,
            soldCount: 4200,
            stock: 120,
            pages: 320,
            publishYear: 2024,
            isbn: "978-0735211292",
            language: "Tiếng Việt",
            format: "Bìa Mềm",
            isNew: false,
            isBestseller: true,
            isFeatured: true,
            isFlashSale: true,
            description: "Dù mục tiêu của bạn là gì, Atomic Habits sẽ cung cấp một khung làm việc đã được chứng minh để cải thiện mỗi ngày. Tác giả chỉ ra rằng vấn đề không phải ở bạn khi bạn gặp khó khăn trong việc thay đổi thói quen; vấn đề nằm ở hệ thống của bạn.",
            highlight: "Bestseller toàn cầu hơn 15 triệu bản trên New York Times."
        },
        {
            id: "book_03",
            title: "Tâm Lý Học Về Tiền - Những Bài Học Bất Biến Về Sự Giàu Có",
            authorId: "auth_morgan_housel",
            authorName: "Morgan Housel",
            categoryId: "cat_kinhte",
            categoryName: "Kinh Tế & Khởi Nghiệp",
            subCategoryId: "cat_kinhte_dautu",
            subCategoryName: "Đầu tư & Chứng khoán",
            publisherId: "pub_tre",
            publisherName: "NXB Trẻ",
            price: 142000,
            originalPrice: 185000,
            discountPercent: 23,
            coverImage: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80",
            gallery: [
                "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80"
            ],
            rating: 4.85,
            reviewCount: 215,
            soldCount: 3100,
            stock: 85,
            pages: 384,
            publishYear: 2025,
            isbn: "978-0857197689",
            language: "Tiếng Việt",
            format: "Bìa Mềm",
            isNew: true,
            isBestseller: true,
            isFeatured: true,
            isFlashSale: false,
            description: "Làm tốt với tiền bạc không nhất thiết phải dựa vào những gì bạn biết. Nó dựa vào cách bạn cư xử. Và hành vi rất khó để dạy dỗ, ngay cả với những người thực sự thông minh. 19 câu chuyện ngắn khám phá những cách kỳ lạ mà mọi người suy nghĩ về tiền bạc.",
            highlight: "Sách tài chính cá nhân được yêu thích nhất thế giới 5 năm qua."
        },
        {
            id: "book_04",
            title: "Sapiens - Lược Sử Loài Người",
            authorId: "auth_yuval_harari",
            authorName: "Yuval Noah Harari",
            categoryId: "cat_lichsu",
            categoryName: "Lịch Sử & Triết Học",
            subCategoryId: "cat_lichsu_thegioi",
            subCategoryName: "Lịch sử Thế giới",
            publisherId: "pub_nhanam",
            publisherName: "Nhã Nam",
            price: 210000,
            originalPrice: 280000,
            discountPercent: 25,
            coverImage: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80",
            gallery: [
                "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80"
            ],
            rating: 4.9,
            reviewCount: 190,
            soldCount: 2800,
            stock: 60,
            pages: 560,
            publishYear: 2024,
            isbn: "978-0062316097",
            language: "Tiếng Việt",
            format: "Bìa Cứng Cao Cấp",
            isNew: false,
            isBestseller: true,
            isFeatured: true,
            isFlashSale: true,
            description: "Một chuyến du hành hấp dẫn xuyên suốt lịch sử loài người từ thời kỳ đồ đá cho đến kỷ nguyên trí tuệ nhân tạo và kỹ thuật sinh học ngày nay.",
            highlight: "Sách được Bill Gates và Barack Obama nhiệt liệt khuyên đọc."
        },
        {
            id: "book_05",
            title: "Mắt Biếc (Tái Bản Đặc Biệt)",
            authorId: "auth_nguyen_nhat_anh",
            authorName: "Nguyễn Nhật Ánh",
            categoryId: "cat_vanhoc",
            categoryName: "Văn Học & Tiểu Thuyết",
            subCategoryId: "cat_vanhoc_vn",
            subCategoryName: "Văn học Việt Nam",
            publisherId: "pub_tre",
            publisherName: "NXB Trẻ",
            price: 110000,
            originalPrice: 135000,
            discountPercent: 18,
            coverImage: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=800&q=80",
            gallery: [
                "https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=800&q=80"
            ],
            rating: 4.88,
            reviewCount: 140,
            soldCount: 3500,
            stock: 90,
            pages: 296,
            publishYear: 2025,
            isbn: "978-6041123456",
            language: "Tiếng Việt",
            format: "Bìa Mềm Tay Gấp",
            isNew: true,
            isBestseller: true,
            isFeatured: true,
            isFlashSale: false,
            description: "Câu chuyện tình buồn thuần khiết giữa Ngạn và Hà Lan nơi làng Đo Đo mộng mơ. Bản in tái bản kỷ niệm với phụ bản tranh màu tuyệt đẹp.",
            highlight: "Tác phẩm lãng mạn kinh điển của văn học đương đại Việt Nam."
        },
        {
            id: "book_06",
            title: "Mật Mã Da Vinci (The Da Vinci Code)",
            authorId: "auth_dan_brown",
            authorName: "Dan Brown",
            categoryId: "cat_vanhoc",
            categoryName: "Văn Học & Tiểu Thuyết",
            subCategoryId: "cat_vanhoc_trinhtham",
            subCategoryName: "Trinh thám & Ly kỳ",
            publisherId: "pub_nhanam",
            publisherName: "Nhã Nam",
            price: 175000,
            originalPrice: 220000,
            discountPercent: 20,
            coverImage: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=800&q=80",
            gallery: [
                "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=800&q=80"
            ],
            rating: 4.8,
            reviewCount: 95,
            soldCount: 1600,
            stock: 40,
            pages: 520,
            publishYear: 2024,
            isbn: "978-0307474278",
            language: "Tiếng Việt",
            format: "Bìa Mềm",
            isNew: false,
            isBestseller: false,
            isFeatured: true,
            isFlashSale: false,
            description: "Giáo sư Robert Langdon bị cuốn vào vụ án mạng tại bảo tàng Louvre và phát hiện ra một bí mật lịch sử ngàn năm bị giấu kín.",
            highlight: "Cuốn tiểu thuyết trinh thám bán chạy nhất mọi thời đại."
        },
        {
            id: "book_07",
            title: "Designing Data-Intensive Applications",
            authorId: "auth_uncle_bob",
            authorName: "Martin Kleppmann",
            categoryId: "cat_cntt",
            categoryName: "Công Nghệ & Lập Trình",
            subCategoryId: "cat_cntt_arch",
            subCategoryName: "Kiến trúc Phần mềm & Clean Code",
            publisherId: "pub_oreilly",
            publisherName: "O'Reilly Media",
            price: 380000,
            originalPrice: 450000,
            discountPercent: 15,
            coverImage: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80",
            gallery: [
                "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80"
            ],
            rating: 4.98,
            reviewCount: 88,
            soldCount: 950,
            stock: 35,
            pages: 616,
            publishYear: 2025,
            isbn: "978-1449373320",
            language: "Tiếng Anh & Phụ đề VN",
            format: "Bìa Cứng",
            isNew: true,
            isBestseller: true,
            isFeatured: true,
            isFlashSale: false,
            description: "Cẩm nang tối thượng về hệ thống phân tán, cơ sở dữ liệu quy mô lớn, replication, partitioning, consistency và stream processing.",
            highlight: "Kinh thánh của các kỹ sư Backend và Cloud Architect."
        },
        {
            id: "book_08",
            title: "Vũ Trụ Trong Vỏ Hạt Dẻ",
            authorId: "auth_yuval_harari",
            authorName: "Stephen Hawking",
            categoryId: "cat_khoahoc",
            categoryName: "Khoa Học & Vũ Trụ",
            subCategoryId: "cat_khoahoc_vutru",
            subCategoryName: "Thiên văn & Vũ trụ",
            publisherId: "pub_tre",
            publisherName: "NXB Trẻ",
            price: 165000,
            originalPrice: 200000,
            discountPercent: 17,
            coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
            gallery: [
                "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80"
            ],
            rating: 4.82,
            reviewCount: 64,
            soldCount: 820,
            stock: 50,
            pages: 280,
            publishYear: 2024,
            isbn: "978-0553802023",
            language: "Tiếng Việt",
            format: "Bìa Cứng In Màu",
            isNew: false,
            isBestseller: false,
            isFeatured: false,
            isFlashSale: false,
            description: "Khám phá các bí ẩn của lỗ đen, thuyết tương đối rộng, cơ học lượng tử và thời gian đa chiều qua lối dẫn chuyện hài hước của Stephen Hawking.",
            highlight: "Sách khoa học thường thức minh họa màu đẹp nhất."
        },
        {
            id: "book_09",
            title: "Khởi Nghiệp Tinh Gọn (The Lean Startup)",
            authorId: "auth_morgan_housel",
            authorName: "Eric Ries",
            categoryId: "cat_kinhte",
            categoryName: "Kinh Tế & Khởi Nghiệp",
            subCategoryId: "cat_kinhte_startup",
            subCategoryName: "Khởi nghiệp & Đổi mới",
            publisherId: "pub_nhanam",
            publisherName: "Nhã Nam",
            price: 168000,
            originalPrice: 210000,
            discountPercent: 20,
            coverImage: "https://images.unsplash.com/photo-1553484771-371a605b060b?auto=format&fit=crop&w=800&q=80",
            gallery: [
                "https://images.unsplash.com/photo-1553484771-371a605b060b?auto=format&fit=crop&w=800&q=80"
            ],
            rating: 4.76,
            reviewCount: 78,
            soldCount: 1400,
            stock: 45,
            pages: 352,
            publishYear: 2024,
            isbn: "978-0307887894",
            language: "Tiếng Việt",
            format: "Bìa Mềm",
            isNew: false,
            isBestseller: false,
            isFeatured: true,
            isFlashSale: false,
            description: "Phương pháp tạo ra sản phẩm MVP, kiểm chứng giả thuyết kinh doanh và lặp nhanh để tránh lãng phí nguồn lực.",
            highlight: "Kim chỉ nam cho mọi Startup và Founder công nghệ."
        },
        {
            id: "book_10",
            title: "Khắc Kỷ - Lối Sống Tự Do Giữa Đời Biến Động",
            authorId: "auth_james_clear",
            authorName: "Massimo Pigliucci",
            categoryId: "cat_lichsu",
            categoryName: "Lịch Sử & Triết Học",
            subCategoryId: "cat_triethoc_cotrung",
            subCategoryName: "Triết học Khắc kỷ",
            publisherId: "pub_tre",
            publisherName: "NXB Trẻ",
            price: 135000,
            originalPrice: 165000,
            discountPercent: 18,
            coverImage: "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?auto=format&fit=crop&w=800&q=80",
            gallery: [
                "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?auto=format&fit=crop&w=800&q=80"
            ],
            rating: 4.84,
            reviewCount: 52,
            soldCount: 1100,
            stock: 70,
            pages: 310,
            publishYear: 2025,
            isbn: "978-0465097951",
            language: "Tiếng Việt",
            format: "Bìa Mềm",
            isNew: true,
            isBestseller: false,
            isFeatured: false,
            isFlashSale: false,
            description: "Ứng dụng triết học Khắc kỷ của Epictetus, Seneca và Marcus Aurelius để rèn luyện nội tâm an nhiên trước mọi sóng gió cuộc sống.",
            highlight: "Nghệ thuật làm chủ tâm trí trong kỷ nguyên số."
        }
    ],

    coupons: [
        { code: "BOOK20", discount: 20000, minSpend: 200000, description: "Giảm 20.000đ cho đơn từ 200.000đ" },
        { code: "FREESHIP", discount: 30000, minSpend: 250000, description: "Miễn phí vận chuyển (Tối đa 30.000đ) đơn từ 250.000đ" },
        { code: "VIP50", discount: 50000, minSpend: 400000, description: "Giảm ngay 50.000đ cho đơn hàng hội viên từ 400.000đ" }
    ],

    demoUsers: [
        {
            id: "user_quang_01",
            name: "Trịnh Quang",
            email: "quang@booknest.vn",
            role: "ROLE_CUSTOMER",
            phone: "0912 345 678",
            avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
            favoriteCategories: ["cat_cntt", "cat_kinhte", "cat_tamly", "cat_khoahoc", "cat_lichsu"],
            addresses: [
                {
                    id: "addr_01",
                    fullName: "Trịnh Quang",
                    phone: "0912 345 678",
                    address: "Tòa nhà Bitexco, 2 Hải Triều, Bến Nghé, Quận 1, TP. Hồ Chí Minh",
                    isDefault: true
                },
                {
                    id: "addr_02",
                    fullName: "Trịnh Quang (Văn phòng)",
                    phone: "0912 345 678",
                    address: "Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh",
                    isDefault: false
                }
            ]
        },
        {
            id: "admin_minhanh_01",
            name: "Minh Anh (Admin)",
            email: "admin@booknest.vn",
            role: "ROLE_ADMIN",
            phone: "0988 888 999",
            avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80"
        }
    ],

    orders: [
        {
            id: "ORD-98241",
            orderDate: "2026-09-25T14:30:00",
            customerName: "Trịnh Quang",
            customerPhone: "0912 345 678",
            deliveryAddress: "Tòa nhà Bitexco, 2 Hải Triều, Bến Nghé, Quận 1, TP. Hồ Chí Minh",
            items: [
                { bookId: "book_01", title: "Clean Code - Mã Sạch Trong Nghệ Thuật Phần Mềm", price: 245000, quantity: 1, coverImage: "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=800&q=80" },
                { bookId: "book_02", title: "Atomic Habits - Thay Đổi Tí Hon, Hiệu Quả Bất Ngờ", price: 159000, quantity: 1, coverImage: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80" }
            ],
            subtotal: 404000,
            couponDiscount: 20000,
            shippingFee: 0,
            totalAmount: 384000,
            paymentMethod: "VIETQR",
            paymentStatus: "PAID",
            orderStatus: "SHIPPING",
            qrCodeUrl: "https://api.vietqr.io/image/970422-0912345678-qrl81a0.jpg?accountName=BOOKSTORE%20OFFICIAL&amount=384000&addInfo=ORD98241"
        },
        {
            id: "ORD-87123",
            orderDate: "2026-09-20T09:15:00",
            customerName: "Trịnh Quang",
            customerPhone: "0912 345 678",
            deliveryAddress: "Tòa nhà Bitexco, 2 Hải Triều, Bến Nghé, Quận 1, TP. Hồ Chí Minh",
            items: [
                { bookId: "book_03", title: "Tâm Lý Học Về Tiền - Những Bài Học Bất Biến Về Sự Giàu Có", price: 142000, quantity: 2, coverImage: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80" }
            ],
            subtotal: 284000,
            couponDiscount: 0,
            shippingFee: 25000,
            totalAmount: 309000,
            paymentMethod: "COD",
            paymentStatus: "PAID",
            orderStatus: "COMPLETED"
        }
    ],

    reviews: [
        {
            id: "rev_01",
            bookId: "book_01",
            userName: "Hoàng Long",
            userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
            rating: 5,
            date: "2026-09-24",
            comment: "Sách viết cực kỳ hay và sâu sắc. Mọi lập trình viên đều nên gối đầu giường cuốn này! Giấy in chất lượng, đóng gói rất cẩn thận."
        },
        {
            id: "rev_02",
            bookId: "book_01",
            userName: "Trần Mai Anh",
            userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
            rating: 5,
            date: "2026-09-21",
            comment: "Bản dịch tiếng Việt rất mượt mà và chuẩn thuật ngữ công nghệ. Giao hàng VietQR nhanh trong vòng 2 tiếng!"
        }
    ],

    adminStats: {
        totalRevenue: 124850000,
        monthlyOrders: 428,
        totalBooksInStock: 1540,
        activeCustomers: 890,
        monthlyRevenueData: [45, 52, 60, 58, 72, 85, 94, 110, 105, 118, 124, 138],
        categoryRevenueBreakdown: [
            { label: "Công Nghệ IT", percent: 35, color: "#4f46e5" },
            { label: "Tâm Lý Kỹ Năng", percent: 25, color: "#06b6d4" },
            { label: "Kinh Tế", percent: 20, color: "#f59e0b" },
            { label: "Văn Học", percent: 12, color: "#10b981" },
            { label: "Khác", percent: 8, color: "#8b5cf6" }
        ]
    }
};
