package com.bookstore.api.dto.response;

import lombok.*;

@Getter
@AllArgsConstructor
public class PaymentSettingsResponse {

    /** REAL = đối soát API ngân hàng thật, MOCK = ngân hàng giả lập. */
    private final String mode;

    /** Nguồn link đang dùng: ADMIN (nhập trên web), ENV (biến môi trường/properties) hoặc NONE. */
    private final String source;

    /** Link đã che token, không bao giờ trả link đầy đủ về trình duyệt. */
    private final String maskedUrl;
}
