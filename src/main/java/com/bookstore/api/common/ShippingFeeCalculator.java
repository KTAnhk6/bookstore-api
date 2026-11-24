package com.bookstore.api.common;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.Locale;
import java.util.Set;

/**
 * Phí vận chuyển theo vùng, giao từ chi nhánh gần nhất (Hà Nội hoặc TP.HCM):
 * nội thành 20.000đ, cùng miền Bắc/Nam 30.000đ, miền Trung - Tây Nguyên 40.000đ.
 * Tiền hàng từ 300.000đ được miễn phí toàn quốc.
 */
public final class ShippingFeeCalculator {

    public static final BigDecimal FREE_SHIPPING_THRESHOLD = new BigDecimal("300000");
    public static final BigDecimal INNER_CITY_FEE = new BigDecimal("20000");
    public static final BigDecimal SAME_REGION_FEE = new BigDecimal("30000");
    public static final BigDecimal FAR_REGION_FEE = new BigDecimal("40000");

    // Tên tỉnh (34 đơn vị sau sáp nhập 2025) đã bỏ dấu, bỏ tiền tố "Thành phố"/"Tỉnh"
    private static final Set<String> INNER_CITY = Set.of("ha noi", "ho chi minh", "hcm");

    private static final Set<String> SAME_REGION = Set.of(
            // miền Bắc - giao từ Hà Nội
            "hai phong", "quang ninh", "bac ninh", "hung yen", "ninh binh", "phu tho", "thai nguyen",
            "tuyen quang", "lao cai", "lang son", "cao bang", "lai chau", "dien bien", "son la",
            // miền Nam - giao từ TP.HCM
            "can tho", "tay ninh", "dong nai", "dong thap", "an giang", "vinh long", "ca mau");

    private ShippingFeeCalculator() {
    }

    public static BigDecimal calculate(BigDecimal subtotal, String province) {
        if (subtotal == null || subtotal.signum() <= 0 || subtotal.compareTo(FREE_SHIPPING_THRESHOLD) >= 0) {
            return BigDecimal.ZERO;
        }
        String key = normalize(province);
        if (INNER_CITY.contains(key)) {
            return INNER_CITY_FEE;
        }
        if (SAME_REGION.contains(key)) {
            return SAME_REGION_FEE;
        }
        // miền Trung, Tây Nguyên, hoặc tên tỉnh không nhận ra -> mức xa nhất
        return FAR_REGION_FEE;
    }

    static String normalize(String province) {
        if (province == null) {
            return "";
        }
        String s = Normalizer.normalize(province, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd').replace('Đ', 'D')
                .toLowerCase(Locale.ROOT)
                .replaceAll("\\s+", " ")
                .trim();
        return s.replaceFirst("^(thanh pho|tinh|tp\\.?)\\s*", "");
    }
}
