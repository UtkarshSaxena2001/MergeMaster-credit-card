package transactions.integration;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "credit_card")
public class CreditCardRecord {

    @Id
    @Column(name = "card_number", length = 16)
    private String cardNumber;

    @Column(name = "customer_id", nullable = false)
    private int customerId;

    @Column(name = "card_type", nullable = false, length = 20)
    private String cardType;

    @Column(name = "credit_limit", nullable = false, precision = 12, scale = 2)
    private BigDecimal creditLimit;

    @Column(name = "available_credit", nullable = false, precision = 12, scale = 2)
    private BigDecimal availableCredit;

    @Column(name = "outstanding_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal outstandingAmount;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Column(name = "card_status", nullable = false, length = 20)
    private String cardStatus;

    public CreditCardRecord() {
    }

    public CreditCardRecord(String cardNumber, int customerId, String cardType,
                            BigDecimal creditLimit, BigDecimal availableCredit,
                            BigDecimal outstandingAmount, LocalDate expiryDate,
                            String cardStatus) {
        this.cardNumber = cardNumber;
        this.customerId = customerId;
        this.cardType = cardType;
        this.creditLimit = creditLimit;
        this.availableCredit = availableCredit;
        this.outstandingAmount = outstandingAmount;
        this.expiryDate = expiryDate;
        this.cardStatus = cardStatus;
    }

    public String getCardNumber() {
        return cardNumber;
    }

    public void setCardNumber(String cardNumber) {
        this.cardNumber = cardNumber;
    }

    public int getCustomerId() {
        return customerId;
    }

    public void setCustomerId(int customerId) {
        this.customerId = customerId;
    }

    public String getCardType() {
        return cardType;
    }

    public void setCardType(String cardType) {
        this.cardType = cardType;
    }

    public BigDecimal getCreditLimit() {
        return creditLimit;
    }

    public void setCreditLimit(BigDecimal creditLimit) {
        this.creditLimit = creditLimit;
    }

    public BigDecimal getAvailableCredit() {
        return availableCredit;
    }

    public void setAvailableCredit(BigDecimal availableCredit) {
        this.availableCredit = availableCredit;
    }

    public BigDecimal getOutstandingAmount() {
        return outstandingAmount;
    }

    public void setOutstandingAmount(BigDecimal outstandingAmount) {
        this.outstandingAmount = outstandingAmount;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public String getCardStatus() {
        return cardStatus;
    }

    public void setCardStatus(String cardStatus) {
        this.cardStatus = cardStatus;
    }
}