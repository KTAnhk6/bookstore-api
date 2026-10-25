/**
 * BOOKNEST API CLIENT (Axios REST Integration & JWT Interceptor)
 * Connects to Spring Boot backend (/api/...) with JWT authentication headers,
 * request validation, error formatting, and seamless Mock fallback.
 */

const API_CONFIG = {
    BASE_URL: 'http://localhost:8080/api',
    TIMEOUT: 6000,
    TOKEN_KEY: 'booknest_jwt_token',
    USER_KEY: 'booknest_user_profile'
};

// Initialize Axios Instance
const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Request Interceptor: Attach JWT Token to Authorization Header
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle API Responses & Errors
apiClient.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        const status = error.response ? error.response.status : null;
        let errorMessage = "Đã có lỗi xảy ra khi kết nối máy chủ!";

        if (status === 401) {
            errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!";
            store.logout();
        } else if (status === 403) {
            errorMessage = "Bạn không có quyền thực hiện hành động này!";
        } else if (status === 404) {
            errorMessage = "Không tìm thấy dữ liệu yêu cầu!";
        } else if (status === 400 && error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
        } else if (!error.response) {
            console.warn("[API Network Fallback] Spring Boot API offline. Using local Mock database.");
        }

        // Return rejected promise with formatted message
        return Promise.reject({
            status: status,
            message: errorMessage,
            rawError: error
        });
    }
);

// High-Level Bookstore API Services
const ApiService = {
    // Auth Endpoints
    auth: {
        async login(email, password) {
            try {
                const res = await apiClient.post('/auth/login', { email, password });
                return res;
            } catch (err) {
                // Fallback demo mock auth
                const user = BOOKNEST_DATA.demoUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
                if (user) {
                    const mockToken = "mock_jwt_token_" + btoa(JSON.stringify(user));
                    return {
                        token: mockToken,
                        user: user
                    };
                }
                throw new Error("Email hoặc mật khẩu không chính xác!");
            }
        },

        async register(userData) {
            try {
                return await apiClient.post('/auth/register', userData);
            } catch (err) {
                // Fallback mock registration
                const newUser = {
                    id: "user_" + Date.now(),
                    name: userData.fullName || userData.name,
                    email: userData.email,
                    role: "ROLE_CUSTOMER",
                    phone: userData.phone || "",
                    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
                    favoriteCategories: [],
                    addresses: []
                };
                const mockToken = "mock_jwt_token_" + btoa(JSON.stringify(newUser));
                return {
                    token: mockToken,
                    user: newUser
                };
            }
        },

        async getProfile() {
            try {
                return await apiClient.get('/users/me');
            } catch (err) {
                return store.currentUser;
            }
        }
    },

    // Books Endpoints
    books: {
        async getAll(params = {}) {
            try {
                return await apiClient.get('/books', { params });
            } catch (err) {
                let books = store.getBooks();
                if (params.category) {
                    books = books.filter(b => b.categoryId === params.category || b.subCategoryId === params.category);
                }
                if (params.keyword) {
                    const kw = params.keyword.toLowerCase();
                    books = books.filter(b => b.title.toLowerCase().includes(kw) || b.authorName.toLowerCase().includes(kw));
                }
                if (params.authorId) {
                    books = books.filter(b => b.authorId === params.authorId);
                }
                if (params.publisherId) {
                    books = books.filter(b => b.publisherId === params.publisherId);
                }
                if (params.minPrice) {
                    books = books.filter(b => b.price >= Number(params.minPrice));
                }
                if (params.maxPrice) {
                    books = books.filter(b => b.price <= Number(params.maxPrice));
                }
                if (params.rating) {
                    books = books.filter(b => b.rating >= Number(params.rating));
                }
                if (params.sort) {
                    if (params.sort === 'price-asc') books.sort((a, b) => a.price - b.price);
                    else if (params.sort === 'price-desc') books.sort((a, b) => b.price - a.price);
                    else if (params.sort === 'rating') books.sort((a, b) => b.rating - a.rating);
                    else if (params.sort === 'bestseller') books.sort((a, b) => b.soldCount - a.soldCount);
                    else if (params.sort === 'new') books.sort((a, b) => b.publishYear - a.publishYear);
                }
                return books;
            }
        },

        async getById(id) {
            try {
                return await apiClient.get(`/books/${id}`);
            } catch (err) {
                const book = store.getBooks().find(b => b.id === id);
                if (book) return book;
                throw new Error("Không tìm thấy cuốn sách này!");
            }
        },

        async create(bookData) {
            try {
                return await apiClient.post('/books', bookData);
            } catch (err) {
                return store.addBook(bookData);
            }
        },

        async update(id, bookData) {
            try {
                return await apiClient.put(`/books/${id}`, bookData);
            } catch (err) {
                return store.updateBook(id, bookData);
            }
        },

        async delete(id) {
            try {
                return await apiClient.delete(`/books/${id}`);
            } catch (err) {
                return store.deleteBook(id);
            }
        }
    },

    // Categories Endpoints
    categories: {
        async getAll() {
            try {
                return await apiClient.get('/categories');
            } catch (err) {
                return store.getCategories();
            }
        },

        async create(catData) {
            try {
                return await apiClient.post('/categories', catData);
            } catch (err) {
                return store.addCategory(catData);
            }
        },

        async update(id, catData) {
            try {
                return await apiClient.put(`/categories/${id}`, catData);
            } catch (err) {
                return store.updateCategory(id, catData);
            }
        },

        async delete(id) {
            try {
                return await apiClient.delete(`/categories/${id}`);
            } catch (err) {
                return store.deleteCategory(id);
            }
        }
    },

    // Authors & Publishers Endpoints
    authors: {
        async getAll() {
            try { return await apiClient.get('/authors'); }
            catch (err) { return store.getAuthors(); }
        },
        async create(author) {
            try { return await apiClient.post('/authors', author); }
            catch (err) { return store.addAuthor(author); }
        },
        async update(id, author) {
            try { return await apiClient.put(`/authors/${id}`, author); }
            catch (err) { return store.updateAuthor(id, author); }
        },
        async delete(id) {
            try { return await apiClient.delete(`/authors/${id}`); }
            catch (err) { return store.deleteAuthor(id); }
        }
    },

    publishers: {
        async getAll() {
            try { return await apiClient.get('/publishers'); }
            catch (err) { return store.getPublishers(); }
        },
        async create(pub) {
            try { return await apiClient.post('/publishers', pub); }
            catch (err) { return store.addPublisher(pub); }
        },
        async update(id, pub) {
            try { return await apiClient.put(`/publishers/${id}`, pub); }
            catch (err) { return store.updatePublisher(id, pub); }
        },
        async delete(id) {
            try { return await apiClient.delete(`/publishers/${id}`); }
            catch (err) { return store.deletePublisher(id); }
        }
    },

    // Favorite Categories (Onboarding & Preference Sync)
    favorites: {
        async saveFavoriteCategories(categoryIds) {
            try {
                return await apiClient.post('/users/favorites', { categoryIds });
            } catch (err) {
                return store.saveFavoriteCategories(categoryIds);
            }
        },

        async getRecommendations() {
            try {
                return await apiClient.get('/recommendations');
            } catch (err) {
                return store.getRecommendedBooks();
            }
        }
    },

    // Orders & Checkout
    orders: {
        async create(orderData) {
            try {
                return await apiClient.post('/orders', orderData);
            } catch (err) {
                return store.createOrder(orderData);
            }
        },

        async getMyOrders() {
            try {
                return await apiClient.get('/orders/my-orders');
            } catch (err) {
                return store.getMyOrders();
            }
        },

        async getAll() {
            try {
                return await apiClient.get('/orders');
            } catch (err) {
                return store.getAllOrders();
            }
        },

        async updateStatus(orderId, status) {
            try {
                return await apiClient.put(`/orders/${orderId}/status`, { status });
            } catch (err) {
                return store.updateOrderStatus(orderId, status);
            }
        }
    },

    // Reviews
    reviews: {
        async getByBookId(bookId) {
            try {
                return await apiClient.get(`/books/${bookId}/reviews`);
            } catch (err) {
                return store.getBookReviews(bookId);
            }
        },

        async addReview(bookId, reviewData) {
            try {
                return await apiClient.post(`/books/${bookId}/reviews`, reviewData);
            } catch (err) {
                return store.addReview(bookId, reviewData);
            }
        }
    },

    // Dashboard Statistics (Admin Minh Anh)
    dashboard: {
        async getStats() {
            try {
                return await apiClient.get('/admin/dashboard-stats');
            } catch (err) {
                return store.getAdminStats();
            }
        }
    }
};
