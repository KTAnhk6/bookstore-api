package com.bookstore.api.dto.bank;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Định dạng JSON của API lịch sử giao dịch MB Bank (id.xapi.vn/historyapimbbank/...).
 * Ngân hàng giả lập cũng trả đúng định dạng này.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record BankHistoryResponse(
        String status,
        String message,
        @JsonProperty("TranList") List<Tran> tranList
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Tran(
            String refNo,
            String tranId,
            String postingDate,
            String transactionDate,   // dd/MM/yyyy HH:mm:ss
            String accountNo,
            String creditAmount,      // tiền vào
            String debitAmount,       // tiền ra
            String currency,
            String description,
            String availableBalance,
            String beneficiaryAccount
    ) {
    }
}
