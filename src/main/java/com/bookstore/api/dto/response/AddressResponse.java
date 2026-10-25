package com.bookstore.api.dto.response;

import com.bookstore.api.entity.Address;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddressResponse {

    private Long id;
    private Long userId;
    private String recipientName;
    private String phone;
    private String province;
    private String district;
    private String ward;
    private String detailAddress;
    private String fullAddress;
    private Boolean isDefault;
    private Address.AddressType addressType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AddressResponse fromEntity(Address address) {
        if (address == null) return null;
        String fullAddress = String.format("%s, %s, %s, %s",
                address.getDetailAddress() != null ? address.getDetailAddress() : "",
                address.getWard() != null ? address.getWard() : "",
                address.getDistrict() != null ? address.getDistrict() : "",
                address.getProvince() != null ? address.getProvince() : "");

        return AddressResponse.builder()
                .id(address.getId())
                .userId(address.getUser() != null ? address.getUser().getId() : null)
                .recipientName(address.getRecipientName())
                .phone(address.getPhone())
                .province(address.getProvince())
                .district(address.getDistrict())
                .ward(address.getWard())
                .detailAddress(address.getDetailAddress())
                .fullAddress(fullAddress)
                .isDefault(address.getIsDefault())
                .addressType(address.getAddressType())
                .createdAt(address.getCreatedAt())
                .updatedAt(address.getUpdatedAt())
                .build();
    }
}
