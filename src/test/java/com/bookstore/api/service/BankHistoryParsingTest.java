package com.bookstore.api.service;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class BankHistoryParsingTest {

    // Cùng định dạng API id.xapi.vn/historyapimbbank (dữ liệu bịa, không phải giao dịch thật)
    private static final String SAMPLE = """
            {"status":"success","message":"Thành công","TranList":[
              {"tranId":"FT26287000000001","postingDate":"14/10/2026 09:15:02","transactionDate":"14/10/2026 09:15:02",
               "accountNo":"0396902081","creditAmount":"206000","debitAmount":"0","currency":"VND",
               "description":"NGUYEN VAN A chuyen tien bk abcd 2345- Ma GD ACSP/ qw123456","availableBalance":"1206000",
               "beneficiaryAccount":"","refNo":"FT26287000000001","extraField":"bỏ qua"},
              {"tranId":"FT26287000000002","postingDate":"14/10/2026 09:20:00","transactionDate":"14/10/2026 09:20:00",
               "accountNo":"0396902081","creditAmount":"0","debitAmount":"50000","currency":"VND",
               "description":"Tien ra","availableBalance":"1156000","beneficiaryAccount":"","refNo":"FT26287000000002"}
            ]}
            """;

    @Test
    void parsesOnlyIncomingTransactions() {
        List<BankHistoryClient.IncomingTransaction> incoming = BankHistoryClient.toIncoming(BankHistoryClient.parse(SAMPLE));

        assertEquals(1, incoming.size());
        BankHistoryClient.IncomingTransaction txn = incoming.get(0);
        assertEquals("FT26287000000001", txn.refNo());
        assertEquals(0, new BigDecimal("206000").compareTo(txn.amount()));
        assertEquals(LocalDateTime.of(2026, 10, 14, 9, 15, 2), txn.transactionDate());
    }

    @Test
    void errorStatusThrows() {
        assertThrows(BankHistoryClient.BankApiException.class,
                () -> BankHistoryClient.parse("{\"status\":\"error\",\"message\":\"Token het han\"}"));
        assertThrows(BankHistoryClient.BankApiException.class, () -> BankHistoryClient.parse("<html>502</html>"));
    }

    @Test
    void matchesCodeDespiteBankAddedTextAndSpacing() {
        Map<String, Long> codes = Map.of("BKABCD2345", 7L, "BKQWER6789", 8L);
        assertEquals(7L, BankReconciliationService.findSession("NGUYEN VAN A chuyen tien bk abcd 2345- Ma GD", codes));
        assertEquals(8L, BankReconciliationService.findSession("MBVCB.123.BKQWER6789.CT tu 0123", codes));
        assertNull(BankReconciliationService.findSession("chuyen tien mua sach", codes));
    }
}
