package transactions.constants;

public final class TransactionConstants {

    private TransactionConstants() {
    }

    public static final String CARD_NOT_FOUND = "Credit card not found";
    public static final String MERCHANT_NOT_FOUND = "Merchant not found";
    public static final String CARD_BLOCKED = "Card is blocked";
    public static final String CARD_EXPIRED = "Card has expired";
    public static final String INSUFFICIENT_CREDIT = "Insufficient available credit";
    public static final String PAYMENT_EXCEEDS_OUTSTANDING = "Payment amount cannot exceed outstanding balance";
    public static final String INVALID_AMOUNT = "Amount must be greater than zero";
    public static final String PURCHASE_REQUEST_NULL = "Purchase request cannot be null";
    public static final String PAYMENT_REQUEST_NULL = "Payment request cannot be null";
}