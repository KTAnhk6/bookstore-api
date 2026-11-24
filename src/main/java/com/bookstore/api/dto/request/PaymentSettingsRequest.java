package com.bookstore.api.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PaymentSettingsRequest {

    // Link API lịch sử giao dịch ngân hàng. Để trống = xóa cài đặt đã lưu.
    private String historyUrl;
}
