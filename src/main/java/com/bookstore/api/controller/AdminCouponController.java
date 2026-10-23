package com.bookstore.api.controller;

import com.bookstore.api.common.ApiResponse;
import com.bookstore.api.dto.request.CouponRequest;
import com.bookstore.api.dto.response.CouponResponse;
import com.bookstore.api.entity.Coupon;
import com.bookstore.api.exception.BadRequestException;
import com.bookstore.api.exception.ResourceNotFoundException;
import com.bookstore.api.repository.CouponRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/** Quản lý mã giảm giá cho admin (khách chỉ xem/áp mã qua /api/coupons). */
@RestController
@RequestMapping("/api/admin/coupons")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminCouponController {

    private final CouponRepository couponRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CouponResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(couponRepository.findAll().stream()
                .map(CouponResponse::fromEntity).collect(Collectors.toList())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CouponResponse>> create(@Valid @RequestBody CouponRequest request) {
        String code = request.getCode().trim().toUpperCase();
        if (couponRepository.findByCode(code).isPresent()) {
            throw new BadRequestException("Mã giảm giá " + code + " đã tồn tại");
        }
        Coupon coupon = new Coupon();
        coupon.setCode(code);
        apply(coupon, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đã tạo mã giảm giá", CouponResponse.fromEntity(couponRepository.save(coupon))));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CouponResponse>> update(@PathVariable Long id, @Valid @RequestBody CouponRequest request) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon", "id", id));
        apply(coupon, request);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật mã giảm giá", CouponResponse.fromEntity(couponRepository.save(coupon))));
    }

    private void apply(Coupon coupon, CouponRequest r) {
        coupon.setDescription(r.getDescription());
        coupon.setDiscountType(r.getDiscountType());
        coupon.setDiscountValue(r.getDiscountValue());
        coupon.setMinOrderAmount(r.getMinOrderAmount());
        coupon.setMaxDiscountAmount(r.getMaxDiscountAmount());
        coupon.setStartDate(r.getStartDate());
        coupon.setEndDate(r.getEndDate());
        coupon.setUsageLimit(r.getUsageLimit());
        coupon.setActive(r.getActive() == null || r.getActive());
    }
}
