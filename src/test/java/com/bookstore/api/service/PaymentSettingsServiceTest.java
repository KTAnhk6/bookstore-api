package com.bookstore.api.service;

import com.bookstore.api.dto.response.PaymentSettingsResponse;
import com.bookstore.api.entity.AppSetting;
import com.bookstore.api.exception.BadRequestException;
import com.bookstore.api.repository.AppSettingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentSettingsServiceTest {

    @Mock
    private AppSettingRepository settingRepository;

    @Mock
    private BankHistoryClient bankHistoryClient;

    @InjectMocks
    private PaymentSettingsService paymentSettingsService;

    @Test
    void get_returnsCorrectSettings() {
        when(bankHistoryClient.isMockMode()).thenReturn(false);
        when(bankHistoryClient.maskedUrl()).thenReturn("https://id.xapi.vn/…••••1234");
        when(bankHistoryClient.source()).thenReturn("ADMIN");

        PaymentSettingsResponse res = paymentSettingsService.get();

        assertNotNull(res);
        assertEquals("REAL", res.getMode());
        assertEquals("https://id.xapi.vn/…••••1234", res.getMaskedUrl());
        assertEquals("ADMIN", res.getSource());
    }

    @Test
    void updateHistoryUrl_emptyUrlDeletesExistingSetting() {
        AppSetting existing = AppSetting.builder().key(AppSetting.BANK_HISTORY_URL).value("http://old").build();
        when(settingRepository.findById(AppSetting.BANK_HISTORY_URL)).thenReturn(Optional.of(existing));
        when(bankHistoryClient.isMockMode()).thenReturn(true);
        when(bankHistoryClient.maskedUrl()).thenReturn("");
        when(bankHistoryClient.source()).thenReturn("NONE");

        PaymentSettingsResponse res = paymentSettingsService.updateHistoryUrl("   ");

        verify(settingRepository).delete(existing);
        assertEquals("MOCK", res.getMode());
    }

    @Test
    void updateHistoryUrl_validUrlSavesSetting() {
        String url = "https://id.xapi.vn/historyapimbbank/TOKEN123";
        when(bankHistoryClient.testConnection(url)).thenReturn(5);
        when(bankHistoryClient.isMockMode()).thenReturn(false);
        when(bankHistoryClient.maskedUrl()).thenReturn("https://id.xapi.vn/…••••E123");
        when(bankHistoryClient.source()).thenReturn("ADMIN");

        PaymentSettingsResponse res = paymentSettingsService.updateHistoryUrl(url);

        verify(bankHistoryClient).testConnection(url);
        verify(settingRepository).save(any(AppSetting.class));
        assertEquals("REAL", res.getMode());
    }

    @Test
    void updateHistoryUrl_malformedUrlThrowsBadRequest() {
        String invalidUrl = "not-a-valid-url";
        assertThrows(BadRequestException.class, () -> paymentSettingsService.updateHistoryUrl(invalidUrl));
        verify(settingRepository, never()).save(any());
    }

    @Test
    void updateHistoryUrl_bankApiExceptionThrowsBadRequest() {
        String url = "https://id.xapi.vn/historyapimbbank/TOKEN123";
        doThrow(new BankHistoryClient.BankApiException("API connection timeout", new RuntimeException("timeout")))
                .when(bankHistoryClient).testConnection(url);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> paymentSettingsService.updateHistoryUrl(url));
        assertTrue(ex.getMessage().contains("API connection timeout"));
        verify(settingRepository, never()).save(any());
    }
}
