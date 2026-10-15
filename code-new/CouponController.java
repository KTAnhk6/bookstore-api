package com.bookstore.api.controller;

import com.bookstore.api.common.ApiResponse;
import com.bookstore.api.dto.response.CouponResponse;
import com.bookstore.api.entity.Coupon;
import com.bookstore.api.exception.BadRequestException;
import com.bookstore.api.exception.ResourceNotFoundException;
import com.bookstore.api.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponRepository couponRepository;

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
            @RequestParam(required = false, defaultValue = "0") BigDecimal orderAmount) {
        Coupon coupon = couponRepository.findByCodeIgnoreCaseAndActiveTrue(code.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Mã giảm giá không tồn tại hoặc đã hết hiệu lực"));

        if (!coupon.isValid(orderAmount)) {
            throw new BadRequestException("Mã giảm giá không hợp lệ hoặc đơn hàng chưa đạt giá trị tối thiểu "
                    + (coupon.getMinOrderAmount() != null ? coupon.getMinOrderAmount() + "đ" : ""));
        }

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
