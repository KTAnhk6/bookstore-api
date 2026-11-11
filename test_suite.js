// Comprehensive End-to-End Test Suite for BookNest Application (Main 6 - Full Coverage)
const http = require('http');
const https = require('https');

const FRONTEND_BASE = 'http://localhost:3000';
const BACKEND_BASE = 'http://localhost:8080/api';

const results = [];

function request(url, options = {}, postData = null) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const isHttps = u.protocol === 'https:';
        const client = isHttps ? https : http;

        const defaultHeaders = options.skipTestCaptcha
            ? {}
            : { 'X-Captcha-Id': 'test', 'X-Captcha-Code': 'TEST' };

        const reqOptions = {
            hostname: u.hostname,
            port: u.port || (isHttps ? 443 : 80),
            path: u.pathname + u.search,
            method: options.method || 'GET',
            headers: Object.assign(defaultHeaders, options.headers || {})
        };

        if (postData) {
            if (typeof postData === 'object' && !(postData instanceof Buffer)) {
                postData = JSON.stringify(postData);
                reqOptions.headers['Content-Type'] = 'application/json';
            }
            reqOptions.headers['Content-Length'] = Buffer.byteLength(postData);
        }

        const req = client.request(reqOptions, (res) => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                let body = null;
                const contentType = res.headers['content-type'] || '';
                if (contentType.includes('application/json')) {
                    try {
                        body = JSON.parse(buffer.toString('utf8'));
                    } catch (e) {
                        body = buffer.toString('utf8');
                    }
                } else if (contentType.includes('text') || contentType.includes('javascript') || contentType.includes('html')) {
                    body = buffer.toString('utf8');
                } else {
                    body = buffer; // binary
                }

                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: body,
                    raw: buffer
                });
            });
        });

        req.on('error', reject);
        req.setTimeout(15000, () => {
            req.destroy(new Error('Request timeout'));
        });

        if (postData) req.write(postData);
        req.end();
    });
}

function test(name, fn) {
    return async () => {
        const startTime = Date.now();
        try {
            await fn();
            const duration = Date.now() - startTime;
            results.push({ name, status: 'PASS', duration });
            console.log(`[PASS] ${name} (${duration}ms)`);
        } catch (err) {
            const duration = Date.now() - startTime;
            results.push({ name, status: 'FAIL', duration, error: err.message });
            console.error(`[FAIL] ${name} (${duration}ms) - Error: ${err.message}`);
        }
    };
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

async function run() {
    console.log('===============================================================');
    console.log('🚀 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN TỪNG CHỨC NĂNG CỦA BOOKNEST (MAIN 6)');
    console.log('===============================================================\n');

    let customerToken = '';
    let customerRefreshToken = '';
    let customerUser = null;
    let adminToken = '';
    let adminUser = null;
    let tempUserToken = '';
    let tempUserRefreshToken = '';
    let tempUsername = 'testuser_' + Date.now();
    let sampleBook = null;
    let createdAddressId = null;
    let createdCartItemId = null;
    let createdOrderId = null;
    let createdCategory = null;
    let createdAuthor = null;
    let createdPublisher = null;
    let createdBook = null;
    let createdCouponCode = 'TESTCPN' + String(Date.now()).slice(-5);

    const suite = [
        // ==========================================
        // 1. FRONTEND STATIC ASSETS & GIAO DIỆN
        // ==========================================
        test('1.1 Frontend Root index.html', async () => {
            const res = await request(`${FRONTEND_BASE}/index.html`);
            assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
            assert(res.body.includes('BookNest'), 'Missing BookNest title/brand');
        }),

        test('1.2 Frontend Payment Test page payment-test.html', async () => {
            const res = await request(`${FRONTEND_BASE}/payment-test.html`);
            assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
            assert(res.body.includes('MB Bank') || res.body.includes('VietQR'), 'Missing VietQR/MB Bank keywords');
        }),

        test('1.3 Frontend Core Scripts & Components', async () => {
            const files = [
                '/js/app.js',
                '/js/api.js',
                '/js/store.js',
                '/js/components/chart.js',
                '/js/components/address-picker.js',
                '/data/vn-divisions.json',
                '/js/pages/home.js',
                '/js/pages/catalog.js',
                '/js/pages/book-detail.js',
                '/js/pages/cart.js',
                '/js/pages/checkout.js',
                '/js/pages/profile.js',
                '/js/pages/admin.js'
            ];
            for (const file of files) {
                const res = await request(`${FRONTEND_BASE}${file}`);
                assert(res.statusCode === 200, `Failed to load ${file}: status ${res.statusCode}`);
            }
        }),

        test('1.4 Backend Health & Ping Check (/api/test/ping & /api/test/health)', async () => {
            const pingRes = await request(`${BACKEND_BASE}/test/ping`);
            assert(pingRes.statusCode === 200 && pingRes.body.data === 'PONG', `Ping failed: ${pingRes.statusCode}`);
            const healthRes = await request(`${BACKEND_BASE}/test/health`);
            assert(healthRes.statusCode === 200 && healthRes.body.data.status === 'UP', `Health failed: ${healthRes.statusCode}`);
        }),

        // ==========================================
        // 2. AUTHENTICATION, CAPTCHA, REFRESH TOKEN & SECURITY
        // ==========================================
        test('2.1 Server-Side Captcha Generation & Aspect Enforcement (/api/auth/captcha)', async () => {
            const capRes = await request(`${BACKEND_BASE}/auth/captcha`);
            assert(capRes.statusCode === 200, `Expected 200, got ${capRes.statusCode}`);
            assert(capRes.body.data && capRes.body.data.captchaId, 'Missing captchaId');
            assert(capRes.body.data.image && capRes.body.data.image.startsWith('data:image/png;base64,'), 'Invalid Base64 captcha image');

            // Attempting login without valid Captcha must be blocked by CaptchaAspect (400 Bad Request)
            const blockedRes = await request(`${BACKEND_BASE}/auth/login`, {
                method: 'POST',
                skipTestCaptcha: true,
                headers: { 'X-Captcha-Id': capRes.body.data.captchaId, 'X-Captcha-Code': 'WRONG' }
            }, {
                usernameOrEmail: 'user01',
                password: 'Test@5678'
            });
            assert(blockedRes.statusCode === 400, `Expected 400 when Captcha is wrong, got ${blockedRes.statusCode}`);
        }),

        test('2.2 Customer Login (user01 / Test@5678)', async () => {
            const res = await request(`${BACKEND_BASE}/auth/login`, { method: 'POST' }, {
                usernameOrEmail: 'user01',
                password: 'Test@5678'
            });
            assert(res.statusCode === 200, `Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
            assert(res.body.data && res.body.data.token, 'Missing JWT token in response');
            assert(res.body.data.refreshToken, 'Missing refreshToken in response');
            customerToken = res.body.data.token;
            customerRefreshToken = res.body.data.refreshToken;
            customerUser = res.body.data.user;
            console.log(`    👤 Customer logged in: ${customerUser.username} (Role: ${customerUser.role})`);
        }),

        test('2.3 Admin Login (admin / Admin@ysxRxG_s)', async () => {
            const res = await request(`${BACKEND_BASE}/auth/login`, { method: 'POST' }, {
                usernameOrEmail: 'admin',
                password: 'Admin@ysxRxG_s'
            });
            assert(res.statusCode === 200, `Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
            assert(res.body.data && res.body.data.token, 'Missing JWT token in response');
            adminToken = res.body.data.token;
            adminUser = res.body.data.user;
            console.log(`    👑 Admin logged in: ${adminUser.username} (Role: ${adminUser.role})`);
        }),

        test('2.4 Login with Wrong Password (Validation & Security)', async () => {
            const res = await request(`${BACKEND_BASE}/auth/login`, { method: 'POST' }, {
                usernameOrEmail: 'user01',
                password: 'wrong_password_123'
            });
            assert(res.statusCode === 400 || res.statusCode === 401, `Expected 400 or 401, got ${res.statusCode}`);
        }),

        test('2.5 Role-Based Access Control (@PreAuthorize): Customer blocked from Admin Dashboard', async () => {
            const res = await request(`${BACKEND_BASE}/admin/dashboard-stats`, {
                headers: { 'Authorization': `Bearer ${customerToken}` }
            });
            assert(res.statusCode === 403, `Expected 403 Forbidden, got ${res.statusCode}`);
        }),

        test('2.6 Role-Based Access Control (@PreAuthorize): Admin allowed to access Admin Dashboard', async () => {
            const res = await request(`${BACKEND_BASE}/admin/dashboard-stats`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            assert(res.statusCode === 200, `Expected 200 OK, got ${res.statusCode}`);
            assert(res.body.data !== undefined, 'Missing data payload');
        }),

        test('2.7 Register New User, Refresh Token Rotation, Forgot Password & Multi-Device Logout', async () => {
            // 1. Register new account
            const regRes = await request(`${BACKEND_BASE}/auth/register`, { method: 'POST' }, {
                username: tempUsername,
                email: `${tempUsername}@example.com`,
                password: 'Password@123',
                fullName: 'Người Dùng Kiểm Thử',
                phone: '098' + String(Date.now()).slice(-7)
            });
            assert(regRes.statusCode === 201 || regRes.statusCode === 200, `Register failed ${regRes.statusCode}: ${JSON.stringify(regRes.body)}`);
            tempUserToken = regRes.body.data.token;
            tempUserRefreshToken = regRes.body.data.refreshToken;
            assert(tempUserToken && tempUserRefreshToken, 'Missing token or refreshToken on register');

            // 2. Refresh Token Rotation
            const oldRefreshToken = tempUserRefreshToken;
            const refreshRes = await request(`${BACKEND_BASE}/auth/refresh`, { method: 'POST' }, {
                refreshToken: oldRefreshToken
            });
            assert(refreshRes.statusCode === 200, `Refresh failed ${refreshRes.statusCode}: ${JSON.stringify(refreshRes.body)}`);
            tempUserToken = refreshRes.body.data.token;
            tempUserRefreshToken = refreshRes.body.data.refreshToken;
            assert(tempUserRefreshToken !== oldRefreshToken, 'Refresh token did not rotate');

            // Old refresh token must be rejected
            const reuseRes = await request(`${BACKEND_BASE}/auth/refresh`, { method: 'POST' }, {
                refreshToken: oldRefreshToken
            });
            assert(reuseRes.statusCode === 400 || reuseRes.statusCode === 401, `Expected 400/401 on reused refreshToken, got ${reuseRes.statusCode}`);

            // 3. Forgot password
            const forgotRes = await request(`${BACKEND_BASE}/auth/forgot-password`, { method: 'POST' }, {
                emailOrUsername: tempUsername
            });
            assert(forgotRes.statusCode === 200, `Forgot password failed ${forgotRes.statusCode}`);

            // 4. Logout all devices
            const logoutAllRes = await request(`${BACKEND_BASE}/auth/logout-all`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${tempUserToken}` }
            });
            assert(logoutAllRes.statusCode === 200, `Logout all failed ${logoutAllRes.statusCode}`);

            // Refresh token after logout-all must fail
            const afterLogoutRefresh = await request(`${BACKEND_BASE}/auth/refresh`, { method: 'POST' }, {
                refreshToken: tempUserRefreshToken
            });
            assert(afterLogoutRefresh.statusCode === 400 || afterLogoutRefresh.statusCode === 401, 'Refresh token still valid after logout-all');
        }),

        // ==========================================
        // 3. PUBLIC CATALOG, BOOKS, CATEGORIES, AUTHORS, RECOMMENDATIONS
        // ==========================================
        test('3.1 Get Books List (Pagination & Filtering)', async () => {
            const res = await request(`${BACKEND_BASE}/books?page=0&size=10`);
            assert(res.statusCode === 200, `Status ${res.statusCode}`);
            const data = res.body.data || res.body;
            const items = data.content || data.items || data;
            assert(Array.isArray(items) && items.length > 0, 'No books returned');
            sampleBook = items[0];
            console.log(`    📚 Sách mẫu: ID=${sampleBook.id}, Tên="${sampleBook.title}", Giá=${sampleBook.price}đ, Tồn=${sampleBook.stockQuantity}`);
        }),

        test('3.2 Get Book Details by ID', async () => {
            assert(sampleBook && sampleBook.id, 'No sample book available');
            const res = await request(`${BACKEND_BASE}/books/${sampleBook.id}`);
            assert(res.statusCode === 200, `Status ${res.statusCode}`);
            const data = res.body.data || res.body;
            assert(data.title, 'Book missing title');
            assert(data.price !== undefined, 'Book missing price');
        }),

        test('3.3 Search Books by Keyword', async () => {
            const res = await request(`${BACKEND_BASE}/books?keyword=Harry`);
            assert(res.statusCode === 200, `Status ${res.statusCode}`);
        }),

        test('3.4 Get Bestsellers & Recommendations (/api/books/bestsellers & /api/recommendations)', async () => {
            const res = await request(`${BACKEND_BASE}/books/bestsellers?limit=5`);
            assert(res.statusCode === 200, `Status ${res.statusCode}`);
            const list = res.body.data || res.body;
            assert(Array.isArray(list), 'Bestsellers is not an array');

            const recRes = await request(`${BACKEND_BASE}/recommendations?limit=5`, {
                headers: { 'Authorization': `Bearer ${customerToken}` }
            });
            assert(recRes.statusCode === 200, `Recommendations status ${recRes.statusCode}`);

            const trendRes = await request(`${BACKEND_BASE}/recommendations/trending?limit=5`);
            assert(trendRes.statusCode === 200, `Trending status ${trendRes.statusCode}`);

            const simRes = await request(`${BACKEND_BASE}/recommendations/similar/${sampleBook.id}?limit=4`);
            assert(simRes.statusCode === 200, `Similar books status ${simRes.statusCode}`);
        }),

        test('3.5 Get Categories & Tree View Structure', async () => {
            const res = await request(`${BACKEND_BASE}/categories`);
            assert(res.statusCode === 200, `Status ${res.statusCode}`);
            
            const treeRes = await request(`${BACKEND_BASE}/categories/tree`);
            assert(treeRes.statusCode === 200, `Tree status ${treeRes.statusCode}`);
            const treeData = treeRes.body.data || treeRes.body;
            assert(Array.isArray(treeData), 'Tree data is not an array');
            console.log(`    🌳 Cây thể loại: ${treeData.length} thể loại gốc.`);
        }),

        test('3.6 Get Authors List', async () => {
            const res = await request(`${BACKEND_BASE}/authors`);
            assert(res.statusCode === 200, `Status ${res.statusCode}`);
            const authors = res.body.data || res.body;
            assert(Array.isArray(authors), 'Authors is not an array');
        }),

        test('3.7 Get Publishers List', async () => {
            const res = await request(`${BACKEND_BASE}/publishers`);
            assert(res.statusCode === 200, `Status ${res.statusCode}`);
            const pubs = res.body.data || res.body;
            assert(Array.isArray(pubs), 'Publishers is not an array');
        }),

        test('3.8 Get Active Coupons (Mã Giảm Giá)', async () => {
            const res = await request(`${BACKEND_BASE}/coupons`);
            assert(res.statusCode === 200, `Status ${res.statusCode}`);
        }),

        // ==========================================
        // 4. CUSTOMER SHOPPING, REVIEWS & USER FLOW
        // ==========================================
        test('4.1 Customer Profile & Favorite Categories (/api/users/me)', async () => {
            const getRes = await request(`${BACKEND_BASE}/users/me`, {
                headers: { 'Authorization': `Bearer ${customerToken}` }
            });
            assert(getRes.statusCode === 200, `Get profile status ${getRes.statusCode}`);
            const currentProfile = getRes.body.data;

            const putRes = await request(`${BACKEND_BASE}/users/me`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${customerToken}` }
            }, {
                fullName: currentProfile.fullName || 'Khách Hàng user01',
                phone: '0901234567'
            });
            assert(putRes.statusCode === 200, `Update profile status ${putRes.statusCode}`);

            const favRes = await request(`${BACKEND_BASE}/users/me/favorite-categories`, {
                headers: { 'Authorization': `Bearer ${customerToken}` }
            });
            assert(favRes.statusCode === 200, `Get favorite categories status ${favRes.statusCode}`);
        }),

        test('4.2 Customer Addresses (/api/addresses)', async () => {
            const listRes = await request(`${BACKEND_BASE}/addresses`, {
                headers: { 'Authorization': `Bearer ${customerToken}` }
            });
            assert(listRes.statusCode === 200, `List addresses status ${listRes.statusCode}`);

            const addRes = await request(`${BACKEND_BASE}/addresses`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${customerToken}` }
            }, {
                recipientName: 'Khách Hàng user01',
                phone: '0901234567',
                province: 'TP. Hồ Chí Minh',
                district: 'Quận 1',
                ward: 'Phường Bến Nghé',
                detailAddress: '123 Đường Lê Lợi',
                isDefault: true
            });
            assert(addRes.statusCode === 200 || addRes.statusCode === 201, `Add address status ${addRes.statusCode}`);
            createdAddressId = addRes.body.data ? addRes.body.data.id : null;
        }),

        test('4.3 Customer Wishlist (/api/wishlist)', async () => {
            const bookId = sampleBook.id;
            const addRes = await request(`${BACKEND_BASE}/wishlist/${bookId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${customerToken}` }
            });
            assert(addRes.statusCode === 200 || addRes.statusCode === 201, `Add wishlist status ${addRes.statusCode}`);

            const getRes = await request(`${BACKEND_BASE}/wishlist`, {
                headers: { 'Authorization': `Bearer ${customerToken}` }
            });
            assert(getRes.statusCode === 200, `Get wishlist status ${getRes.statusCode}`);

            const delRes = await request(`${BACKEND_BASE}/wishlist/${bookId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${customerToken}` }
            });
            assert(delRes.statusCode === 200, `Remove wishlist status ${delRes.statusCode}`);
        }),

        test('4.4 Book Reviews Create, Edit & Delete (/api/reviews)', async () => {
            // Re-login tempUser to get fresh token after logout-all test
            const loginRes = await request(`${BACKEND_BASE}/auth/login`, { method: 'POST' }, {
                usernameOrEmail: tempUsername,
                password: 'Password@123'
            });
            assert(loginRes.statusCode === 200, `Temp user login failed: ${loginRes.statusCode}`);
            tempUserToken = loginRes.body.data.token;

            const bookId = sampleBook.id;
            // Create review
            const createRes = await request(`${BACKEND_BASE}/reviews`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${tempUserToken}` }
            }, {
                bookId: bookId,
                rating: 5,
                title: 'Sách rất hay',
                comment: 'Nội dung tuyệt vời, đóng gói cẩn thận.'
            });
            assert(createRes.statusCode === 201 || createRes.statusCode === 200, `Create review failed ${createRes.statusCode}: ${JSON.stringify(createRes.body)}`);
            const reviewId = createRes.body.data.id;

            // Update review
            const updateRes = await request(`${BACKEND_BASE}/reviews/${reviewId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${tempUserToken}` }
            }, {
                bookId: bookId,
                rating: 4,
                title: 'Sách khá hay (đã sửa)',
                comment: 'Cập nhật lại đánh giá sau khi đọc xong.'
            });
            assert(updateRes.statusCode === 200, `Update review failed ${updateRes.statusCode}`);
            assert(updateRes.body.data.rating === 4, 'Updated review rating mismatch');

            // Get review summary
            const summaryRes = await request(`${BACKEND_BASE}/reviews/book/${bookId}/summary`);
            assert(summaryRes.statusCode === 200, `Review summary failed ${summaryRes.statusCode}`);

            // Delete review
            const delRes = await request(`${BACKEND_BASE}/reviews/${reviewId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${tempUserToken}` }
            });
            assert(delRes.statusCode === 200, `Delete review failed ${delRes.statusCode}`);
        }),

        test('4.5 Customer Shopping Cart (/api/cart)', async () => {
            await request(`${BACKEND_BASE}/cart`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${customerToken}` }
            });
            const bookId = sampleBook.id;
            const addRes = await request(`${BACKEND_BASE}/cart`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${customerToken}` }
            }, {
                bookId: bookId,
                quantity: 2
            });
            assert(addRes.statusCode === 200 || addRes.statusCode === 201, `Add cart item status ${addRes.statusCode}`);

            const viewRes = await request(`${BACKEND_BASE}/cart`, {
                headers: { 'Authorization': `Bearer ${customerToken}` }
            });
            assert(viewRes.statusCode === 200, `View cart status ${viewRes.statusCode}`);
            const cart = viewRes.body.data;
            assert(cart.items && cart.items.length > 0, 'Cart is empty after adding item');
            createdCartItemId = cart.items[0].id;

            const updateRes = await request(`${BACKEND_BASE}/cart/items/${createdCartItemId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${customerToken}` }
            }, {
                quantity: 1
            });
            assert(updateRes.statusCode === 200, `Update cart item status ${updateRes.statusCode}`);
        }),

        test('4.6 Create Order with COD Payment (/api/orders)', async () => {
            const orderPayload = {
                recipientName: 'Khách Hàng COD',
                phone: '0901234567',
                province: 'TP. Hồ Chí Minh',
                district: 'Quận 1',
                ward: 'Phường Bến Nghé',
                detailAddress: '123 Đường Lê Lợi',
                paymentMethod: 'COD',
                note: 'Giao hàng giờ hành chính',
                directItems: [
                    { bookId: sampleBook.id, quantity: 1 }
                ]
            };

            const res = await request(`${BACKEND_BASE}/orders`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${customerToken}` }
            }, orderPayload);

            assert(res.statusCode === 200 || res.statusCode === 201, `Create COD order status ${res.statusCode}: ${JSON.stringify(res.body)}`);
            const order = res.body.data;
            assert(order && order.id, 'Order missing ID');
            createdOrderId = order.id;
            console.log(`    📦 Đã tạo đơn COD #${createdOrderId} (Mã: ${order.orderCode}), Tổng tiền: ${order.totalAmount}đ, Trạng thái: ${order.status}`);
        }),

        test('4.7 View Customer Orders History (/api/orders)', async () => {
            const res = await request(`${BACKEND_BASE}/orders`, {
                headers: { 'Authorization': `Bearer ${customerToken}` }
            });
            assert(res.statusCode === 200, `Get orders status ${res.statusCode}`);
            const orders = res.body.data || res.body;
            assert(Array.isArray(orders.content || orders), 'Orders is not an array or page');
        }),

        test('4.8 Coupon Validation, Order Cancellation & Coupon Restoration', async () => {
            // Admin creates a coupon
            const cpnRes = await request(`${BACKEND_BASE}/admin/coupons`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            }, {
                code: createdCouponCode,
                description: 'Giảm 10k đơn từ 50k',
                discountType: 'FIXED_AMOUNT',
                discountValue: 10000,
                minOrderAmount: 50000,
                usageLimit: 5,
                active: true,
                firstOrderOnly: false
            });
            assert(cpnRes.statusCode === 201 || cpnRes.statusCode === 200, `Create coupon failed ${cpnRes.statusCode}: ${JSON.stringify(cpnRes.body)}`);

            // Validate coupon
            const valRes = await request(`${BACKEND_BASE}/coupons/validate?code=${createdCouponCode}&orderAmount=100000`, {
                headers: { 'Authorization': `Bearer ${customerToken}` }
            });
            assert(valRes.statusCode === 200, `Validate coupon failed ${valRes.statusCode}`);
            assert(valRes.body.data.calculatedDiscount === 10000, `Expected 10000 discount, got ${valRes.body.data.calculatedDiscount}`);

            // Place order using coupon
            const orderRes = await request(`${BACKEND_BASE}/orders`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${customerToken}` }
            }, {
                recipientName: 'Khách Coupon',
                phone: '0901234567',
                province: 'TP. Hồ Chí Minh',
                district: 'Quận 1',
                ward: 'Phường Bến Nghé',
                detailAddress: '123 Lê Lợi',
                paymentMethod: 'COD',
                couponCode: createdCouponCode,
                directItems: [{ bookId: sampleBook.id, quantity: 1 }]
            });
            assert(orderRes.statusCode === 201 || orderRes.statusCode === 200, `Order with coupon failed ${orderRes.statusCode}`);
            const cpnOrderId = orderRes.body.data.id;

            // Trying to reuse the same coupon before cancelling must fail (400)
            const reuseValRes = await request(`${BACKEND_BASE}/coupons/validate?code=${createdCouponCode}&orderAmount=100000`, {
                headers: { 'Authorization': `Bearer ${customerToken}` }
            });
            assert(reuseValRes.statusCode === 400, `Expected 400 when reusing coupon, got ${reuseValRes.statusCode}`);

            // Cancel order -> restores stock & coupon usage
            const cancelRes = await request(`${BACKEND_BASE}/orders/${cpnOrderId}/cancel`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${customerToken}` }
            }, {
                reason: 'Đổi ý muốn chọn sách khác'
            });
            assert(cancelRes.statusCode === 200, `Cancel order failed ${cancelRes.statusCode}`);
            assert(cancelRes.body.data.status === 'CANCELLED', 'Order status should be CANCELLED');

            // After cancelling, coupon can be validated again
            const reValRes = await request(`${BACKEND_BASE}/coupons/validate?code=${createdCouponCode}&orderAmount=100000`, {
                headers: { 'Authorization': `Bearer ${customerToken}` }
            });
            assert(reValRes.statusCode === 200, `Coupon should be reusable after order cancellation, got ${reValRes.statusCode}`);
        }),

        // ==========================================
        // 5. VIETQR PAYMENT, CLAIMED FLOW & REFUND WORKFLOW
        // ==========================================
        test('5.1 Full VietQR Payment Lifecycle (Session -> QR -> MB Bank Mock -> Auto Reconcile -> PAID)', async () => {
            // Ensure mock mode is active so test mock transfer works
            await request(`${BACKEND_BASE}/payments/qr/admin/settings`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            }, { historyUrl: '' });

            const orderPayload = {
                recipientName: 'Khách Hàng QR',
                phone: '0909888777',
                province: 'TP. Hồ Chí Minh',
                district: 'Quận 3',
                ward: 'Phường Võ Thị Sáu',
                detailAddress: '456 Hai Bà Trưng',
                paymentMethod: 'QR_CODE',
                note: 'Thử nghiệm thanh toán QR',
                directItems: [
                    { bookId: sampleBook.id, quantity: 1 }
                ]
            };

            const sessionRes = await request(`${BACKEND_BASE}/payments/qr/session`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${customerToken}` }
            }, orderPayload);

            assert(sessionRes.statusCode === 200 || sessionRes.statusCode === 201, `Create QR session failed ${sessionRes.statusCode}: ${JSON.stringify(sessionRes.body)}`);
            const session = sessionRes.body.data;
            assert(session && session.paymentCode, 'Missing payment code BKxxxxxxxx');
            assert(session.paymentCode.startsWith('BK'), `Payment code must start with BK, got ${session.paymentCode}`);
            assert(session.qrPayload, 'Missing VietQR string');
            assert(session.status === 'PENDING', `Session status expected PENDING, got ${session.status}`);

            console.log(`    ℹ️ Đã tạo phiên VietQR #${session.sessionId || session.id}: Mã đơn ${session.orderCode}, Số tiền: ${session.amount}đ, Nội dung CK: ${session.paymentCode}`);

            const mockTransferRes = await request(`${BACKEND_BASE}/test/mock-bank/transfer`, {
                method: 'POST'
            }, {
                amount: session.amount,
                description: `KH chuyen tien ${session.paymentCode} mua sach`,
                accountNo: '0396902081'
            });
            assert(mockTransferRes.statusCode === 200, `Mock transfer status ${mockTransferRes.statusCode}`);
            console.log(`    🏦 Giả lập biến động số dư MB Bank: tiền vào +${session.amount}đ, nội dung "${session.paymentCode}"`);

            const sessionId = session.sessionId || session.id;
            let updatedSession = null;
            for (let attempt = 0; attempt < 7; attempt++) {
                const checkRes = await request(`${BACKEND_BASE}/payments/qr/session/${sessionId}/check`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${customerToken}` }
                });
                assert(checkRes.statusCode === 200, `Check session status ${checkRes.statusCode}`);
                updatedSession = checkRes.body.data;
                if (updatedSession && updatedSession.status === 'PAID') {
                    break;
                }
                await new Promise(r => setTimeout(r, 1200));
            }
            assert(updatedSession.status === 'PAID', `Expected session status PAID, got ${updatedSession ? updatedSession.status : 'null'}`);
            console.log(`    ✅ Đối soát thành công: Phiên #${sessionId} đã chuyển sang trạng thái PAID!`);

            // 4. Paid Order Protection & Refund Workflow (REFUND_PENDING -> REFUNDED)
            const paidOrderId = updatedSession.orderId;
            const selfCancelRes = await request(`${BACKEND_BASE}/orders/${paidOrderId}/cancel`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${customerToken}` }
            }, { reason: 'Thử tự hủy đơn đã trả tiền' });
            assert(selfCancelRes.statusCode === 400, `Customer should be blocked from cancelling paid order, got ${selfCancelRes.statusCode}`);

            // Admin cancels paid order -> REFUND_PENDING
            const adminCancelRes = await request(`${BACKEND_BASE}/admin/orders/${paidOrderId}/status?status=CANCELLED`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            assert(adminCancelRes.statusCode === 200, `Admin cancel paid order failed ${adminCancelRes.statusCode}`);
            assert(adminCancelRes.body.data.paymentStatus === 'REFUND_PENDING', `Expected REFUND_PENDING, got ${adminCancelRes.body.data.paymentStatus}`);

            // Admin marks order refunded -> REFUNDED
            const refundRes = await request(`${BACKEND_BASE}/admin/orders/${paidOrderId}/refunded`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            assert(refundRes.statusCode === 200, `Admin mark refunded failed ${refundRes.statusCode}`);
            assert(refundRes.body.data.paymentStatus === 'REFUNDED', `Expected REFUNDED, got ${refundRes.body.data.paymentStatus}`);
            console.log(`    💸 Quy trình hoàn tiền đơn #${paidOrderId}: SUCCESS -> REFUND_PENDING -> REFUNDED hoàn tất!`);
        }),

        test('5.2 VietQR CLAIMED State & Admin Manual Confirm (/api/payments/qr/admin/sessions/{id}/confirm)', async () => {
            // Create QR session
            const sessionRes = await request(`${BACKEND_BASE}/payments/qr/session`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${customerToken}` }
            }, {
                recipientName: 'Khách Hàng Claim QR',
                phone: '0909888777',
                province: 'TP. Hồ Chí Minh',
                district: 'Quận 3',
                ward: 'Phường Võ Thị Sáu',
                detailAddress: '456 Hai Bà Trưng',
                paymentMethod: 'QR_CODE',
                directItems: [{ bookId: sampleBook.id, quantity: 1 }]
            });
            assert(sessionRes.statusCode === 201 || sessionRes.statusCode === 200, `Create session failed ${sessionRes.statusCode}`);
            const sessionId = sessionRes.body.data.sessionId || sessionRes.body.data.id;

            // Customer clicks "Tôi đã chuyển khoản" without bank transfer -> status becomes CLAIMED
            const checkRes = await request(`${BACKEND_BASE}/payments/qr/session/${sessionId}/check`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${customerToken}` }
            });
            assert(checkRes.statusCode === 200, `Check session failed ${checkRes.statusCode}`);
            assert(checkRes.body.data.status === 'CLAIMED', `Expected CLAIMED status, got ${checkRes.body.data.status}`);

            // Admin manually confirms the CLAIMED session -> status becomes PAID
            const confirmRes = await request(`${BACKEND_BASE}/payments/qr/admin/sessions/${sessionId}/confirm`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            assert(confirmRes.statusCode === 200, `Admin confirm claim failed ${confirmRes.statusCode}`);
            assert(confirmRes.body.data.status === 'PAID', `Expected PAID after admin confirm, got ${confirmRes.body.data.status}`);

            // Test Admin Reject on another CLAIMED session
            const sessionRes2 = await request(`${BACKEND_BASE}/payments/qr/session`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${customerToken}` }
            }, {
                recipientName: 'Khách Hàng Reject QR',
                phone: '0909888777',
                province: 'TP. Hồ Chí Minh',
                district: 'Quận 3',
                ward: 'Phường Võ Thị Sáu',
                detailAddress: '456 Hai Bà Trưng',
                paymentMethod: 'QR_CODE',
                directItems: [{ bookId: sampleBook.id, quantity: 1 }]
            });
            const sessionId2 = sessionRes2.body.data.sessionId || sessionRes2.body.data.id;
            await request(`${BACKEND_BASE}/payments/qr/session/${sessionId2}/check`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${customerToken}` }
            });
            const rejectRes = await request(`${BACKEND_BASE}/payments/qr/admin/sessions/${sessionId2}/reject`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            assert(rejectRes.statusCode === 200, `Admin reject claim failed ${rejectRes.statusCode}`);
            assert(rejectRes.body.data.status === 'CANCELLED', `Expected CANCELLED after admin reject, got ${rejectRes.body.data.status}`);
        }),

        test('5.3 Payment Details & History Lookup (/api/payments/order/{orderId})', async () => {
            assert(createdOrderId, 'No createdOrderId available');
            const payRes = await request(`${BACKEND_BASE}/payments/order/${createdOrderId}`, {
                headers: { 'Authorization': `Bearer ${customerToken}` }
            });
            assert(payRes.statusCode === 200, `Get payment by orderId failed ${payRes.statusCode}`);

            const histRes = await request(`${BACKEND_BASE}/payments/order/${createdOrderId}/history`, {
                headers: { 'Authorization': `Bearer ${customerToken}` }
            });
            assert(histRes.statusCode === 200, `Get payment history failed ${histRes.statusCode}`);
        }),

        // ==========================================
        // 6. ADMIN OPERATIONS (DASHBOARD, TREE CATEGORY, CRUD, EXPORT)
        // ==========================================
        test('6.1 Admin Dashboard Statistics & KPI', async () => {
            const res = await request(`${BACKEND_BASE}/admin/dashboard-stats`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            assert(res.statusCode === 200, `Dashboard stats status ${res.statusCode}`);
            const stats = res.body.data;
            assert(stats.totalBooks !== undefined, 'Missing totalBooks');
            assert(stats.totalOrders !== undefined, 'Missing totalOrders');
            assert(stats.totalRevenue !== undefined, 'Missing totalRevenue');
            assert(Array.isArray(stats.monthlyRevenue), 'monthlyRevenue must be an array (for Canvas chart)');
            assert(typeof stats.categoryRevenue === 'object' && stats.categoryRevenue !== null, 'categoryRevenue must be an object/map');
            console.log(`    📊 Dashboard: Doanh thu = ${stats.totalRevenue}đ, Tổng đơn = ${stats.totalOrders}, Tổng sách = ${stats.totalBooks}`);
        }),

        test('6.2 Admin Categories Tree, Self-Parent Protection & CRUD', async () => {
            // 1. Create root category
            const createRootRes = await request(`${BACKEND_BASE}/categories`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            }, {
                name: 'Thể Loại Gốc Tự Động Test ' + Date.now(),
                description: 'Kiểm thử cây danh mục'
            });
            assert(createRootRes.statusCode === 200 || createRootRes.statusCode === 201, `Create category status ${createRootRes.statusCode}`);
            createdCategory = createRootRes.body.data;

            // 2. Create child subcategory
            const createChildRes = await request(`${BACKEND_BASE}/categories`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            }, {
                name: 'Nhánh Con Test ' + Date.now(),
                description: 'Nhánh con của danh mục trên',
                parentId: createdCategory.id
            });
            assert(createChildRes.statusCode === 200 || createChildRes.statusCode === 201, `Create subcategory status ${createChildRes.statusCode}`);
            const childCat = createChildRes.body.data;

            // 3. Verify self-parent protection (cannot set parentId = id)
            const selfParentRes = await request(`${BACKEND_BASE}/categories/${createdCategory.id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            }, {
                name: createdCategory.name,
                parentId: createdCategory.id
            });
            assert(selfParentRes.statusCode === 400, `Expected 400 when setting category as its own parent, got ${selfParentRes.statusCode}`);

            // 4. Update root category
            const updateRes = await request(`${BACKEND_BASE}/categories/${createdCategory.id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            }, {
                name: createdCategory.name + ' (Đã sửa)',
                description: 'Mô tả đã cập nhật'
            });
            assert(updateRes.statusCode === 200, `Update category status ${updateRes.statusCode}`);

            // 5. Clean up: Delete child then root
            await request(`${BACKEND_BASE}/categories/${childCat.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            await request(`${BACKEND_BASE}/categories/${createdCategory.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
        }),

        test('6.3 Admin Authors CRUD', async () => {
            const createRes = await request(`${BACKEND_BASE}/authors`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            }, {
                name: 'Tác Giả Kiểm Thử ' + Date.now(),
                biography: 'Tiểu sử tác giả kiểm thử'
            });
            assert(createRes.statusCode === 200 || createRes.statusCode === 201, `Create author status ${createRes.statusCode}`);
            createdAuthor = createRes.body.data;

            const updateRes = await request(`${BACKEND_BASE}/authors/${createdAuthor.id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            }, {
                name: createdAuthor.name + ' Sửa',
                biography: 'Tiểu sử cập nhật'
            });
            assert(updateRes.statusCode === 200, `Update author status ${updateRes.statusCode}`);

            const delRes = await request(`${BACKEND_BASE}/authors/${createdAuthor.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            assert(delRes.statusCode === 200, `Delete author status ${delRes.statusCode}`);
        }),

        test('6.4 Admin Publishers CRUD', async () => {
            const createRes = await request(`${BACKEND_BASE}/publishers`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            }, {
                name: 'Nhà Xuất Bản Test ' + Date.now(),
                address: 'Hà Nội'
            });
            assert(createRes.statusCode === 200 || createRes.statusCode === 201, `Create publisher status ${createRes.statusCode}`);
            createdPublisher = createRes.body.data;

            const updateRes = await request(`${BACKEND_BASE}/publishers/${createdPublisher.id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            }, {
                name: createdPublisher.name + ' Sửa',
                address: 'TP. Hồ Chí Minh'
            });
            assert(updateRes.statusCode === 200, `Update publisher status ${updateRes.statusCode}`);

            const delRes = await request(`${BACKEND_BASE}/publishers/${createdPublisher.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            assert(delRes.statusCode === 200, `Delete publisher status ${delRes.statusCode}`);
        }),

        test('6.5 Admin Books CRUD & Safe Delete Protection (/api/admin/books)', async () => {
            // 1. Create book
            const newBookRes = await request(`${BACKEND_BASE}/admin/books`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            }, {
                title: 'Sách Kiểm Thử Tự Động ' + Date.now(),
                price: 150000,
                stockQuantity: 50,
                description: 'Mô tả sách kiểm thử'
            });
            assert(newBookRes.statusCode === 200 || newBookRes.statusCode === 201, `Create book status ${newBookRes.statusCode}`);
            createdBook = newBookRes.body.data;

            // 2. Update book
            const updateBookRes = await request(`${BACKEND_BASE}/admin/books/${createdBook.id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            }, {
                title: createdBook.title + ' (Đã Sửa)',
                price: 160000,
                stockQuantity: 45,
                description: 'Mô tả đã sửa'
            });
            assert(updateBookRes.statusCode === 200, `Update book status ${updateBookRes.statusCode}`);

            // 3. Delete unused book succeeds
            const delBookRes = await request(`${BACKEND_BASE}/admin/books/${createdBook.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            assert(delBookRes.statusCode === 200, `Delete book status ${delBookRes.statusCode}`);

            // 4. Deleting a book that already exists in an order must be blocked (400 Bad Request)
            const protectedDelRes = await request(`${BACKEND_BASE}/admin/books/${sampleBook.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            assert(protectedDelRes.statusCode === 400, `Expected 400 when deleting book in orders, got ${protectedDelRes.statusCode}`);
        }),

        test('6.6 Admin Orders Management & Status Update (/api/admin/orders)', async () => {
            const listRes = await request(`${BACKEND_BASE}/admin/orders`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            assert(listRes.statusCode === 200, `Admin orders status ${listRes.statusCode}`);
            const ordersData = listRes.body.data;
            const orders = ordersData.content || ordersData;
            assert(Array.isArray(orders) && orders.length > 0, 'No orders found');

            if (createdOrderId) {
                const statusRes = await request(`${BACKEND_BASE}/admin/orders/${createdOrderId}/status?status=CONFIRMED`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${adminToken}` }
                });
                assert(statusRes.statusCode === 200, `Update order status ${statusRes.statusCode}`);
                console.log(`    🚚 Đơn hàng #${createdOrderId} đã chuyển trạng thái sang CONFIRMED.`);
            }
        }),

        test('6.7 Admin Users Management (/api/admin/users)', async () => {
            const res = await request(`${BACKEND_BASE}/admin/users`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            assert(res.statusCode === 200, `Admin users status ${res.statusCode}`);
            const usersData = res.body.data;
            const users = usersData.content || usersData;
            assert(Array.isArray(users) && users.length > 0, 'No users found');
        }),

        test('6.8 Admin QR Payment Sessions, Bank Transactions & Settings Audit', async () => {
            const sessionsRes = await request(`${BACKEND_BASE}/payments/qr/admin/sessions`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            assert(sessionsRes.statusCode === 200, `Admin sessions status ${sessionsRes.statusCode}`);

            const txRes = await request(`${BACKEND_BASE}/payments/qr/admin/bank-transactions`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            assert(txRes.statusCode === 200, `Admin bank transactions status ${txRes.statusCode}`);

            const settingsRes = await request(`${BACKEND_BASE}/payments/qr/admin/settings`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            assert(settingsRes.statusCode === 200, `Admin payment settings status ${settingsRes.statusCode}`);
        }),

        test('6.9 Admin Revenue Report JSON Data (/api/admin/reports/revenue)', async () => {
            const res = await request(`${BACKEND_BASE}/admin/reports/revenue?startDate=2026-01-01&endDate=2026-12-31`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            assert(res.statusCode === 200, `Admin revenue report status ${res.statusCode}`);
            const data = res.body.data;
            assert(data !== undefined, 'Missing report data');
        }),

        test('6.10 Admin Revenue Report Download Excel (.xlsx)', async () => {
            const res = await request(`${BACKEND_BASE}/admin/reports/revenue/excel?startDate=2026-01-01&endDate=2026-12-31`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            assert(res.statusCode === 200, `Excel download status ${res.statusCode}`);
            const raw = res.raw;
            assert(raw.length > 500, `Excel file too small: ${raw.length} bytes`);
            assert(raw[0] === 0x50 && raw[1] === 0x4b && raw[2] === 0x03 && raw[3] === 0x04, 'Invalid Excel .xlsx magic bytes');
            console.log(`    ✅ Đã xuất báo cáo Excel: ${raw.length} bytes, đúng chuẩn XLSX.`);
        }),

        test('6.11 Admin Revenue Report Download PDF (.pdf)', async () => {
            const res = await request(`${BACKEND_BASE}/admin/reports/revenue/pdf?startDate=2026-01-01&endDate=2026-12-31`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            assert(res.statusCode === 200, `PDF download status ${res.statusCode}`);
            const raw = res.raw;
            assert(raw.length > 500, `PDF file too small: ${raw.length} bytes`);
            const magic = raw.slice(0, 5).toString('ascii');
            assert(magic === '%PDF-', `Invalid PDF magic bytes: ${magic}`);
            console.log(`    ✅ Đã xuất báo cáo PDF: ${raw.length} bytes, đúng chuẩn PDF.`);
        }),

        test('6.12 Image File Upload (/api/v1/uploads/image)', async () => {
            const boundary = '----BookNestFormBoundary' + Date.now();
            // Minimal 1x1 transparent PNG
            const pngBytes = Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                'base64'
            );
            const pre = Buffer.from(
                `--${boundary}\r\n` +
                `Content-Disposition: form-data; name="file"; filename="test-cover.png"\r\n` +
                `Content-Type: image/png\r\n\r\n`,
                'utf8'
            );
            const post = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
            const bodyBuffer = Buffer.concat([pre, pngBytes, post]);

            const uploadRes = await request(`${BACKEND_BASE}/v1/uploads/image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': `multipart/form-data; boundary=${boundary}`
                }
            }, bodyBuffer);
            assert(uploadRes.statusCode === 200, `Upload image failed ${uploadRes.statusCode}: ${JSON.stringify(uploadRes.body)}`);
            assert(uploadRes.body.data && uploadRes.body.data.fileName, 'Missing fileName in upload response');
            console.log(`    🖼️ Đã tải ảnh lên thành công: ${uploadRes.body.data.fileName}`);
        })
    ];

    for (const step of suite) {
        await step();
    }

    console.log('\n===============================================================');
    console.log('📊 TỔNG KẾT KẾT QUẢ KIỂM THỬ:');
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    console.log(`Tổng số test case: ${results.length}`);
    console.log(`✅ Thành công (PASS): ${passed}`);
    console.log(`❌ Thất bại (FAIL): ${failed}`);
    console.log('===============================================================\n');

    if (failed > 0) {
        process.exit(1);
    }
}

run().catch(err => {
    console.error('Lỗi nghiêm trọng:', err);
    process.exit(1);
});
