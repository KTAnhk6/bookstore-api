package com.bookstore.api.payment;

import com.bookstore.api.entity.BankTransaction;
import com.bookstore.api.entity.Book;
import com.bookstore.api.entity.Order;
import com.bookstore.api.entity.PaymentSession;
import com.bookstore.api.repository.*;
import com.bookstore.api.service.BankReconciliationService;
import com.bookstore.api.service.MockBankStore;
import com.bookstore.api.service.PaymentSessionService;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Kiểm thử luồng thanh toán QR từ đầu đến cuối qua HTTP: tạo phiên, đổi sản phẩm,
 * chuyển khoản (ngân hàng giả lập), đối soát, thiếu tiền, hết hạn, tiền về trễ, hủy, phân quyền.
 */
@SpringBootTest
@ActiveProfiles("test")
class QrPaymentFlowTest {

    private static final String ADDRESS = """
            "recipientName":"Nguyen Van A","phone":"0901234567","province":"Ha Noi",
            "district":"Cau Giay","ward":"Dich Vong","detailAddress":"1 Xuan Thuy"
            """;

    @Autowired WebApplicationContext context;
    @Autowired BookRepository bookRepository;
    @Autowired UserRepository userRepository;
    @Autowired OrderRepository orderRepository;
    @Autowired PaymentRepository paymentRepository;
    @Autowired PaymentSessionRepository sessionRepository;
    @Autowired BankTransactionRepository bankTransactionRepository;
    @Autowired PaymentSessionService paymentSessionService;
    @Autowired BankReconciliationService reconciliationService;
    @Autowired MockBankStore mockBankStore;

    MockMvc mvc;
    String customerToken;
    Long customerId;
    List<Book> books;

    @BeforeEach
    void setUp() throws Exception {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        customerToken = login("customer@bookstore.vn", "password123");
        customerId = userRepository.findByEmail("customer@bookstore.vn").orElseThrow().getId();
        books = bookRepository.findAll();
        mockBankStore.clear();
        // Mỗi test bắt đầu khi khách không còn phiên đang chờ
        for (PaymentSession s : sessionRepository.findByUserIdAndStatusOrderByCreatedAtDesc(customerId, PaymentSession.Status.PENDING)) {
            paymentSessionService.cancelSession(customerId, s.getId());
        }
    }

    @Test
    void sameItemsKeepQr_differentItemsCancelOldSessionAndRestoreStock() throws Exception {
        Book b1 = books.get(0), b2 = books.get(1);
        int stockBefore = stock(b1);

        String first = createSession(b1.getId(), 2);
        long firstId = id(first);
        String firstCode = JsonPath.read(first, "$.data.paymentCode");
        assertTrue(firstCode.matches("BK[A-Z2-9]{8}"));
        assertTrue(((String) JsonPath.read(first, "$.data.qrPayload")).startsWith("000201010212"));
        assertTrue(((String) JsonPath.read(first, "$.data.qrImage")).startsWith("data:image/png;base64,"));
        int remaining = JsonPath.read(first, "$.data.remainingSeconds");
        assertTrue(remaining > 590 && remaining <= 600);
        assertEquals(stockBefore - 2, stock(b1));

        // Bấm thanh toán lại cùng sản phẩm -> vẫn phiên cũ, QR cũ
        String again = createSession(b1.getId(), 2);
        assertEquals(firstId, id(again));
        assertEquals(firstCode, JsonPath.read(again, "$.data.paymentCode"));

        // Đổi sản phẩm -> phiên cũ bị hủy, đơn cũ hủy, hoàn kho; QR mới với nội dung mới
        String second = createSession(b2.getId(), 1);
        assertNotEquals(firstId, id(second));
        assertNotEquals(firstCode, JsonPath.read(second, "$.data.paymentCode"));

        PaymentSession old = sessionRepository.findById(firstId).orElseThrow();
        assertEquals(PaymentSession.Status.CANCELLED, old.getStatus());
        Long oldOrderId = orderIdOf(first);
        assertEquals(Order.OrderStatus.CANCELLED, orderRepository.findById(oldOrderId).orElseThrow().getStatus());
        assertEquals(Order.PaymentStatus.FAILED, paymentRepository.findByOrderId(oldOrderId).orElseThrow().getStatus());
        assertEquals(stockBefore, stock(b1));

        // Chỉ còn đúng 1 phiên đang chờ
        assertEquals(1, sessionRepository.findByUserIdAndStatusOrderByCreatedAtDesc(customerId, PaymentSession.Status.PENDING).size());
    }

    @Test
    void transferWithCorrectContentConfirmsPayment() throws Exception {
        String session = createSession(books.get(0).getId(), 1);
        long sessionId = id(session);
        String code = JsonPath.read(session, "$.data.paymentCode");
        long amount = ((Number) JsonPath.read(session, "$.data.amount")).longValue();

        // App ngân hàng hay chèn tên, dấu cách, chữ thường vào nội dung
        transfer(amount, "NGUYEN VAN A chuyen tien " + code.substring(0, 5).toLowerCase() + " " + code.substring(5));

        // Khách bấm "Tôi đã chuyển khoản"
        ReflectionTestUtils.setField(reconciliationService, "lastSyncAt", 0L);
        mvc.perform(post("/api/payments/qr/session/" + sessionId + "/check").header("Authorization", bearer(customerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PAID"))
                .andExpect(jsonPath("$.data.qrImage").doesNotExist());

        Long orderId = orderIdOf(session);
        Order order = orderRepository.findById(orderId).orElseThrow();
        assertEquals(Order.PaymentStatus.SUCCESS, order.getPaymentStatus());
        assertEquals(Order.OrderStatus.CONFIRMED, order.getStatus());
        assertEquals(Order.PaymentStatus.SUCCESS, paymentRepository.findByOrderId(orderId).orElseThrow().getStatus());

        // Đối soát lại không xử lý trùng giao dịch cũ
        reconciliationService.syncNow();
        assertEquals(1, bankTransactionRepository.findBySessionIdOrderByCreatedAtAsc(sessionId).size());

        // Khách lỡ chuyển thêm lần nữa -> ghi nhận DUPLICATE để hoàn tiền
        transfer(amount, code);
        reconciliationService.syncNow();
        List<BankTransaction> txs = bankTransactionRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
        assertEquals(List.of(BankTransaction.Result.PAID, BankTransaction.Result.DUPLICATE),
                txs.stream().map(BankTransaction::getResult).toList());
    }

    @Test
    void partialTransferWaitsForTheRest() throws Exception {
        String session = createSession(books.get(1).getId(), 3);
        long sessionId = id(session);
        String code = JsonPath.read(session, "$.data.paymentCode");
        long amount = ((Number) JsonPath.read(session, "$.data.amount")).longValue();

        transfer(100000, code);
        reconciliationService.syncNow();
        PaymentSession s = sessionRepository.findById(sessionId).orElseThrow();
        assertEquals(PaymentSession.Status.PENDING, s.getStatus());
        assertEquals(100000, s.getReceivedAmount().longValue());

        transfer(amount - 100000, code);
        reconciliationService.syncNow();
        assertEquals(PaymentSession.Status.PAID, sessionRepository.findById(sessionId).orElseThrow().getStatus());
        assertEquals(List.of(BankTransaction.Result.PARTIAL, BankTransaction.Result.PAID),
                bankTransactionRepository.findBySessionIdOrderByCreatedAtAsc(sessionId).stream().map(BankTransaction::getResult).toList());
    }

    @Test
    void expiredSessionCancelsOrderAndLateMoneyIsFlagged() throws Exception {
        Book book = books.get(2);
        int stockBefore = stock(book);
        String session = createSession(book.getId(), 1);
        long sessionId = id(session);
        String code = JsonPath.read(session, "$.data.paymentCode");
        long amount = ((Number) JsonPath.read(session, "$.data.amount")).longValue();

        // Giả lập đã quá 10 phút
        PaymentSession s = sessionRepository.findById(sessionId).orElseThrow();
        s.setExpiresAt(LocalDateTime.now().minusSeconds(1));
        sessionRepository.save(s);

        assertEquals(1, reconciliationService.expireOverdue(0));
        assertEquals(PaymentSession.Status.EXPIRED, sessionRepository.findById(sessionId).orElseThrow().getStatus());
        assertEquals(Order.OrderStatus.CANCELLED, orderRepository.findById(orderIdOf(session)).orElseThrow().getStatus());
        assertEquals(stockBefore, stock(book));

        // Khách chuyển tiền sau khi hết hạn -> không xác nhận, đánh dấu LATE để hoàn tiền
        transfer(amount, code);
        reconciliationService.syncNow();
        assertEquals(PaymentSession.Status.EXPIRED, sessionRepository.findById(sessionId).orElseThrow().getStatus());
        assertEquals(BankTransaction.Result.LATE,
                bankTransactionRepository.findBySessionIdOrderByCreatedAtAsc(sessionId).get(0).getResult());
    }

    @Test
    void customerCanCancelSessionOnlyOnce() throws Exception {
        Book book = books.get(3);
        int stockBefore = stock(book);
        long sessionId = id(createSession(book.getId(), 2));

        mvc.perform(post("/api/payments/qr/session/" + sessionId + "/cancel").header("Authorization", bearer(customerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));
        assertEquals(stockBefore, stock(book));

        mvc.perform(post("/api/payments/qr/session/" + sessionId + "/cancel").header("Authorization", bearer(customerToken)))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/payments/qr/session/active").header("Authorization", bearer(customerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").doesNotExist());
    }

    @Test
    void sessionsArePrivateAndAdminEndpointsRequireAdmin() throws Exception {
        long sessionId = id(createSession(books.get(4).getId(), 1));
        String adminToken = login("admin@bookstore.vn", "admin123");

        // Người khác không xem được phiên của khách
        mvc.perform(get("/api/payments/qr/session/" + sessionId).header("Authorization", bearer(adminToken)))
                .andExpect(status().isNotFound());
        // Khách không gọi được API quản trị
        mvc.perform(get("/api/payments/qr/admin/sessions").header("Authorization", bearer(customerToken)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/payments/qr/admin/sessions").header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk());
        // Chưa đăng nhập không tạo được phiên
        mvc.perform(post("/api/payments/qr/session").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(result -> assertTrue(result.getResponse().getStatus() == 401 || result.getResponse().getStatus() == 403));
    }

    private String createSession(Long bookId, int quantity) throws Exception {
        String body = "{\"directItems\":[{\"bookId\":" + bookId + ",\"quantity\":" + quantity + "}]," + ADDRESS + "}";
        var res = mvc.perform(post("/api/payments/qr/session").header("Authorization", bearer(customerToken))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andReturn().getResponse();
        String json = res.getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        assertEquals(201, res.getStatus(), json);
        return json;
    }

    private void transfer(long amount, String description) throws Exception {
        mvc.perform(post("/api/test/mock-bank/transfer").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"amount\":" + amount + ",\"description\":\"" + description + "\"}"))
                .andExpect(status().isOk());
    }

    private String login(String email, String password) throws Exception {
        String res = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"usernameOrEmail\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(res, "$.data.token");
    }

    private int stock(Book book) {
        return bookRepository.findById(book.getId()).orElseThrow().getStockQuantity();
    }

    private static long id(String json) {
        return ((Number) JsonPath.read(json, "$.data.sessionId")).longValue();
    }

    private static Long orderIdOf(String json) {
        return ((Number) JsonPath.read(json, "$.data.orderId")).longValue();
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }
}
