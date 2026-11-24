package com.bookstore.api.dto.request;

import com.bookstore.api.entity.Address;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddressRequest {

    @NotBlank(message = "Tên người nhận không được để trống")
    private String recipientName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(0|\\+84)[0-9]{9}$", message = "Số điện thoại không hợp lệ")
    private String phone;

    @NotBlank(message = "Tỉnh/Thành phố không được để trống")
    private String province;

    // Cách chia hành chính 2 cấp (tỉnh -> phường/xã) không có quận/huyện; chỉ còn cho địa chỉ cũ
    private String district;

    @NotBlank(message = "Phường/Xã không được để trống")
    private String ward;

    @NotBlank(message = "Địa chỉ chi tiết không được để trống")
    private String detailAddress;

    @Builder.Default
    private Boolean isDefault = false;

    @Builder.Default
    private Address.AddressType addressType = Address.AddressType.HOME;
}
