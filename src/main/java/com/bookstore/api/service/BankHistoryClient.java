package com.bookstore.api.service;

import com.bookstore.api.dto.bank.BankHistoryResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

/**
 * Đọc lịch sử giao dịch của tài khoản nhận tiền.
 * - Có BANK_HISTORY_URL: gọi API MB Bank thật.
 * - Không có: đọc từ ngân hàng giả lập (MockBankStore).
 */
@Component
@Slf4j
public class BankHistoryClient {

    private static final DateTimeFormatter BANK_TIME = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    private static final JsonMapper JSON = JsonMapper.builder().build();

    private final String historyUrl;
    private final MockBankStore mockBankStore;
    private final RestClient restClient;

    public BankHistoryClient(@Value("${payment.bank.history-url:}") String historyUrl, MockBankStore mockBankStore) {
        this.historyUrl = historyUrl == null ? "" : historyUrl.trim();
        this.mockBankStore = mockBankStore;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(10));
        factory.setReadTimeout(Duration.ofSeconds(20));
        this.restClient = RestClient.builder().requestFactory(factory).build();
        if (isMockMode()) {
            log.warn("[BANK] Chưa đặt BANK_HISTORY_URL -> dùng NGÂN HÀNG GIẢ LẬP (/api/test/mock-bank), chỉ để test");
        } else {
            log.info("[BANK] Đối soát với API lịch sử giao dịch MB Bank thật");
        }
    }

    public boolean isMockMode() {
        return historyUrl.isEmpty();
    }

    /** Các giao dịch tiền vào gần đây. Ném BankApiException nếu API lỗi. */
    public List<IncomingTransaction> fetchIncoming() {
        List<BankHistoryResponse.Tran> trans;
        if (isMockMode()) {
            trans = mockBankStore.list();
        } else {
            String body;
            try {
                body = restClient.get().uri(historyUrl).retrieve().body(String.class);
            } catch (Exception e) {
                // Không đưa URL vào thông báo lỗi vì URL chứa token
                throw new BankApiException("Không gọi được API ngân hàng: " + e.getClass().getSimpleName(), e);
            }
            trans = parse(body);
        }
        return toIncoming(trans);
    }

    public static List<BankHistoryResponse.Tran> parse(String body) {
        BankHistoryResponse response;
        try {
            response = JSON.readValue(body, BankHistoryResponse.class);
        } catch (Exception e) {
            throw new BankApiException("Dữ liệu API ngân hàng không hợp lệ", e);
        }
        if (response == null || !"success".equalsIgnoreCase(response.status())) {
            throw new BankApiException("API ngân hàng báo lỗi: " + (response == null ? "rỗng" : response.message()), null);
        }
        return response.tranList() == null ? List.of() : response.tranList();
    }

    public static List<IncomingTransaction> toIncoming(List<BankHistoryResponse.Tran> trans) {
        List<IncomingTransaction> result = new ArrayList<>();
        for (BankHistoryResponse.Tran t : trans) {
            BigDecimal credit = toAmount(t.creditAmount());
            String refNo = t.refNo() != null && !t.refNo().isBlank() ? t.refNo() : t.tranId();
            if (credit.signum() <= 0 || refNo == null || refNo.isBlank()) {
                continue; // chỉ quan tâm tiền vào
            }
            result.add(new IncomingTransaction(refNo.trim(), t.accountNo(), credit,
                    t.description() == null ? "" : t.description(), toTime(t.transactionDate())));
        }
        return result;
    }

    private static BigDecimal toAmount(String raw) {
        if (raw == null || raw.isBlank()) return BigDecimal.ZERO;
        try {
            return new BigDecimal(raw.replace(",", "").trim());
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }

    private static LocalDateTime toTime(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return LocalDateTime.parse(raw.trim(), BANK_TIME);
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    public record IncomingTransaction(String refNo, String accountNo, BigDecimal amount,
                                      String description, LocalDateTime transactionDate) {
    }

    public static class BankApiException extends RuntimeException {
        public BankApiException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
