package com.bookstore.api.service;

import com.bookstore.api.dto.response.PaymentSettingsResponse;
import com.bookstore.api.entity.AppSetting;
import com.bookstore.api.exception.BadRequestException;
import com.bookstore.api.repository.AppSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/** Cài đặt thanh toán do admin nhập trên web: hiện chỉ có link API lịch sử giao dịch ngân hàng. */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentSettingsService {

    private final AppSettingRepository settingRepository;
    private final BankHistoryClient bankHistoryClient;

    public PaymentSettingsResponse get() {
        return new PaymentSettingsResponse(bankHistoryClient.isMockMode() ? "MOCK" : "REAL",
                bankHistoryClient.source(), bankHistoryClient.maskedUrl());
    }

    /** Link rỗng = xóa link đã lưu. Link mới được gọi thử, chỉ lưu khi API trả đúng định dạng. */
    public PaymentSettingsResponse updateHistoryUrl(String rawUrl) {
        String url = rawUrl == null ? "" : rawUrl.trim();
        if (url.isEmpty()) {
            settingRepository.findById(AppSetting.BANK_HISTORY_URL).ifPresent(settingRepository::delete);
            log.info("[BANK] Admin đã xóa link API ngân hàng");
            return get();
        }
        if (!url.matches("(?i)^https?://[^\s<>]+$")) {
            throw new BadRequestException("Link phải bắt đầu bằng http:// hoặc https://, không có khoảng trắng và không còn chữ mẫu <...>");
        }
        int fetched;
        try {
            fetched = bankHistoryClient.testConnection(url);
        } catch (BankHistoryClient.BankApiException e) {
            throw new BadRequestException("Link chưa dùng được, chưa lưu: " + e.getMessage());
        }
        settingRepository.save(AppSetting.builder().key(AppSetting.BANK_HISTORY_URL).value(url).build());
        log.info("[BANK] Admin đã lưu link API ngân hàng, gọi thử lấy được {} giao dịch", fetched);
        return get();
    }
}
