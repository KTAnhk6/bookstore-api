package com.bookstore.api.dto.request;

import com.bookstore.api.entity.Coupon;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouponRequest {

    @NotBlank(message = "Mã giảm giá không được để trống")
    private String code;

    private String description;

    @NotNull(message = "Loại giảm giá không được để trống")
    @Builder.Default
    private Coupon.DiscountType discountType = Coupon.DiscountType.PERCENTAGE;

    @NotNull(message = "Giá trị giảm giá không được để trống")
    private BigDecimal discountValue;

    private BigDecimal minOrderAmount;
    private BigDecimal maxDiscountAmount;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer usageLimit;

    @Builder.Default
    private Boolean active = true;
}
