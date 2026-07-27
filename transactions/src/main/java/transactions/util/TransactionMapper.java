package transactions.util;

import transactions.dto.TransactionResponse;
import transactions.entity.Transaction;

public final class TransactionMapper {

    private TransactionMapper() {
    }

    public static TransactionResponse toResponse(Transaction transaction) {
        return new TransactionResponse(
                transaction.getTransactionId(),
                transaction.getCardNumber(),
                transaction.getTransactionType(),
                transaction.getAmount(),
                transaction.getMerchantId(),
                transaction.getTransactionDateTime(),
                transaction.getStatus(),
                transaction.getFailureReason()
        );
    }
}