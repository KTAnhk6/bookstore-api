package com.bookstore.api.service;

import lombok.Builder;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.Duration;
import java.util.Locale;

@Service
@Slf4j
public class ShippingService {

    private static final JsonMapper JSON = JsonMapper.builder().build();

    private volatile HttpClient httpClient;

    private HttpClient getHttpClient() {
        if (httpClient == null) {
            synchronized (this) {
                if (httpClient == null) {
                    httpClient = HttpClient.newBuilder()
                            .connectTimeout(Duration.ofSeconds(5))
                            .build();
                }
            }
        }
        return httpClient;
    }

    @Value("${shipping.google.api-key:}")
    private String googleApiKey;

    public boolean hasGoogleApiKey() {
        return googleApiKey != null && !googleApiKey.isBlank();
    }

    @Value("${shipping.warehouse.hn.name:Kho BookNest Hà Nội (144 Xuân Thủy, Cầu Giấy)}")
    private String hnName;

    @Value("${shipping.warehouse.hn.coords:21.0368,105.7821}")
    private String hnCoords;

    @Value("${shipping.warehouse.hcm.name:Kho BookNest TP.HCM (Khu ĐHQG Thủ Đức)}")
    private String hcmName;

    @Value("${shipping.warehouse.hcm.coords:10.8700,106.8031}")
    private String hcmCoords;

    @Value("${shipping.free-threshold:300000}")
    private BigDecimal freeThreshold;

    @Value("${shipping.free-max-subsidy:30000}")
    private BigDecimal freeMaxSubsidy;

    @Getter
    @Builder
    public static class ShippingQuote {
        private final String warehouseName;
        private final String destinationAddress;
        private final double distanceKm;
        private final String durationText;
        private final BigDecimal rawFee;
        private final BigDecimal discountFee;
        private final BigDecimal shippingFee;
        private final String source;
    }

    /**
     * Tính phí vận chuyển từ kho gần nhất (Hà Nội hoặc TP.HCM) tới địa chỉ khách hàng.
     */
    public ShippingQuote calculateShipping(
            String province,
            String district,
            String ward,
            String detailAddress,
            BigDecimal subtotal,
            int totalBooks
    ) {
        String fullDest = buildDestinationAddress(detailAddress, ward, district, province);
        DistanceResult dist = queryGoogleDistanceMatrix(fullDest);

        if (dist == null) {
            dist = estimateFallbackDistance(province, district, ward, detailAddress);
        }

        double km = Math.max(0.5, Math.round(dist.distanceKm * 10.0) / 10.0);

        // 1. Tính cước bậc thang liên tục theo khoảng cách (km)
        double distFee;
        if (km <= 5.0) {
            distFee = 15000;
        } else if (km <= 20.0) {
            distFee = 15000 + (km - 5.0) * 2500;
        } else {
            distFee = Math.min(80000, 52500 + (km - 20.0) * 500);
        }

        // 2. Phụ phí khối lượng sách (miễn phí 4 cuốn đầu, từ cuốn thứ 5 cộng 2.000đ/cuốn)
        int extraBooks = Math.max(0, totalBooks - 4);
        double weightFee = extraBooks * 2000.0;

        // Làm tròn lên theo bội số 1.000đ
        long rawRounded = (long) (Math.ceil((distFee + weightFee) / 1000.0) * 1000L);
        BigDecimal rawFee = BigDecimal.valueOf(rawRounded);

        // 3. Áp dụng ưu đãi cho đơn hàng >= 300.000đ
        BigDecimal discountFee = BigDecimal.ZERO;
        BigDecimal finalFee = rawFee;

        if (subtotal != null && subtotal.compareTo(freeThreshold) >= 0) {
            if (km <= 15.0) {
                discountFee = rawFee;
                finalFee = BigDecimal.ZERO;
            } else {
                discountFee = rawFee.min(freeMaxSubsidy);
                finalFee = rawFee.subtract(discountFee).max(BigDecimal.ZERO);
            }
        }

        return ShippingQuote.builder()
                .warehouseName(dist.warehouseName)
                .destinationAddress(fullDest)
                .distanceKm(km)
                .durationText(dist.durationText)
                .rawFee(rawFee)
                .discountFee(discountFee)
                .shippingFee(finalFee)
                .source(dist.source)
                .build();
    }

    /**
     * Gọi Google Maps Distance Matrix API với 2 origins (Kho HN | Kho HCM) -> lấy kho có quãng đường ngắn nhất.
     */
    private DistanceResult queryGoogleDistanceMatrix(String destination) {
        if (googleApiKey == null || googleApiKey.isBlank()) {
            return null;
        }
        try {
            String origins = hnCoords + "|" + hcmCoords;
            String url = "https://maps.googleapis.com/maps/api/distancematrix/json"
                    + "?origins=" + URLEncoder.encode(origins, StandardCharsets.UTF_8)
                    + "&destinations=" + URLEncoder.encode(destination + ", Việt Nam", StandardCharsets.UTF_8)
                    + "&mode=driving&language=vi"
                    + "&key=" + URLEncoder.encode(googleApiKey.trim(), StandardCharsets.UTF_8);

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(5))
                    .GET()
                    .build();

            HttpResponse<String> res = getHttpClient().send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) return null;

            JsonNode root = JSON.readTree(res.body());
            if (!"OK".equals(root.path("status").asText())) return null;

            JsonNode rows = root.path("rows");
            if (!rows.isArray() || rows.size() < 2) return null;

            DistanceResult hnRes = parseElement(rows.get(0), hnName);
            DistanceResult hcmRes = parseElement(rows.get(1), hcmName);

            if (hnRes != null && hcmRes != null) {
                return hnRes.distanceKm <= hcmRes.distanceKm ? hnRes : hcmRes;
            }
            return hnRes != null ? hnRes : hcmRes;
        } catch (Exception e) {
            log.warn("[SHIPPING] Không gọi được Google Maps API ({}), chuyển sang ước lượng nội bộ.", e.getMessage());
            return null;
        }
    }

    private DistanceResult parseElement(JsonNode rowNode, String warehouseName) {
        JsonNode el = rowNode.path("elements").path(0);
        if (!"OK".equals(el.path("status").asText())) return null;
        long meters = el.path("distance").path("value").asLong(-1);
        String duration = el.path("duration").path("text").asText("");
        if (meters < 0) return null;
        return new DistanceResult(warehouseName, meters / 1000.0, duration, "GOOGLE_MAPS");
    }

    /**
     * Dự phòng khi chưa cấu hình GOOGLE_MAPS_API_KEY:
     * Tự động chọn Kho Hà Nội hoặc Kho TP.HCM dựa theo Tỉnh/Thành và ước lượng số km sát thực tế.
     */
    private DistanceResult estimateFallbackDistance(String province, String district, String ward, String detail) {
        String normProv = normalize(province);
        String normFull = normalize((detail == null ? "" : detail) + " " + (ward == null ? "" : ward) + " " + (district == null ? "" : district));

        // 1. Nội thành Hà Nội (Kho tại 144 Xuân Thủy, Cầu Giấy)
        if (normProv.contains("ha noi")) {
            double km = 7.5;
            if (normFull.contains("cau giay") || normFull.contains("dich vong") || normFull.contains("xuan thuy") || normFull.contains("my dinh") || normFull.contains("mai dich") || normFull.contains("yen hoa") || normFull.contains("trung hoa")) {
                km = 2.8;
            } else if (normFull.contains("ba dinh") || normFull.contains("dong da") || normFull.contains("bac tu liem") || normFull.contains("nam tu liem") || normFull.contains("tay ho") || normFull.contains("lang ha") || normFull.contains("kim ma")) {
                km = 5.5;
            } else if (normFull.contains("hoan kiem") || normFull.contains("hai ba trung") || normFull.contains("thanh xuan") || normFull.contains("hoang mai") || normFull.contains("bach khoa") || normFull.contains("dai co viet")) {
                km = 8.5;
            } else if (normFull.contains("long bien") || normFull.contains("ha dong") || normFull.contains("gia lam") || normFull.contains("dong anh") || normFull.contains("thanh tri")) {
                km = 14.0;
            } else {
                km = 18.0;
            }
            return new DistanceResult(hnName, km, Math.round(km * 2.5) + " phút", "FALLBACK_ESTIMATE");
        }

        // 2. Nội thành TP. Hồ Chí Minh (Kho tại Khu ĐHQG Thủ Đức)
        if (normProv.contains("ho chi minh") || normProv.contains("tp hcm") || normProv.contains("tphcm")) {
            double km = 12.0;
            if (normFull.contains("thu duc") || normFull.contains("linh trung") || normFull.contains("linh xuan") || normFull.contains("hiep binh") || normFull.contains("linh chieu") || normFull.contains("binh tho") || normFull.contains("tang nhon phu") || normFull.contains("thao dien")) {
                km = 3.2;
            } else if (normFull.contains("binh thanh") || normFull.contains("go vap") || normFull.contains("quan 9") || normFull.contains("quan 2")) {
                km = 9.5;
            } else if (normFull.contains("quan 1") || normFull.contains("quan 3") || normFull.contains("phu nhuan") || normFull.contains("tan binh") || normFull.contains("ben nghe") || normFull.contains("vo thi sau") || normFull.contains("le loi") || normFull.contains("hai ba trung")) {
                km = 14.2;
            } else if (normFull.contains("quan 4") || normFull.contains("quan 5") || normFull.contains("quan 7") || normFull.contains("quan 10") || normFull.contains("quan 11") || normFull.contains("quan 12") || normFull.contains("tan phu")) {
                km = 17.5;
            } else {
                km = 22.0;
            }
            return new DistanceResult(hcmName, km, Math.round(km * 2.5) + " phút", "FALLBACK_ESTIMATE");
        }

        // 3. Các tỉnh lân cận TP.HCM
        if (normProv.contains("binh duong") || normProv.contains("dong nai")) {
            return new DistanceResult(hcmName, 18.0, "35 phút", "FALLBACK_ESTIMATE");
        }
        if (normProv.contains("long an") || normProv.contains("ba ria") || normProv.contains("vung tau") || normProv.contains("tay ninh") || normProv.contains("tien giang")) {
            return new DistanceResult(hcmName, 65.0, "1 giờ 30 phút", "FALLBACK_ESTIMATE");
        }

        // 4. Các tỉnh lân cận Hà Nội
        if (normProv.contains("bac ninh") || normProv.contains("hung yen") || normProv.contains("vinh phuc")) {
            return new DistanceResult(hnName, 32.0, "50 phút", "FALLBACK_ESTIMATE");
        }
        if (normProv.contains("hai phong") || normProv.contains("hai duong") || normProv.contains("ha nam") || normProv.contains("nam dinh") || normProv.contains("thai nguyen") || normProv.contains("bac giang")) {
            return new DistanceResult(hnName, 75.0, "1 giờ 40 phút", "FALLBACK_ESTIMATE");
        }

        // 5. Phân vùng Bắc / Nam cho các tỉnh còn lại
        boolean isNorth = normProv.matches(".*(quang ninh|ninh binh|thanh hoa|nghe an|ha tinh|phu tho|tuyen quang|yen bai|lao cai|lang son|cao bang|son la|dien bien|hoa binh|lai chau|ha giang|bac kan).*");
        if (isNorth) {
            return new DistanceResult(hnName, 150.0, "3 giờ", "FALLBACK_ESTIMATE");
        }
        return new DistanceResult(hcmName, 160.0, "3 giờ 15 phút", "FALLBACK_ESTIMATE");
    }

    private String buildDestinationAddress(String detail, String ward, String district, String province) {
        StringBuilder sb = new StringBuilder();
        if (detail != null && !detail.isBlank()) sb.append(detail.trim());
        if (ward != null && !ward.isBlank()) {
            if (!sb.isEmpty()) sb.append(", ");
            sb.append(ward.trim());
        }
        if (district != null && !district.isBlank()) {
            if (!sb.isEmpty()) sb.append(", ");
            sb.append(district.trim());
        }
        if (province != null && !province.isBlank()) {
            if (!sb.isEmpty()) sb.append(", ");
            sb.append(province.trim());
        }
        return sb.toString();
    }

    private static String normalize(String input) {
        if (input == null) return "";
        String nfd = Normalizer.normalize(input, Normalizer.Form.NFD);
        return nfd.replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .replace('đ', 'd').replace('Đ', 'D')
                .toLowerCase(Locale.ROOT).trim();
    }

    private record DistanceResult(String warehouseName, double distanceKm, String durationText, String source) {}
}
