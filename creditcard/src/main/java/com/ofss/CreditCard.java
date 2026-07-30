package com.ofss;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "CREDIT_CARD")
public class CreditCard {

    @Id
    @Column(name = "CARD_NUMBER", nullable = false, length = 16)
    private String cardNumber;

    @Column(name = "CUSTOMER_ID", nullable = false, precision = 7)
    private Long customerId;

    @Column(name = "CARD_TYPE", nullable = false, length = 20)
    private String cardType;

    @Column(name = "CREDIT_LIMIT", nullable = false, precision = 12, scale = 2)
    private BigDecimal creditLimit;

    @Column(name = "AVAILABLE_CREDIT", nullable = false, precision = 12, scale = 2)
    private BigDecimal availableCredit;

    @Column(name = "OUTSTANDING_AMOUNT", nullable = false, precision = 12, scale = 2)
    private BigDecimal outstandingAmount;

    @Column(name = "EXPIRY_DATE", nullable = false)
    private LocalDate expiryDate;

    @Column(name = "CARD_STATUS", nullable = false, length = 20)
    private String cardStatus;

    public CreditCard() {
    }

    public CreditCard(
            String cardNumber,
            Long customerId,
            String cardType,
            BigDecimal creditLimit,
            BigDecimal availableCredit,
            BigDecimal outstandingAmount,
            LocalDate expiryDate,
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

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
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

    @Override
    public String toString() {
        return "CreditCard{" +
                "cardNumber='" + cardNumber + '\'' +
                ", customerId=" + customerId +
                ", cardType='" + cardType + '\'' +
                ", creditLimit=" + creditLimit +
                ", availableCredit=" + availableCredit +
                ", outstandingAmount=" + outstandingAmount +
                ", expiryDate=" + expiryDate +
                ", cardStatus='" + cardStatus + '\'' +
                '}';
    }
}
