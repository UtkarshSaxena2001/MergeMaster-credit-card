package transactions.service;

import java.time.LocalDateTime;
import java.util.List;

import transactions.dto.PaymentRequest;
import transactions.dto.PurchaseRequest;
import transactions.dto.TransactionResponse;

public interface TransactionService {

    // Purchase Transaction
    TransactionResponse purchase(PurchaseRequest request);

    // Bill Payment
    TransactionResponse payment(PaymentRequest request);

    // Get Transaction by ID
    TransactionResponse getTransactionById(Long transactionId);

    // Get All Transactions
    List<TransactionResponse> getAllTransactions();

    // Get Transactions by Card Number
    List<TransactionResponse> getTransactionsByCardNumber(String cardNumber);

    // Get Transactions by Merchant
    List<TransactionResponse> getTransactionsByMerchant(Long merchantId);

    // Get Transactions between Dates
    List<TransactionResponse> getTransactionsByDateRange(
            LocalDateTime from,
            LocalDateTime to
    );
}
