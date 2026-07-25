package com.ofss;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CreditCard {

    private String cardNumber;
    private int customerId;
    private String cardType;
    private BigDecimal creditLimit;
    private BigDecimal availableCredit;
    private BigDecimal outstandingAmount;
    private LocalDate expiryDate;
    private String cardStatus;

    public CreditCard() {
    }

    public CreditCard(
            String cardNumber,
            int customerId,
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