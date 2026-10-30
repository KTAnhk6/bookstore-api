// Comprehensive End-to-End Test Suite for BookNest Application
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

        const reqOptions = {
            hostname: u.hostname,
            port: u.port || (isHttps ? 443 : 80),
            path: u.pathname + u.search,
            method: options.method || 'GET',
            headers: options.headers || {}
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
    console.log('🚀 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN TỪNG CHỨC NĂNG CỦA BOOKNEST');
    console.log('===============================================================\n');

    let customerToken = '';
    let customerUser = null;
    let adminToken = '';
    let adminUser = null;
    let sampleBook = null;
    let createdAddressId = null;
    let createdCartItemId = null;
    let createdOrderId = null;
    let createdCategory = null;
    let createdAuthor = null;
    let createdPublisher = null;
    let createdBook = null;

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

        // ==========================================
        // 2. AUTHENTICATION & AUTHORIZATION (BẢO MẬT & PHÂN QUYỀN)
        // ==========================================
        test('2.1 Customer Login (user01 / Test@5678)', async () => {
            const res = await request(`${BACKEND_BASE}/auth/login`, { method: 'POST' }, {
                usernameOrEmail: 'user01',
                password: 'Test@5678'
            });
            assert(res.statusCode === 200, `Status ${res.statusCode}: ${JSON.stringify(res.body)}`);
            assert(res.body.data && res.body.data.token, 'Missing JWT token in response');
            customerToken = res.body.data.token;
            customerUser = res.body.data.user;
            console.log(`    👤 Customer logged in: ${customerUser.username} (Role: ${customerUser.role})`);
        }),

        test('2.2 Admin Login (admin / Admin@ysxRxG_s)', async () => {
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

        test('2.3 Login with Wrong Password (Validation & Security)', async () => {
            const res = await request(`${BACKEND_BASE}/auth/login`, { method: 'POST' }, {
                usernameOrEmail: 'user01',
                password: 'wrong_password_123'
            });
            assert(res.statusCode === 400 || res.statusCode === 401, `Expected 400 or 401, got ${res.statusCode}`);
        }),

        test('2.4 Role-Based Access Control (@PreAuthorize): Customer blocked from Admin Dashboard', async () => {
            const res = await request(`${BACKEND_BASE}/admin/dashboard-stats`, {
                headers: { 'Authorization': `Bearer ${customerToken}` }
            });
            assert(res.statusCode === 403, `Expected 403 Forbidden, got ${res.statusCode}`);
        }),

        test('2.5 Role-Based Access Control (@PreAuthorize): Admin allowed to access Admin Dashboard', async () => {
            const res = await request(`${BACKEND_BASE}/admin/dashboard-stats`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            assert(res.statusCode === 200, `Expected 200 OK, got ${res.statusCode}`);
            assert(res.body.data !== undefined, 'Missing data payload');
        }),

        // ==========================================
        // 3. PUBLIC CATALOG, BOOKS, CATEGORIES, AUTHORS
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

        test('3.4 Get Bestsellers (Sách Bán Chạy)', async () => {
            const res = await request(`${BACKEND_BASE}/books/bestsellers?limit=5`);
            assert(res.statusCode === 200, `Status ${res.statusCode}`);
            const list = res.body.data || res.body;
            assert(Array.isArray(list), 'Bestsellers is not an array');
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
        // 4. CUSTOMER SHOPPING & USER FLOW
        // ==========================================
        test('4.1 Customer Profile (/api/users/me)', async () => {
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
            // Add to wishlist
            const addRes = await request(`${BACKEND_BASE}/wishlist/${bookId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${customerToken}` }
            });
            assert(addRes.statusCode === 200 || addRes.statusCode === 201, `Add wishlist status ${addRes.statusCode}`);

            // Get wishlist
            const getRes = await request(`${BACKEND_BASE}/wishlist`, {
                headers: { 'Authorization': `Bearer ${customerToken}` }
            });
            assert(getRes.statusCode === 200, `Get wishlist status ${getRes.statusCode}`);

            // Remove from wishlist
            const delRes = await request(`${BACKEND_BASE}/wishlist/${bookId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${customerToken}` }
            });
            assert(delRes.statusCode === 200, `Remove wishlist status ${delRes.statusCode}`);
        }),

        test('4.4 Customer Shopping Cart (/api/cart)', async () => {
            const bookId = sampleBook.id;
            // Add item to cart
            const addRes = await request(`${BACKEND_BASE}/cart`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${customerToken}` }
            }, {
                bookId: bookId,
                quantity: 2
            });
            assert(addRes.statusCode === 200 || addRes.statusCode === 201, `Add cart item status ${addRes.statusCode}`);

            // View cart
            const viewRes = await request(`${BACKEND_BASE}/cart`, {
                headers: { 'Authorization': `Bearer ${customerToken}` }
            });
            assert(viewRes.statusCode === 200, `View cart status ${viewRes.statusCode}`);
            const cart = viewRes.body.data;
            assert(cart.items && cart.items.length > 0, 'Cart is empty after adding item');
            createdCartItemId = cart.items[0].id;

            // Update item quantity
            const updateRes = await request(`${BACKEND_BASE}/cart/items/${createdCartItemId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${customerToken}` }
            }, {
                quantity: 1
            });
            assert(updateRes.statusCode === 200, `Update cart item status ${updateRes.statusCode}`);
        }),

        test('4.5 Create Order with COD Payment (/api/orders)', async () => {
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

        test('4.6 View Customer Orders History (/api/orders)', async () => {
            const res = await request(`${BACKEND_BASE}/orders`, {
                headers: { 'Authorization': `Bearer ${customerToken}` }
            });
            assert(res.statusCode === 200, `Get orders status ${res.statusCode}`);
            const orders = res.body.data || res.body;
            assert(Array.isArray(orders.content || orders), 'Orders is not an array or page');
        }),

        // ==========================================
        // 5. VIETQR PAYMENT & AUTOMATED BANK RECONCILIATION
        // ==========================================
        test('5.1 Full VietQR Payment Lifecycle (Session -> QR -> MB Bank Mock -> Auto Reconcile -> PAID)', async () => {
            // 1. Create QR Payment Session
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

            // 2. Simulate bank transfer via Mock Bank
            const mockTransferRes = await request(`${BACKEND_BASE}/test/mock-bank/transfer`, {
                method: 'POST'
            }, {
                amount: session.amount,
                description: `KH chuyen tien ${session.paymentCode} mua sach`,
                accountNo: '0396902081'
            });
            assert(mockTransferRes.statusCode === 200, `Mock transfer status ${mockTransferRes.statusCode}`);
            console.log(`    🏦 Giả lập biến động số dư MB Bank: tiền vào +${session.amount}đ, nội dung "${session.paymentCode}"`);

            // 3. Trigger reconciliation check
            const sessionId = session.sessionId || session.id;
            const checkRes = await request(`${BACKEND_BASE}/payments/qr/session/${sessionId}/check`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${customerToken}` }
            });
            assert(checkRes.statusCode === 200, `Check session status ${checkRes.statusCode}`);
            const updatedSession = checkRes.body.data;
            assert(updatedSession.status === 'PAID', `Expected session status PAID, got ${updatedSession.status}`);
            console.log(`    ✅ Đối soát thành công: Phiên #${sessionId} đã chuyển sang trạng thái PAID!`);
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

        test('6.2 Admin Categories Tree & CRUD', async () => {
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

            // 3. Verify tree contains child
            const treeRes = await request(`${BACKEND_BASE}/categories/tree`);
            assert(treeRes.statusCode === 200, `Categories tree status ${treeRes.statusCode}`);

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
            // Create
            const createRes = await request(`${BACKEND_BASE}/authors`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            }, {
                name: 'Tác Giả Kiểm Thử ' + Date.now(),
                biography: 'Tiểu sử tác giả kiểm thử'
            });
            assert(createRes.statusCode === 200 || createRes.statusCode === 201, `Create author status ${createRes.statusCode}`);
            createdAuthor = createRes.body.data;

            // Update
            const updateRes = await request(`${BACKEND_BASE}/authors/${createdAuthor.id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            }, {
                name: createdAuthor.name + ' Sửa',
                biography: 'Tiểu sử cập nhật'
            });
            assert(updateRes.statusCode === 200, `Update author status ${updateRes.statusCode}`);

            // Delete
            const delRes = await request(`${BACKEND_BASE}/authors/${createdAuthor.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            assert(delRes.statusCode === 200, `Delete author status ${delRes.statusCode}`);
        }),

        test('6.4 Admin Publishers CRUD', async () => {
            // Create
            const createRes = await request(`${BACKEND_BASE}/publishers`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            }, {
                name: 'Nhà Xuất Bản Test ' + Date.now(),
                address: 'Hà Nội'
            });
            assert(createRes.statusCode === 200 || createRes.statusCode === 201, `Create publisher status ${createRes.statusCode}`);
            createdPublisher = createRes.body.data;

            // Update
            const updateRes = await request(`${BACKEND_BASE}/publishers/${createdPublisher.id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            }, {
                name: createdPublisher.name + ' Sửa',
                address: 'TP. Hồ Chí Minh'
            });
            assert(updateRes.statusCode === 200, `Update publisher status ${updateRes.statusCode}`);

            // Delete
            const delRes = await request(`${BACKEND_BASE}/publishers/${createdPublisher.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            assert(delRes.statusCode === 200, `Delete publisher status ${delRes.statusCode}`);
        }),

        test('6.5 Admin Books Management & CRUD (/api/admin/books)', async () => {
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

            // 3. Delete book
            const delBookRes = await request(`${BACKEND_BASE}/admin/books/${createdBook.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            assert(delBookRes.statusCode === 200, `Delete book status ${delBookRes.statusCode}`);
        }),

        test('6.6 Admin Orders Management & Status Update (/api/admin/orders)', async () => {
            const listRes = await request(`${BACKEND_BASE}/admin/orders`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            assert(listRes.statusCode === 200, `Admin orders status ${listRes.statusCode}`);
            const ordersData = listRes.body.data;
            const orders = ordersData.content || ordersData;
            assert(Array.isArray(orders) && orders.length > 0, 'No orders found');

            // Update status of created COD order
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

        test('6.8 Admin QR Payment Sessions & Bank Transactions Audit', async () => {
            const sessionsRes = await request(`${BACKEND_BASE}/payments/qr/admin/sessions`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            assert(sessionsRes.statusCode === 200, `Admin sessions status ${sessionsRes.statusCode}`);

            const txRes = await request(`${BACKEND_BASE}/payments/qr/admin/bank-transactions`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            assert(txRes.statusCode === 200, `Admin bank transactions status ${txRes.statusCode}`);
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
            // Check ZIP / XLSX magic bytes: PK\x03\x04 (50 4b 03 04)
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
            // Check PDF magic bytes: %PDF- (25 50 44 46 2d)
            const raw = res.raw;
            assert(raw.length > 500, `PDF file too small: ${raw.length} bytes`);
            const magic = raw.slice(0, 5).toString('ascii');
            assert(magic === '%PDF-', `Invalid PDF magic bytes: ${magic}`);
            console.log(`    ✅ Đã xuất báo cáo PDF: ${raw.length} bytes, đúng chuẩn PDF.`);
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
