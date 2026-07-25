package transactions.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import transactions.enums.TransactionStatus;
import transactions.enums.TransactionType;

public class TransactionResponse {

    private Long transactionId;
    private String cardNumber;
    private TransactionType transactionType;
    private BigDecimal amount;
    private Long merchantId;
    private LocalDateTime transactionDateTime;
    private TransactionStatus status;
    private String failureReason;

    public TransactionResponse() {
    }

    public TransactionResponse(Long transactionId, String cardNumber, TransactionType transactionType,
                               BigDecimal amount, Long merchantId, LocalDateTime transactionDateTime,
                               TransactionStatus status, String failureReason) {
        this.transactionId = transactionId;
        this.cardNumber = cardNumber;
        this.transactionType = transactionType;
        this.amount = amount;
        this.merchantId = merchantId;
        this.transactionDateTime = transactionDateTime;
        this.status = status;
        this.failureReason = failureReason;
    }

    public Long getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(Long transactionId) {
        this.transactionId = transactionId;
    }

    public String getCardNumber() {
        return cardNumber;
    }

    public void setCardNumber(String cardNumber) {
        this.cardNumber = cardNumber;
    }

    public TransactionType getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(TransactionType transactionType) {
        this.transactionType = transactionType;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public Long getMerchantId() {
        return merchantId;
    }

    public void setMerchantId(Long merchantId) {
        this.merchantId = merchantId;
    }

    public LocalDateTime getTransactionDateTime() {
        return transactionDateTime;
    }

    public void setTransactionDateTime(LocalDateTime transactionDateTime) {
        this.transactionDateTime = transactionDateTime;
    }

    public TransactionStatus getStatus() {
        return status;
    }

    public void setStatus(TransactionStatus status) {
        this.status = status;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(String failureReason) {
        this.failureReason = failureReason;
    }
}