/**
 * BOOKNEST API CLIENT
 * Kết nối Spring Boot backend (/api/...) bằng JWT. Mọi hàm trả về dữ liệu đã chuyển
 * sang dạng mà giao diện dùng (id dạng chuỗi, giá hiệu lực, tên tác giả...).
 */

const API_CONFIG = {
    BASE_URL: 'http://localhost:8080/api',
    TIMEOUT: 20000,
    TOKEN_KEY: 'booknest_jwt_token',
    USER_KEY: 'booknest_user_profile'
};

const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
});

apiClient.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const status = error.response ? error.response.status : null;
        const body = error.response && error.response.data;
        let message = 'Đã có lỗi xảy ra khi kết nối máy chủ!';

        if (!error.response) {
            message = 'Không kết nối được máy chủ (http://localhost:8080). Hãy chắc chắn backend đang chạy.';
        } else if (body && body.data && typeof body.data === 'object' && !Array.isArray(body.data)) {
            message = Object.values(body.data).join('. ') || body.message || message;
        } else if (body && body.message) {
            message = body.message;
        } else if (status === 401) {
            message = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!';
        } else if (status === 403) {
            message = 'Bạn không có quyền thực hiện hành động này!';
        } else if (status === 404) {
            message = 'Không tìm thấy dữ liệu yêu cầu!';
        }

        const url = (error.config && error.config.url) || '';
        if (status === 401 && localStorage.getItem(API_CONFIG.TOKEN_KEY) && !url.startsWith('/auth/login')) {
            store.logout();
            message = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!';
        }
        return Promise.reject({ status, message, rawError: error });
    }
);

/* ---------------------------------------------------------------------------
 * Bộ chuyển đổi DTO backend -> đối tượng giao diện
 * ------------------------------------------------------------------------- */
// Escape văn bản người dùng/dữ liệu DB trước khi chèn vào HTML
const esc = (v) => String(v === null || v === undefined ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const num = (v) => (v === null || v === undefined ? 0 : Number(v));
const idOf = (v) => (v === null || v === undefined ? null : String(v));

const Adapter = {
    book(d) {
        const price = num(d.price);
        const sale = d.salePrice === null || d.salePrice === undefined ? 0 : num(d.salePrice);
        const onSale = sale > 0 && sale < price;
        const cats = d.categories || [];
        const authors = d.authors || [];
        const created = d.createdAt ? new Date(d.createdAt).getTime() : 0;
        const cover = d.coverImage || app.getBookPlaceholder(d.title, cats[0] && cats[0].name);
        const book = {
            id: idOf(d.id),
            title: d.title,
            slug: d.slug,
            isbn: d.isbn,
            description: d.description || '',
            price: onSale ? sale : price,
            originalPrice: onSale ? price : null,
            listPrice: price,
            salePriceRaw: d.salePrice === null || d.salePrice === undefined ? null : num(d.salePrice),
            discountPercent: onSale ? Math.round((1 - sale / price) * 100) : 0,
            authors: authors.map(a => ({ id: idOf(a.id), name: a.name })),
            authorName: authors.map(a => a.name).join(', ') || 'Đang cập nhật',
            categories: cats.map(c => ({ id: idOf(c.id), name: c.name })),
            categoryId: cats[0] ? idOf(cats[0].id) : null,
            categoryName: cats[0] ? cats[0].name : 'Sách',
            publisherId: idOf(d.publisherId || (d.publisher && d.publisher.id)),
            publisherName: d.publisherName || (d.publisher && d.publisher.name) || '',
            rating: num(d.averageRating),
            reviewCount: num(d.reviewCount),
            soldCount: num(d.soldQuantity),
            stock: num(d.stockQuantity),
            pages: d.pageCount || null,
            publishYear: d.publishYear || null,
            language: d.language || 'Tiếng Việt',
            dimensions: d.dimensions || '',
            weight: d.weight || null,
            coverImage: cover,
            rawCoverImage: d.coverImage || '',
            gallery: [cover],
            status: d.status,
            isNew: created > 0 && Date.now() - created < 30 * 86400000,
            isFlashSale: onSale,
            createdAt: d.createdAt,
            relatedBooks: (d.relatedBooks || []).map(b => Adapter.book(b))
        };
        store.books.set(book.id, book); // sách đã tải được lưu đệm cho Xem Nhanh / Thêm giỏ
        return book;
    },

    cart(c) {
        const items = (c.items || []).map(i => {
            const original = num(i.originalPrice);
            const price = num(i.salePrice) || original;
            return {
                itemId: i.id,
                bookId: idOf(i.bookId),
                title: i.bookTitle,
                coverImage: i.bookCoverImage || app.getBookPlaceholder(i.bookTitle),
                authorName: i.authorName || '',
                price,
                originalPrice: original > price ? original : null,
                quantity: i.quantity,
                subtotal: num(i.subtotal),
                stock: num(i.stockQuantity),
                inStock: i.inStock !== false
            };
        });
        return {
            items,
            count: num(c.totalItems) || items.reduce((s, i) => s + i.quantity, 0),
            subtotal: num(c.subtotal),
            shippingFee: num(c.estimatedShippingFee),
            total: num(c.totalAmount)
        };
    },

    user(u) {
        return {
            id: idOf(u.id),
            username: u.username,
            name: u.fullName || u.username,
            fullName: u.fullName,
            email: u.email,
            phone: u.phone || '',
            avatar: u.avatar || '',
            gender: u.gender || '',
            birthday: u.birthday || '',
            role: u.role,
            isAdmin: u.role === 'ADMIN',
            isStaff: u.role === 'STAFF',
            loyaltyPoints: u.loyaltyPoints || 0,
            hasSetPreferences: !!u.hasSetPreferences,
            status: u.status,
            createdAt: u.createdAt,
            lastLoginAt: u.lastLoginAt
        };
    },

    address(a) {
        return { ...a, id: idOf(a.id) };
    },

    order(o) {
        return {
            id: idOf(o.id),
            orderCode: o.orderCode,
            orderDate: o.createdAt,
            orderStatus: o.status,
            paymentStatus: o.paymentStatus,
            paymentMethod: o.paymentMethod,
            subtotal: num(o.subtotal),
            shippingFee: num(o.shippingFee),
            discountAmount: num(o.discountAmount),
            totalAmount: num(o.totalAmount),
            couponCode: o.couponCode,
            shippingAddress: o.shippingAddress,
            note: o.note,
            customerName: o.customerName,
            customerPhone: o.customerPhone,
            customerEmail: o.customerEmail,
            items: (o.items || []).map(i => ({
                bookId: idOf(i.bookId),
                title: i.bookTitle,
                coverImage: i.bookCoverImage || app.getBookPlaceholder(i.bookTitle),
                price: num(i.price),
                quantity: i.quantity,
                subtotal: num(i.subtotal)
            }))
        };
    },

    review(r) {
        return {
            id: idOf(r.id),
            bookId: idOf(r.bookId),
            userId: idOf(r.userId),
            userName: r.userFullName || r.username || 'Ẩn danh',
            userAvatar: r.userAvatar || '',
            rating: r.rating,
            title: r.title || '',
            comment: r.comment || '',
            verified: !!r.isVerifiedPurchase,
            date: r.createdAt
        };
    },

    category(c) {
        return { id: idOf(c.id), name: c.name, slug: c.slug, description: c.description || '', icon: c.icon || '', image: c.image || '', displayOrder: c.displayOrder || 0, active: c.active !== false };
    },
    author(a) {
        return { ...a, id: idOf(a.id) };
    },
    publisher(p) {
        return { ...p, id: idOf(p.id) };
    },
    coupon(c) {
        return { ...c, id: idOf(c.id), discountValue: num(c.discountValue), minOrderAmount: num(c.minOrderAmount), maxDiscountAmount: c.maxDiscountAmount === null || c.maxDiscountAmount === undefined ? null : num(c.maxDiscountAmount), calculatedDiscount: num(c.calculatedDiscount) };
    },
    session(s) {
        return { ...s, amount: num(s.amount), receivedAmount: num(s.receivedAmount) };
    }
};

const unwrapList = (res, fn) => ({ items: (res.data || []).map(fn), pagination: res.pagination || null });
const asNumber = (id) => Number(id);
const clean = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== '' && v !== null && v !== undefined));

/* ---------------------------------------------------------------------------
 * Các dịch vụ API
 * ------------------------------------------------------------------------- */
const ApiService = {
    auth: {
        async login(usernameOrEmail, password, captchaToken = null) {
            const headers = captchaToken ? { 'X-Captcha-Token': captchaToken } : {};
            const res = await apiClient.post('/auth/login', { usernameOrEmail, password, captchaToken }, { headers });
            return { token: res.data.token, user: Adapter.user(res.data.user) };
        },
        async register(payload, captchaToken = null) {
            const token = captchaToken || payload.captchaToken;
            const headers = token ? { 'X-Captcha-Token': token } : {};
            const res = await apiClient.post('/auth/register', { ...payload, captchaToken: token }, { headers });
            return res.data;
        },
        forgotPassword: (emailOrUsername, captchaToken = null) => {
            const headers = captchaToken ? { 'X-Captcha-Token': captchaToken } : {};
            return apiClient.post('/auth/forgot-password', { emailOrUsername, captchaToken }, { headers });
        },
        resetPassword: (token, newPassword) => apiClient.post('/auth/reset-password', { token, newPassword }),
        async me() {
            const res = await apiClient.get('/auth/me');
            return Adapter.user(res.data);
        }
    },

    users: {
        async updateProfile(body) {
            const res = await apiClient.put('/users/me', clean(body));
            return Adapter.user(res.data);
        },
        changePassword: (currentPassword, newPassword) => apiClient.put('/users/me/change-password', { currentPassword, newPassword }),
        async favoriteCategories() {
            const res = await apiClient.get('/users/me/favorite-categories');
            return (res.data || []).map(Adapter.category);
        },
        async saveFavoriteCategories(ids) {
            const res = await apiClient.post('/users/me/favorite-categories', { categoryIds: ids.map(asNumber) });
            return (res.data || []).map(Adapter.category);
        }
    },

    addresses: {
        async list() {
            const res = await apiClient.get('/addresses');
            return (res.data || []).map(Adapter.address);
        },
        async create(body) { return Adapter.address((await apiClient.post('/addresses', body)).data); },
        async update(id, body) { return Adapter.address((await apiClient.put(`/addresses/${id}`, body)).data); },
        remove: (id) => apiClient.delete(`/addresses/${id}`),
        setDefault: (id) => apiClient.put(`/addresses/${id}/default`)
    },

    books: {
        async list(params = {}) {
            const res = await apiClient.get('/books', { params: clean(params) });
            return unwrapList(res, Adapter.book);
        },
        async get(id) { return Adapter.book((await apiClient.get(`/books/${id}`)).data); },
        async featured(limit = 8) { return ((await apiClient.get('/books/featured', { params: { limit } })).data || []).map(Adapter.book); },
        async bestsellers(limit = 8) { return ((await apiClient.get('/books/bestsellers', { params: { limit } })).data || []).map(Adapter.book); },
        async newest(limit = 8) { return ((await apiClient.get('/books/newest', { params: { limit } })).data || []).map(Adapter.book); }
    },

    categories: {
        async list() { return ((await apiClient.get('/categories')).data || []).map(Adapter.category); },
        async create(body) { return Adapter.category((await apiClient.post('/categories', body)).data); },
        async update(id, body) { return Adapter.category((await apiClient.put(`/categories/${id}`, body)).data); },
        remove: (id) => apiClient.delete(`/categories/${id}`)
    },

    authors: {
        async list() { return ((await apiClient.get('/authors')).data || []).map(Adapter.author); },
        async create(body) { return Adapter.author((await apiClient.post('/authors', body)).data); },
        async update(id, body) { return Adapter.author((await apiClient.put(`/authors/${id}`, body)).data); },
        remove: (id) => apiClient.delete(`/authors/${id}`)
    },

    publishers: {
        async list() { return ((await apiClient.get('/publishers')).data || []).map(Adapter.publisher); },
        async create(body) { return Adapter.publisher((await apiClient.post('/publishers', body)).data); },
        async update(id, body) { return Adapter.publisher((await apiClient.put(`/publishers/${id}`, body)).data); },
        remove: (id) => apiClient.delete(`/publishers/${id}`)
    },

    cart: {
        async get() { return Adapter.cart((await apiClient.get('/cart')).data); },
        async add(bookId, quantity = 1) { return Adapter.cart((await apiClient.post('/cart', { bookId: asNumber(bookId), quantity })).data); },
        async update(itemId, quantity) { return Adapter.cart((await apiClient.put(`/cart/items/${itemId}`, { quantity })).data); },
        async remove(itemId) { return Adapter.cart((await apiClient.delete(`/cart/items/${itemId}`)).data); },
        async clear() { await apiClient.delete('/cart'); }
    },

    coupons: {
        async list() { return ((await apiClient.get('/coupons')).data || []).map(Adapter.coupon); },
        async validate(code, orderAmount) {
            return Adapter.coupon((await apiClient.get('/coupons/validate', { params: { code, orderAmount } })).data);
        }
    },

    orders: {
        async create(body) { return Adapter.order((await apiClient.post('/orders', body)).data); },
        async list(params = {}) {
            return unwrapList(await apiClient.get('/orders', { params: clean({ size: 50, ...params }) }), Adapter.order);
        },
        async get(id) { return Adapter.order((await apiClient.get(`/orders/${id}`)).data); },
        async cancel(id, reason) { return Adapter.order((await apiClient.post(`/orders/${id}/cancel`, { reason })).data); }
    },

    qr: {
        async createSession(body) { return Adapter.session((await apiClient.post('/payments/qr/session', body)).data); },
        async active() {
            const res = await apiClient.get('/payments/qr/session/active');
            return res.data ? Adapter.session(res.data) : null;
        },
        async get(id) { return Adapter.session((await apiClient.get(`/payments/qr/session/${id}`)).data); },
        async check(id) { return Adapter.session((await apiClient.post(`/payments/qr/session/${id}/check`)).data); },
        async cancel(id) { return Adapter.session((await apiClient.post(`/payments/qr/session/${id}/cancel`)).data); }
    },

    reviews: {
        async byBook(bookId, params = {}) {
            return unwrapList(await apiClient.get(`/reviews/book/${bookId}`, { params: { size: 20, ...params } }), Adapter.review);
        },
        async summary(bookId) {
            const d = (await apiClient.get(`/reviews/book/${bookId}/summary`)).data;
            return { average: num(d.averageRating), total: num(d.totalReviews), starCounts: d.starCounts || {} };
        },
        async create(bookId, rating, title, comment) {
            return Adapter.review((await apiClient.post('/reviews', clean({ bookId: asNumber(bookId), rating, title, comment }))).data);
        }
    },

    wishlist: {
        async list() { return ((await apiClient.get('/wishlist')).data || []).map(Adapter.book); },
        add: (bookId) => apiClient.post(`/wishlist/${bookId}`),
        remove: (bookId) => apiClient.delete(`/wishlist/${bookId}`)
    },

    recommendations: {
        async forMe(limit = 12) { return ((await apiClient.get('/recommendations', { params: { limit } })).data || []).map(Adapter.book); }
    },

    admin: {
        async dashboard() { return (await apiClient.get('/admin/dashboard-stats')).data; },
        async orders(params = {}) {
            return unwrapList(await apiClient.get('/admin/orders', { params: clean({ size: 15, ...params }) }), Adapter.order);
        },
        async updateOrderStatus(id, status) {
            return Adapter.order((await apiClient.put(`/admin/orders/${id}/status`, null, { params: { status } })).data);
        },
        async users() { return ((await apiClient.get('/admin/users')).data || []).map(Adapter.user); },
        async updateUserRole(id, role) { return Adapter.user((await apiClient.put(`/admin/users/${id}/role`, { role })).data); },
        async updateUserStatus(id, status) { return Adapter.user((await apiClient.put(`/admin/users/${id}/status`, null, { params: { status } })).data); },
        async createBook(body) { return Adapter.book((await apiClient.post('/admin/books', body)).data); },
        async updateBook(id, body) { return Adapter.book((await apiClient.put(`/admin/books/${id}`, body)).data); },
        deleteBook: (id) => apiClient.delete(`/admin/books/${id}`),
        async coupons() { return ((await apiClient.get('/admin/coupons')).data || []).map(Adapter.coupon); },
        async createCoupon(body) { return Adapter.coupon((await apiClient.post('/admin/coupons', body)).data); },
        async updateCoupon(id, body) { return Adapter.coupon((await apiClient.put(`/admin/coupons/${id}`, body)).data); },
        async qrSessions() { return ((await apiClient.get('/payments/qr/admin/sessions')).data || []).map(Adapter.session); },
        async bankTransactions() { return (await apiClient.get('/payments/qr/admin/bank-transactions')).data || []; },
        syncBank: () => apiClient.post('/payments/qr/admin/sync')
    },

    async uploadImage(file) {
        const form = new FormData();
        form.append('file', file);
        const res = await apiClient.post('/v1/uploads/image', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        return res.data;
    }
};
