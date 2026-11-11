package com.bookstore.api.dto.request;

import com.bookstore.api.entity.Coupon;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
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
    @DecimalMin(value = "0", inclusive = false, message = "Giá trị giảm giá phải lớn hơn 0")
    private BigDecimal discountValue;

    @PositiveOrZero(message = "Đơn tối thiểu không được âm")
    private BigDecimal minOrderAmount;
    @PositiveOrZero(message = "Mức giảm tối đa không được âm")
    private BigDecimal maxDiscountAmount;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    @Min(value = 0, message = "Số lượt sử dụng không được âm")
    private Integer usageLimit;

    @Builder.Default
    private Boolean active = true;

    @Builder.Default
    private Boolean firstOrderOnly = false;

    @AssertTrue(message = "Giảm theo phần trăm không được vượt quá 100%")
    public boolean isPercentInRange() {
        return discountType != Coupon.DiscountType.PERCENTAGE || discountValue == null
                || discountValue.compareTo(BigDecimal.valueOf(100)) <= 0;
    }

    @AssertTrue(message = "Ngày kết thúc phải sau ngày bắt đầu")
    public boolean isDateRangeValid() {
        return startDate == null || endDate == null || endDate.isAfter(startDate);
    }
}
