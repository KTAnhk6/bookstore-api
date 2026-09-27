package com.bookstore.api.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CouponRequest {

    @NotBlank(message = "Code không được để trống")
    private String code;

    private String name;
    private String description;

    @NotBlank(message = "Loại giảm giá không được để trống")
    private String discountType; // PERCENT | FIXED

    @NotNull @Positive
    private BigDecimal discountValue;

    private BigDecimal maxDiscount;
    private BigDecimal minOrderAmount;
    private Integer usageLimit;
    private Integer perUserLimit;

    @NotNull
    private LocalDateTime startDate;

    @NotNull
    private LocalDateTime endDate;
}