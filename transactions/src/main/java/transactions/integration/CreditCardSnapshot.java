package transactions.integration;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CreditCardSnapshot {
    private String cardNumber;
    private int customerId;
    private String cardType;
    private BigDecimal creditLimit;
    private BigDecimal availableCredit;
    private BigDecimal outstandingAmount;
    private LocalDate expiryDate;
    private String cardStatus;

    // getters, setters, constructors
}