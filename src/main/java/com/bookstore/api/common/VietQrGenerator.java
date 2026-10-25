package com.bookstore.api.common;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

/**
 * Sinh mã VietQR chuẩn NAPAS (EMVCo) cho chuyển khoản tới tài khoản ngân hàng:
 * app ngân hàng nào ở Việt Nam cũng quét được và tự điền STK, số tiền, nội dung.
 */
public final class VietQrGenerator {

    private static final String NAPAS_GUID = "A000000727";
    private static final String SERVICE_TRANSFER_TO_ACCOUNT = "QRIBFTTA";

    private VietQrGenerator() {
    }

    public static String buildPayload(String bankBin, String accountNo, long amount, String description) {
        String beneficiary = tlv("00", bankBin) + tlv("01", accountNo);
        String merchantInfo = tlv("00", NAPAS_GUID) + tlv("01", beneficiary) + tlv("02", SERVICE_TRANSFER_TO_ACCOUNT);

        String data = tlv("00", "01")                 // Payload format indicator
                + tlv("01", "12")                      // QR động: dùng 1 lần, có số tiền
                + tlv("38", merchantInfo)
                + tlv("53", "704")                     // VND
                + tlv("54", String.valueOf(amount))
                + tlv("58", "VN")
                + tlv("62", tlv("08", description))    // Nội dung chuyển khoản
                + "6304";
        return data + crc16(data);
    }

    public static String toPngDataUri(String payload, int size) {
        try {
            BitMatrix matrix = new QRCodeWriter().encode(payload, BarcodeFormat.QR_CODE, size, size, Map.of(
                    EncodeHintType.MARGIN, 1,
                    EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M,
                    EncodeHintType.CHARACTER_SET, "UTF-8"));
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", out);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(out.toByteArray());
        } catch (WriterException | IOException e) {
            throw new IllegalStateException("Không tạo được ảnh QR", e);
        }
    }

    private static String tlv(String id, String value) {
        return id + String.format("%02d", value.length()) + value;
    }

    // CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) theo chuẩn EMVCo
    static String crc16(String data) {
        int crc = 0xFFFF;
        for (byte b : data.getBytes(StandardCharsets.UTF_8)) {
            crc ^= (b & 0xFF) << 8;
            for (int i = 0; i < 8; i++) {
                crc = (crc & 0x8000) != 0 ? (crc << 1) ^ 0x1021 : crc << 1;
                crc &= 0xFFFF;
            }
        }
        return String.format("%04X", crc);
    }
}
