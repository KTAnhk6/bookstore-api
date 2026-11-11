package com.bookstore.api.service;

import com.bookstore.api.dto.bank.BankHistoryResponse;
import com.bookstore.api.entity.AppSetting;
import com.bookstore.api.repository.AppSettingRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.net.URI;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

/**
 * Đọc lịch sử giao dịch của tài khoản nhận tiền.
 * - Admin đã nhập link trong Cài đặt thanh toán (hoặc có BANK_HISTORY_URL): gọi API MB Bank thật.
 * - Không có link nào: đọc từ ngân hàng giả lập (MockBankStore).
 * Link do admin nhập được ưu tiên hơn biến môi trường, và đọc lại mỗi lần đối soát nên đổi link không cần khởi động lại.
 */
@Component
@Slf4j
public class BankHistoryClient {

    private static final DateTimeFormatter BANK_TIME = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    private static final JsonMapper JSON = JsonMapper.builder().build();

    private final String envHistoryUrl;
    private final MockBankStore mockBankStore;
    private final AppSettingRepository settingRepository;
    private final RestClient restClient;

    public BankHistoryClient(@Value("${payment.bank.history-url:}") String envHistoryUrl, MockBankStore mockBankStore,
                             AppSettingRepository settingRepository) {
        this.envHistoryUrl = envHistoryUrl == null ? "" : envHistoryUrl.trim();
        this.mockBankStore = mockBankStore;
        this.settingRepository = settingRepository;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(10));
        factory.setReadTimeout(Duration.ofSeconds(20));
        this.restClient = RestClient.builder().requestFactory(factory).build();
    }

    @EventListener(ApplicationReadyEvent.class)
    void logMode() {
        if (isMockMode()) {
            log.warn("[BANK] Chưa có link API ngân hàng (admin nhập ở Cài đặt thanh toán) -> dùng NGÂN HÀNG GIẢ LẬP (/api/test/mock-bank), chỉ để test");
        } else {
            log.info("[BANK] Đối soát với API lịch sử giao dịch MB Bank thật (nguồn: {})", source());
        }
    }

    /** Link đang dùng: admin nhập trên web trước, không có thì lấy từ biến môi trường. */
    private String currentUrl() {
        String saved = settingRepository.findById(AppSetting.BANK_HISTORY_URL).map(AppSetting::getValue).orElse("");
        return saved == null || saved.isBlank() ? envHistoryUrl : saved.trim();
    }

    public boolean isMockMode() {
        return currentUrl().isEmpty();
    }

    /** ADMIN = nhập trên web, ENV = biến môi trường, NONE = chưa có. */
    public String source() {
        boolean fromAdmin = settingRepository.findById(AppSetting.BANK_HISTORY_URL)
                .map(AppSetting::getValue).filter(v -> v != null && !v.isBlank()).isPresent();
        if (fromAdmin) return "ADMIN";
        return envHistoryUrl.isEmpty() ? "NONE" : "ENV";
    }

    public String maskedUrl() {
        return mask(currentUrl());
    }

    /** Che token: chỉ để lộ tên miền và 4 ký tự cuối, đủ để admin nhận ra link nào đang dùng. */
    public static String mask(String url) {
        if (url == null || url.isBlank()) return "";
        String tail = "••••" + url.substring(Math.max(0, url.length() - 4));
        try {
            URI uri = URI.create(url);
            if (uri.getScheme() != null && uri.getHost() != null) {
                return uri.getScheme() + "://" + uri.getHost() + "/…" + tail;
            }
        } catch (IllegalArgumentException ignored) {
            // link sai cú pháp: chỉ hiện phần cuối đã che
        }
        return tail;
    }

    /** Gọi thử link, trả về số giao dịch lấy được. Ném BankApiException nếu link sai hoặc API lỗi. */
    public int testConnection(String url) {
        return parse(download(url)).size();
    }

    /** Các giao dịch tiền vào gần đây. Ném BankApiException nếu API lỗi. */
    public List<IncomingTransaction> fetchIncoming() {
        List<BankHistoryResponse.Tran> trans;
        String url = currentUrl();
        if (url.isEmpty()) {
            trans = mockBankStore.list();
        } else {
            trans = parse(download(url));
        }
        return toIncoming(trans);
    }

    private String download(String url) {
        try {
            return restClient.get().uri(url).retrieve().body(String.class);
        } catch (Exception e) {
            // Không đưa URL vào thông báo lỗi vì URL chứa token
            throw new BankApiException("Không gọi được API ngân hàng: " + e.getClass().getSimpleName(), e);
        }
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
