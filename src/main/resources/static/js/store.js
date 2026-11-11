/**
 * BOOKNEST STATE STORE
 * Bộ nhớ đệm phía trình duyệt cho dữ liệu lấy từ backend: người dùng đăng nhập, giỏ hàng,
 * danh sách yêu thích, thể loại yêu thích, danh mục/tác giả/nhà xuất bản. Dữ liệu gốc luôn
 * nằm ở database; mọi thao tác ghi đều đi qua ApiService rồi mới cập nhật bộ đệm này.
 */

class BookNestStore {
    constructor() {
        this.listeners = [];
        this.categories = [];
        this.authors = [];
        this.publishers = [];
        this.books = new Map();
        this.resetUserData();
    }

    resetUserData() {
        this.cart = { items: [], count: 0, subtotal: 0, shippingFee: 0, total: 0 };
        this.wishlistIds = [];
        this.favoriteCategoryIds = [];
    }

    // Khởi động: nạp danh mục công khai, và dữ liệu cá nhân nếu đã có token
    async init() {
        const publicLoads = Promise.all([
            ApiService.categories.list().then(l => { this.categories = l; }),
            ApiService.authors.list().then(l => { this.authors = l; }),
            ApiService.publishers.list().then(l => { this.publishers = l; })
        ]).catch(e => console.warn('Không nạp được danh mục công khai:', e.message));

        if (this.token) {
            try {
                const user = await ApiService.auth.me();
                localStorage.setItem(API_CONFIG.USER_KEY, JSON.stringify(user));
                await this.loadUserData();
            } catch (e) {
                if (e.status === 401 || e.status === 403) this.clearSession();
            }
        }
        await publicLoads;
    }

    async loadUserData() {
        await Promise.all([
            this.refreshCart(),
            this.refreshWishlist(),
            ApiService.users.favoriteCategories().then(l => { this.favoriteCategoryIds = l.map(c => c.id); }).catch(() => {})
        ]);
        this.notify('user_data_loaded');
    }

    // ---------- Phiên đăng nhập ----------
    get token() {
        return localStorage.getItem(API_CONFIG.TOKEN_KEY);
    }

    get currentUser() {
        if (!this.token) return null;
        try {
            return JSON.parse(localStorage.getItem(API_CONFIG.USER_KEY));
        } catch (e) {
            return null;
        }
    }

    get canAdmin() {
        const u = this.currentUser;
        return !!u && (u.role === 'ADMIN' || u.role === 'STAFF');
    }

    async setSession(user, token) {
        localStorage.setItem(API_CONFIG.TOKEN_KEY, token);
        localStorage.setItem(API_CONFIG.USER_KEY, JSON.stringify(user));
        this.notify('auth_changed', user);
        await this.loadUserData();
    }

    setUser(user) {
        localStorage.setItem(API_CONFIG.USER_KEY, JSON.stringify(user));
        this.notify('auth_changed', user);
    }

    clearSession() {
        localStorage.removeItem(API_CONFIG.TOKEN_KEY);
        localStorage.removeItem(API_CONFIG.USER_KEY);
        this.resetUserData();
    }

    logout() {
        this.clearSession();
        this.notify('auth_changed', null);
    }

    // ---------- Sách (bộ nhớ đệm từng cuốn đã tải) ----------
    cacheBooks(list) {
        list.forEach(b => this.books.set(b.id, b));
        return list;
    }

    getBook(id) {
        return this.books.get(String(id));
    }

    // ---------- Danh mục, tác giả, nhà xuất bản ----------
    getCategories() { return this.categories; }
    getAuthors() { return this.authors; }
    getPublishers() { return this.publishers; }

    async reloadCategories() {
        this.categories = await ApiService.categories.list();
        this.notify('categories_changed');
    }
    async reloadAuthors() { this.authors = await ApiService.authors.list(); }
    async reloadPublishers() { this.publishers = await ApiService.publishers.list(); }

    // ---------- Thể loại yêu thích ----------
    getFavoriteCategories() {
        return this.favoriteCategoryIds;
    }

    async saveFavoriteCategories(ids) {
        const saved = await ApiService.users.saveFavoriteCategories(ids);
        this.favoriteCategoryIds = saved.map(c => c.id);
        const user = this.currentUser;
        if (user) this.setUser({ ...user, hasSetPreferences: true });
        this.notify('favorites_updated', this.favoriteCategoryIds);
    }

    // ---------- Giỏ hàng ----------
    async refreshCart() {
        this.cart = await ApiService.cart.get();
        this.notify('cart_changed', this.cart);
    }

    setCart(cart) {
        this.cart = cart;
        this.notify('cart_changed', cart);
    }

    getCart() { return this.cart.items; }
    getCartCount() { return this.cart.count; }
    getCartSubtotal() { return this.cart.subtotal; }

    async addToCart(bookId, quantity = 1) {
        this.setCart(await ApiService.cart.add(bookId, quantity));
    }

    async updateCartQuantity(itemId, quantity) {
        this.setCart(quantity <= 0 ? await ApiService.cart.remove(itemId) : await ApiService.cart.update(itemId, quantity));
    }

    async removeFromCart(itemId) {
        this.setCart(await ApiService.cart.remove(itemId));
    }

    // ---------- Yêu thích ----------
    async refreshWishlist() {
        const books = await ApiService.wishlist.list();
        this.cacheBooks(books);
        this.wishlistIds = books.map(b => b.id);
        this.notify('wishlist_changed', this.wishlistIds);
        return books;
    }

    getWishlist() { return this.wishlistIds; }
    isWishlisted(bookId) { return this.wishlistIds.includes(String(bookId)); }

    async toggleWishlist(bookId) {
        bookId = String(bookId);
        if (this.isWishlisted(bookId)) {
            await ApiService.wishlist.remove(bookId);
            this.wishlistIds = this.wishlistIds.filter(id => id !== bookId);
        } else {
            await ApiService.wishlist.add(bookId);
            this.wishlistIds = [...this.wishlistIds, bookId];
        }
        this.notify('wishlist_changed', this.wishlistIds);
        return this.isWishlisted(bookId);
    }

    // ---------- Sự kiện ----------
    subscribe(callback) {
        this.listeners.push(callback);
    }

    notify(event, data) {
        this.listeners.forEach(cb => {
            try { cb(event, data); } catch (e) { console.error(e); }
        });
    }

    // ---------- Định dạng ----------
    formatCurrency(amount) {
        if (typeof amount !== 'number') amount = Number(amount) || 0;
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    }

    formatDate(dateStr) {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    formatDateTime(dateStr) {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
}

const store = new BookNestStore();
