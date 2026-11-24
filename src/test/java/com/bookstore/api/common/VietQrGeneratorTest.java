package com.bookstore.api.common;

import com.google.zxing.BinaryBitmap;
import com.google.zxing.client.j2se.BufferedImageLuminanceSource;
import com.google.zxing.common.HybridBinarizer;
import com.google.zxing.qrcode.QRCodeReader;
import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.io.ByteArrayInputStream;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

class VietQrGeneratorTest {

    @Test
    void crc16MatchesCcittFalseCheckValue() {
        // Giá trị kiểm tra chuẩn của CRC-16/CCITT-FALSE
        assertEquals("29B1", VietQrGenerator.crc16("123456789"));
    }

    @Test
    void payloadFollowsNapasFormat() {
        String payload = VietQrGenerator.buildPayload("970422", "0396902081", 206000, "BKABCD2345");

        // Chuỗi giải mã từ ảnh img.vietqr.io/image/970422-0396902081-qr_only.png?amount=206000&addInfo=BKABCD2345
        assertEquals("00020101021238540010A00000072701240006970422011003969020810208QRIBFTTA"
                + "530370454062060005802VN62140810BKABCD23456304196C", payload);
    }

    @Test
    void qrImageDecodesBackToPayload() throws Exception {
        String payload = VietQrGenerator.buildPayload("970422", "0396902081", 88000, "BKZXCV7890");
        String dataUri = VietQrGenerator.toPngDataUri(payload, 300);
        assertTrue(dataUri.startsWith("data:image/png;base64,"));

        byte[] png = Base64.getDecoder().decode(dataUri.substring("data:image/png;base64,".length()));
        var image = ImageIO.read(new ByteArrayInputStream(png));
        var bitmap = new BinaryBitmap(new HybridBinarizer(new BufferedImageLuminanceSource(image)));
        assertEquals(payload, new QRCodeReader().decode(bitmap).getText());
    }
}
