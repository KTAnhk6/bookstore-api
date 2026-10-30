package com.bookstore.api.service;

import com.bookstore.api.dto.bank.BankHistoryResponse;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Ngân hàng giả lập trong bộ nhớ: lưu các giao dịch "khách chuyển khoản" để test
 * khi chưa đặt BANK_HISTORY_URL. Dữ liệu mất khi tắt server.
 */
@Component
public class MockBankStore {

    private static final DateTimeFormatter BANK_TIME = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    private static final int MAX_SIZE = 100;

    private final List<BankHistoryResponse.Tran> transactions = new ArrayList<>();

    public synchronized BankHistoryResponse.Tran addIncoming(String accountNo, long amount, String senderName, String description) {
        String refNo = "MOCK" + System.currentTimeMillis() + ThreadLocalRandom.current().nextInt(100, 1000);
        String now = LocalDateTime.now().format(BANK_TIME);
        String sender = (senderName == null || senderName.isBlank()) ? "KHACH HANG TEST" : senderName.trim();
        BankHistoryResponse.Tran tran = new BankHistoryResponse.Tran(
                refNo, refNo, now, now, accountNo,
                String.valueOf(amount), "0", "VND",
                sender + " chuyen tien " + description + " Ma GD ACSP " + refNo.substring(refNo.length() - 6),
                "0", "");
        transactions.add(0, tran); // mới nhất lên đầu, giống sao kê thật
        if (transactions.size() > MAX_SIZE) {
            transactions.remove(transactions.size() - 1);
        }
        return tran;
    }

    public synchronized List<BankHistoryResponse.Tran> list() {
        return List.copyOf(transactions);
    }

    public synchronized void clear() {
        transactions.clear();
    }
}
