package com.bookstore.api.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MockTransferRequest {

    @NotNull(message = "Số tiền không được để trống")
    @Min(value = 1, message = "Số tiền phải lớn hơn 0")
    private Long amount;

    @NotBlank(message = "Nội dung chuyển khoản không được để trống")
    private String description;

    // Tên người chuyển hiển thị trong sao kê (tuỳ chọn)
    private String senderName;
}
