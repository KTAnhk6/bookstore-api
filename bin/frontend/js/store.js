/**
 * BOOKNEST STATE STORE & REACTIVE DATA MANAGER
 * Manages Cart, Wishlist, Current User Auth, 5 Favorite Genres,
 * Admin Mock DB, Currency & Date Formatters.
 */

class BookNestStore {
    constructor() {
        this.initStorage();
        this.listeners = [];
    }

    initStorage() {
        // Initialize books from mock data if not in localStorage
        if (!localStorage.getItem('booknest_books')) {
            localStorage.setItem('booknest_books', JSON.stringify(BOOKNEST_DATA.books));
        }

        // Initialize categories
        if (!localStorage.getItem('booknest_categories')) {
            localStorage.setItem('booknest_categories', JSON.stringify(BOOKNEST_DATA.categories));
        }

        // Initialize authors
        if (!localStorage.getItem('booknest_authors')) {
            localStorage.setItem('booknest_authors', JSON.stringify(BOOKNEST_DATA.authors));
        }

        // Initialize publishers
        if (!localStorage.getItem('booknest_publishers')) {
            localStorage.setItem('booknest_publishers', JSON.stringify(BOOKNEST_DATA.publishers));
        }

        // Initialize orders
        if (!localStorage.getItem('booknest_orders')) {
            localStorage.setItem('booknest_orders', JSON.stringify(BOOKNEST_DATA.orders));
        }

        // Initialize reviews
        if (!localStorage.getItem('booknest_reviews')) {
            localStorage.setItem('booknest_reviews', JSON.stringify(BOOKNEST_DATA.reviews));
        }

        // Initialize Cart
        if (!localStorage.getItem('booknest_cart')) {
            localStorage.setItem('booknest_cart', JSON.stringify([]));
        }

        // Initialize Wishlist
        if (!localStorage.getItem('booknest_wishlist')) {
            localStorage.setItem('booknest_wishlist', JSON.stringify(["book_01", "book_03"]));
        }

        // Auto login with default demo user if not logged in
        if (!localStorage.getItem(API_CONFIG.USER_KEY)) {
            const defaultUser = BOOKNEST_DATA.demoUsers[0];
            localStorage.setItem(API_CONFIG.USER_KEY, JSON.stringify(defaultUser));
            localStorage.setItem(API_CONFIG.TOKEN_KEY, "mock_jwt_token_" + btoa(JSON.stringify(defaultUser)));
        }

        // Current Role ('customer' | 'admin')
        if (!localStorage.getItem('booknest_active_role')) {
            localStorage.setItem('booknest_active_role', 'customer');
        }
    }

    // Auth & User Management
    get currentUser() {
        try {
            return JSON.parse(localStorage.getItem(API_CONFIG.USER_KEY));
        } catch (e) {
            return null;
        }
    }

    get activeRole() {
        return localStorage.getItem('booknest_active_role') || 'customer';
    }

    setRole(role) {
        localStorage.setItem('booknest_active_role', role);
        this.notify('role_changed', role);
    }

    toggleRole() {
        const nextRole = this.activeRole === 'customer' ? 'admin' : 'customer';
        this.setRole(nextRole);
        return nextRole;
    }

    setUser(user, token) {
        if (user) {
            localStorage.setItem(API_CONFIG.USER_KEY, JSON.stringify(user));
            if (token) localStorage.setItem(API_CONFIG.TOKEN_KEY, token);
        } else {
            localStorage.removeItem(API_CONFIG.USER_KEY);
            localStorage.removeItem(API_CONFIG.TOKEN_KEY);
        }
        this.notify('auth_changed', user);
    }

    logout() {
        this.setUser(null, null);
        this.setRole('customer');
        this.notify('auth_changed', null);
    }

    // 5 Favorite Categories (Onboarding & Suggestions)
    getFavoriteCategories() {
        const user = this.currentUser;
        if (user && user.favoriteCategories && user.favoriteCategories.length > 0) {
            return user.favoriteCategories;
        }
        return ["cat_cntt", "cat_kinhte", "cat_tamly", "cat_khoahoc", "cat_lichsu"];
    }

    saveFavoriteCategories(categoryIds) {
        const user = this.currentUser;
        if (user) {
            user.favoriteCategories = categoryIds;
            localStorage.setItem(API_CONFIG.USER_KEY, JSON.stringify(user));
        }
        localStorage.setItem('booknest_user_favorite_genres', JSON.stringify(categoryIds));
        this.notify('favorites_updated', categoryIds);
        return { success: true, message: "Đã lưu 5 thể loại yêu thích thành công!" };
    }

    // Books Database Management
    getBooks() {
        try {
            return JSON.parse(localStorage.getItem('booknest_books')) || BOOKNEST_DATA.books;
        } catch (e) {
            return BOOKNEST_DATA.books;
        }
    }

    addBook(bookData) {
        const books = this.getBooks();
        const newBook = {
            id: "book_" + Date.now(),
            rating: 5.0,
            reviewCount: 0,
            soldCount: 0,
            isNew: true,
            isBestseller: false,
            isFeatured: false,
            isFlashSale: false,
            gallery: [bookData.coverImage || "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=800&q=80"],
            ...bookData
        };
        books.unshift(newBook);
        localStorage.setItem('booknest_books', JSON.stringify(books));
        this.notify('books_changed', books);
        return newBook;
    }

    updateBook(id, bookData) {
        let books = this.getBooks();
        const index = books.findIndex(b => b.id === id);
        if (index !== -1) {
            books[index] = { ...books[index], ...bookData };
            localStorage.setItem('booknest_books', JSON.stringify(books));
            this.notify('books_changed', books);
            return books[index];
        }
        throw new Error("Không tìm thấy sách để cập nhật!");
    }

    deleteBook(id) {
        let books = this.getBooks();
        books = books.filter(b => b.id !== id);
        localStorage.setItem('booknest_books', JSON.stringify(books));
        this.notify('books_changed', books);
        return { success: true, message: "Đã xoá sách thành công!" };
    }

    // Categories Management
    getCategories() {
        try {
            return JSON.parse(localStorage.getItem('booknest_categories')) || BOOKNEST_DATA.categories;
        } catch (e) {
            return BOOKNEST_DATA.categories;
        }
    }

    addCategory(catData) {
        const categories = this.getCategories();
        const newCat = {
            id: "cat_" + Date.now(),
            icon: catData.icon || "fa-solid fa-bookmark",
            children: [],
            ...catData
        };

        if (catData.parentId) {
            // Find parent and add to its children
            const parent = categories.find(c => c.id === catData.parentId);
            if (parent) {
                if (!parent.children) parent.children = [];
                parent.children.push(newCat);
            }
        } else {
            categories.push(newCat);
        }

        localStorage.setItem('booknest_categories', JSON.stringify(categories));
        this.notify('categories_changed', categories);
        return newCat;
    }

    updateCategory(id, catData) {
        const categories = this.getCategories();
        const updateRecursive = (list) => {
            for (let i = 0; i < list.length; i++) {
                if (list[i].id === id) {
                    list[i] = { ...list[i], ...catData };
                    return true;
                }
                if (list[i].children && updateRecursive(list[i].children)) return true;
            }
            return false;
        };
        updateRecursive(categories);
        localStorage.setItem('booknest_categories', JSON.stringify(categories));
        this.notify('categories_changed', categories);
        return catData;
    }

    deleteCategory(id) {
        let categories = this.getCategories();
        const deleteRecursive = (list) => {
            const index = list.findIndex(c => c.id === id);
            if (index !== -1) {
                list.splice(index, 1);
                return true;
            }
            for (let item of list) {
                if (item.children && deleteRecursive(item.children)) return true;
            }
            return false;
        };
        deleteRecursive(categories);
        localStorage.setItem('booknest_categories', JSON.stringify(categories));
        this.notify('categories_changed', categories);
        return { success: true };
    }

    // Authors & Publishers
    getAuthors() {
        return JSON.parse(localStorage.getItem('booknest_authors')) || BOOKNEST_DATA.authors;
    }

    addAuthor(author) {
        const list = this.getAuthors();
        const newAuth = { id: "auth_" + Date.now(), ...author };
        list.push(newAuth);
        localStorage.setItem('booknest_authors', JSON.stringify(list));
        return newAuth;
    }

    updateAuthor(id, author) {
        let list = this.getAuthors();
        const idx = list.findIndex(a => a.id === id);
        if (idx !== -1) {
            list[idx] = { ...list[idx], ...author };
            localStorage.setItem('booknest_authors', JSON.stringify(list));
            return list[idx];
        }
    }

    deleteAuthor(id) {
        let list = this.getAuthors().filter(a => a.id !== id);
        localStorage.setItem('booknest_authors', JSON.stringify(list));
        return { success: true };
    }

    getPublishers() {
        return JSON.parse(localStorage.getItem('booknest_publishers')) || BOOKNEST_DATA.publishers;
    }

    addPublisher(pub) {
        const list = this.getPublishers();
        const newPub = { id: "pub_" + Date.now(), ...pub };
        list.push(newPub);
        localStorage.setItem('booknest_publishers', JSON.stringify(list));
        return newPub;
    }

    updatePublisher(id, pub) {
        let list = this.getPublishers();
        const idx = list.findIndex(p => p.id === id);
        if (idx !== -1) {
            list[idx] = { ...list[idx], ...pub };
            localStorage.setItem('booknest_publishers', JSON.stringify(list));
            return list[idx];
        }
    }

    deletePublisher(id) {
        let list = this.getPublishers().filter(p => p.id !== id);
        localStorage.setItem('booknest_publishers', JSON.stringify(list));
        return { success: true };
    }

    // Shopping Cart State
    getCart() {
        try {
            return JSON.parse(localStorage.getItem('booknest_cart')) || [];
        } catch (e) {
            return [];
        }
    }

    addToCart(book, quantity = 1) {
        const cart = this.getCart();
        const existingIndex = cart.findIndex(item => item.bookId === book.id);

        if (existingIndex > -1) {
            cart[existingIndex].quantity += quantity;
        } else {
            cart.push({
                bookId: book.id,
                title: book.title,
                price: book.price,
                originalPrice: book.originalPrice,
                coverImage: book.coverImage,
                authorName: book.authorName,
                quantity: quantity
            });
        }

        localStorage.setItem('booknest_cart', JSON.stringify(cart));
        this.notify('cart_changed', cart);
        return cart;
    }

    updateCartQuantity(bookId, quantity) {
        let cart = this.getCart();
        if (quantity <= 0) {
            cart = cart.filter(item => item.bookId !== bookId);
        } else {
            const item = cart.find(i => i.bookId === bookId);
            if (item) item.quantity = quantity;
        }
        localStorage.setItem('booknest_cart', JSON.stringify(cart));
        this.notify('cart_changed', cart);
        return cart;
    }

    removeFromCart(bookId) {
        let cart = this.getCart().filter(item => item.bookId !== bookId);
        localStorage.setItem('booknest_cart', JSON.stringify(cart));
        this.notify('cart_changed', cart);
        return cart;
    }

    clearCart() {
        localStorage.setItem('booknest_cart', JSON.stringify([]));
        this.notify('cart_changed', []);
    }

    getCartCount() {
        const cart = this.getCart();
        return cart.reduce((sum, item) => sum + item.quantity, 0);
    }

    getCartSubtotal() {
        const cart = this.getCart();
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    // Wishlist State
    getWishlist() {
        try {
            return JSON.parse(localStorage.getItem('booknest_wishlist')) || [];
        } catch (e) {
            return [];
        }
    }

    toggleWishlist(bookId) {
        let wishlist = this.getWishlist();
        let isFavorited = false;
        if (wishlist.includes(bookId)) {
            wishlist = wishlist.filter(id => id !== bookId);
            isFavorited = false;
        } else {
            wishlist.push(bookId);
            isFavorited = true;
        }
        localStorage.setItem('booknest_wishlist', JSON.stringify(wishlist));
        this.notify('wishlist_changed', wishlist);
        return isFavorited;
    }

    isWishlisted(bookId) {
        return this.getWishlist().includes(bookId);
    }

    // Recommendations Engine (based on 5 favorite genres)
    getRecommendedBooks() {
        const favGenreIds = this.getFavoriteCategories();
        const allBooks = this.getBooks();

        // Books matching user's 5 favorite categories
        const matched = allBooks.filter(book => favGenreIds.includes(book.categoryId) || favGenreIds.includes(book.subCategoryId));
        
        // If matched is less than 4, append other popular/bestseller books
        if (matched.length < 4) {
            const others = allBooks.filter(b => !matched.find(m => m.id === b.id));
            return [...matched, ...others];
        }
        return matched;
    }

    // Orders Management
    getAllOrders() {
        return JSON.parse(localStorage.getItem('booknest_orders')) || BOOKNEST_DATA.orders;
    }

    getMyOrders() {
        const user = this.currentUser;
        const all = this.getAllOrders();
        if (!user) return all;
        return all.filter(o => o.customerName === user.name || o.customerPhone === user.phone);
    }

    createOrder(orderData) {
        const orders = this.getAllOrders();
        const orderId = "ORD-" + Math.floor(10000 + Math.random() * 90000);
        const newOrder = {
            id: orderId,
            orderDate: new Date().toISOString(),
            orderStatus: "PROCESSING",
            paymentStatus: orderData.paymentMethod === 'VIETQR' ? "PAID" : "PENDING",
            qrCodeUrl: orderData.paymentMethod === 'VIETQR' 
                ? `https://api.vietqr.io/image/970422-0912345678-qrl81a0.jpg?accountName=BOOKSTORE%20OFFICIAL&amount=${orderData.totalAmount}&addInfo=${orderId.replace('-', '')}`
                : null,
            ...orderData
        };
        orders.unshift(newOrder);
        localStorage.setItem('booknest_orders', JSON.stringify(orders));
        this.clearCart();
        this.notify('order_created', newOrder);
        return newOrder;
    }

    updateOrderStatus(orderId, status) {
        const orders = this.getAllOrders();
        const order = orders.find(o => o.id === orderId);
        if (order) {
            order.orderStatus = status;
            localStorage.setItem('booknest_orders', JSON.stringify(orders));
            this.notify('order_updated', order);
            return order;
        }
        throw new Error("Không tìm thấy đơn hàng!");
    }

    // Reviews Management
    getBookReviews(bookId) {
        const all = JSON.parse(localStorage.getItem('booknest_reviews')) || BOOKNEST_DATA.reviews;
        return all.filter(r => r.bookId === bookId);
    }

    addReview(bookId, reviewData) {
        const all = JSON.parse(localStorage.getItem('booknest_reviews')) || BOOKNEST_DATA.reviews;
        const user = this.currentUser || { name: "Khách Ẩn Danh", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80" };
        const newRev = {
            id: "rev_" + Date.now(),
            bookId: bookId,
            userName: user.name,
            userAvatar: user.avatar,
            rating: reviewData.rating || 5,
            date: new Date().toISOString().split('T')[0],
            comment: reviewData.comment
        };
        all.unshift(newRev);
        localStorage.setItem('booknest_reviews', JSON.stringify(all));
        return newRev;
    }

    // Admin Dashboard Stats
    getAdminStats() {
        const orders = this.getAllOrders();
        const books = this.getBooks();
        const totalRevenue = orders.reduce((sum, o) => sum + (o.paymentStatus === 'PAID' ? o.totalAmount : 0), 0) + 120000000;
        const totalStock = books.reduce((sum, b) => sum + (b.stock || 0), 0);

        return {
            totalRevenue: totalRevenue,
            monthlyOrders: orders.length + 420,
            totalBooksInStock: totalStock,
            activeCustomers: 890,
            monthlyRevenueData: BOOKNEST_DATA.adminStats.monthlyRevenueData,
            categoryRevenueBreakdown: BOOKNEST_DATA.adminStats.categoryRevenueBreakdown,
            recentOrders: orders.slice(0, 6)
        };
    }

    // Event Subscription
    subscribe(callback) {
        this.listeners.push(callback);
    }

    notify(event, data) {
        this.listeners.forEach(cb => {
            try { cb(event, data); } catch (e) { console.error(e); }
        });
    }

    // Utility Formatters
    formatCurrency(amount) {
        if (typeof amount !== 'number') amount = Number(amount) || 0;
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    }

    formatDate(dateStr) {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
}

// Global Store Instance
const store = new BookNestStore();
