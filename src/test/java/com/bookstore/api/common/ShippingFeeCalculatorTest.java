package com.bookstore.api.common;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class ShippingFeeCalculatorTest {

    private static final BigDecimal SUBTOTAL = new BigDecimal("100000");

    private static BigDecimal fee(String province) {
        return ShippingFeeCalculator.calculate(SUBTOTAL, province);
    }

    @Test
    void innerCityIs20k() {
        assertEquals(0, new BigDecimal("20000").compareTo(fee("Hà Nội")));
        assertEquals(0, new BigDecimal("20000").compareTo(fee("Thành phố Hà Nội")));
        assertEquals(0, new BigDecimal("20000").compareTo(fee("Ha Noi")));
        assertEquals(0, new BigDecimal("20000").compareTo(fee("TP. Hồ Chí Minh")));
        assertEquals(0, new BigDecimal("20000").compareTo(fee("Thành phố Hồ Chí Minh")));
    }

    @Test
    void sameRegionIs30k() {
        assertEquals(0, new BigDecimal("30000").compareTo(fee("Thành phố Hải Phòng")));
        assertEquals(0, new BigDecimal("30000").compareTo(fee("Tỉnh Điện Biên")));
        assertEquals(0, new BigDecimal("30000").compareTo(fee("Thành phố Cần Thơ")));
        assertEquals(0, new BigDecimal("30000").compareTo(fee("Đồng Nai")));
    }

    @Test
    void centralAndUnknownAre40k() {
        assertEquals(0, new BigDecimal("40000").compareTo(fee("Thành phố Đà Nẵng")));
        assertEquals(0, new BigDecimal("40000").compareTo(fee("Tỉnh Đắk Lắk")));
        assertEquals(0, new BigDecimal("40000").compareTo(fee("Không rõ")));
        assertEquals(0, new BigDecimal("40000").compareTo(fee(null)));
    }

    @Test
    void freeFrom300kOrEmptyCart() {
        assertEquals(0, BigDecimal.ZERO.compareTo(ShippingFeeCalculator.calculate(new BigDecimal("300000"), "Tỉnh Đắk Lắk")));
        assertEquals(0, BigDecimal.ZERO.compareTo(ShippingFeeCalculator.calculate(BigDecimal.ZERO, "Hà Nội")));
        assertEquals(0, new BigDecimal("20000").compareTo(ShippingFeeCalculator.calculate(new BigDecimal("299999"), "Hà Nội")));
    }
}
