package transactions.validation;

import java.math.BigDecimal;
import java.time.LocalDate;

import transactions.constants.TransactionConstants;
import transactions.dto.PaymentRequest;
import transactions.exception.CardNotFoundException;
import transactions.exception.InvalidPaymentException;
import transactions.integration.CreditCardRecord;

public final class PaymentValidator {

    private PaymentValidator() {
    }

    public static void validateRequest(PaymentRequest request) {
        if (request == null) {
            throw new InvalidPaymentException(TransactionConstants.PAYMENT_REQUEST_NULL);
        }
        if (request.getCardNumber() == null || request.getCardNumber().isBlank()) {
            throw new CardNotFoundException(TransactionConstants.CARD_NOT_FOUND);
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

    public static String validatePaymentAmount(CreditCardRecord card, BigDecimal amount) {
        if (card.getOutstandingAmount() == null || card.getOutstandingAmount().compareTo(amount) < 0) {
            return TransactionConstants.PAYMENT_EXCEEDS_OUTSTANDING;
        }
        return null;
    }
}