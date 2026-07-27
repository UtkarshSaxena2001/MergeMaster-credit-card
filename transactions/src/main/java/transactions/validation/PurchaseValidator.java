package transactions.validation;

import java.math.BigDecimal;
import java.time.LocalDate;

import transactions.constants.TransactionConstants;
import transactions.dto.PurchaseRequest;
import transactions.entity.Transaction;
import transactions.integration.CreditCardRecord;
import transactions.integration.MerchantRecord;
import transactions.exception.CardNotFoundException;
import transactions.exception.InvalidPaymentException;
import transactions.exception.MerchantNotFoundException;

public final class PurchaseValidator {

    private PurchaseValidator() {
    }

    public static void validateRequest(PurchaseRequest request) {
        if (request == null) {
            throw new InvalidPaymentException(TransactionConstants.PURCHASE_REQUEST_NULL);
        }
        if (request.getCardNumber() == null || request.getCardNumber().isBlank()) {
            throw new CardNotFoundException(TransactionConstants.CARD_NOT_FOUND);
        }
        if (request.getMerchantId() == null) {
            throw new MerchantNotFoundException(TransactionConstants.MERCHANT_NOT_FOUND);
        }
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidPaymentException(TransactionConstants.INVALID_AMOUNT);
        }
    }

    public static String validateCard(CreditCardRecord card) {
        if (card == null) {
            return TransactionConstants.CARD_NOT_FOUND;
        }
        if (card.getCardStatus() == null || !card.getCardStatus().equalsIgnoreCase("ACTIVE")) {
            return TransactionConstants.CARD_BLOCKED;
        }
        LocalDate expiryDate = card.getExpiryDate();
        if (expiryDate != null && expiryDate.isBefore(LocalDate.now())) {
            return TransactionConstants.CARD_EXPIRED;
        }
        return null;
    }

    public static String validateMerchant(MerchantRecord merchant) {
        if (merchant == null) {
            return TransactionConstants.MERCHANT_NOT_FOUND;
        }
        return null;
    }
}