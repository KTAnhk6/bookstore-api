package com.bookstore.api.controller;

import com.bookstore.api.common.ApiResponse;
import com.bookstore.api.dto.response.CouponResponse;
import com.bookstore.api.entity.Coupon;
import com.bookstore.api.exception.BadRequestException;
import com.bookstore.api.exception.ResourceNotFoundException;
import com.bookstore.api.repository.CouponRepository;
import com.bookstore.api.security.CustomUserDetails;
import com.bookstore.api.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponRepository couponRepository;
    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CouponResponse>>> getActiveCoupons() {
        List<CouponResponse> coupons = couponRepository.findByActiveTrue().stream()
                .map(CouponResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(coupons));
    }

    @GetMapping("/validate")
    public ResponseEntity<ApiResponse<CouponResponse>> validateCoupon(
            @RequestParam String code,
            @RequestParam(required = false, defaultValue = "0") BigDecimal orderAmount,
            @AuthenticationPrincipal CustomUserDetails me
    ) {
        Coupon coupon = couponRepository.findByCodeIgnoreCaseAndActiveTrue(code.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Mã giảm giá không tồn tại hoặc đã hết hiệu lực"));

        if (!coupon.isValid(orderAmount)) {
            BigDecimal min = coupon.getMinOrderAmount();
            if (min != null && orderAmount.compareTo(min) < 0) {
                throw new BadRequestException("Đơn hàng chưa đạt giá trị tối thiểu "
                        + NumberFormat.getIntegerInstance(Locale.forLanguageTag("vi-VN")).format(min) + "đ để dùng mã này");
            }
            throw new BadRequestException("Mã giảm giá đã hết hạn hoặc hết lượt sử dụng");
        }
        if (me != null) orderService.checkCouponUsage(me.getId(), coupon);

        BigDecimal discount = coupon.calculateDiscount(orderAmount);
        CouponResponse response = CouponResponse.fromEntity(coupon);
        response.setCalculatedDiscount(discount);
        return ResponseEntity.ok(ApiResponse.success("Áp dụng mã giảm giá thành công", response));
    }

    @GetMapping("/{code}")
    public ResponseEntity<ApiResponse<CouponResponse>> getCouponByCode(@PathVariable String code) {
        Coupon coupon = couponRepository.findByCode(code.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Coupon", "code", code));
        return ResponseEntity.ok(ApiResponse.success(CouponResponse.fromEntity(coupon)));
    }
}
