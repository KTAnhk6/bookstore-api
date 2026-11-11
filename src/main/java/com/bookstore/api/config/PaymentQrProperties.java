package com.bookstore.api.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/** Cấu hình tài khoản nhận tiền và phiên QR (payment.qr.* trong application.properties). */
@Component
@ConfigurationProperties(prefix = "payment.qr")
@Getter
@Setter
public class PaymentQrProperties {

    private String bankBin = "970422";
    private String bankName = "MB Bank";
    private String accountNo;
    private String accountName;
    private int sessionMinutes = 10;
    private String codePrefix = "BK";
}
