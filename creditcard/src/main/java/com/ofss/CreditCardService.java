package com.ofss;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Map;
import java.util.Set;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CreditCardService {

    private static final Set<String> PATCHABLE_FIELDS = Set.of(
            "customerId",
            "cardType",
            "creditLimit",
            "availableCredit",
            "outstandingAmount",
            "expiryDate",
            "cardStatus"
    );

    private final CreditCardRepository creditCardRepository;

    public CreditCardService(CreditCardRepository creditCardRepository) {
        this.creditCardRepository = creditCardRepository;
    }

    @Transactional(readOnly = true)
    public ArrayList<CreditCard> fetchAllCreditCards() {
        return new ArrayList<>(creditCardRepository.findAll());
    }

    @Transactional(readOnly = true)
    public CreditCard fetchCreditCardByNumber(String cardNumber) {
        if (cardNumber == null || cardNumber.isBlank()) {
            return null;
        }

        return creditCardRepository.findById(cardNumber).orElse(null);
    }

    @Transactional
    public boolean addNewCreditCard(CreditCard newCreditCard) {
        if (newCreditCard == null
                || newCreditCard.getCardNumber() == null
                || newCreditCard.getCardNumber().isBlank()) {
            return false;
        }

        CreditCard cardToAdd = copyOf(newCreditCard);
        if (!isValidCreditCard(cardToAdd)
                || creditCardRepository.existsById(cardToAdd.getCardNumber())) {
            return false;
        }

        try {
            creditCardRepository.saveAndFlush(cardToAdd);
            return true;
        } catch (DataIntegrityViolationException exception) {
            return false;
        }
    }

    @Transactional
    public boolean deleteCreditCard(String cardNumber) {
        if (cardNumber == null || cardNumber.isBlank()) {
            return false;
        }

        CreditCard card = creditCardRepository
                .findByCardNumberForUpdate(cardNumber)
                .orElse(null);

        if (card == null) {
            return false;
        }

        try {
            creditCardRepository.delete(card);
            creditCardRepository.flush();
            return true;
        } catch (DataIntegrityViolationException exception) {
            throw new IllegalStateException(
                    "Credit card cannot be deleted because transaction history is linked to it",
                    exception);
        }
    }

    @Transactional
    public CreditCard replaceCreditCard(
            String cardNumber,
            CreditCard replacementCard) {

        if (cardNumber == null || cardNumber.isBlank() || replacementCard == null) {
            return null;
        }

        if (creditCardRepository.findByCardNumberForUpdate(cardNumber).isEmpty()) {
            return null;
        }

        CreditCard replacement = copyOf(replacementCard);
        replacement.setCardNumber(cardNumber);

        if (!isValidCreditCard(replacement)) {
            return null;
        }

        try {
            return creditCardRepository.saveAndFlush(replacement);
        } catch (DataIntegrityViolationException exception) {
            return null;
        }
    }

    @Transactional
    public CreditCard updateCreditCardPartially(
            String cardNumber,
            Map<String, Object> updates) {

        if (cardNumber == null
                || cardNumber.isBlank()
                || updates == null
                || updates.keySet().stream()
                        .anyMatch(field -> !PATCHABLE_FIELDS.contains(field))) {
            return null;
        }

        CreditCard existingCard = creditCardRepository
                .findByCardNumberForUpdate(cardNumber)
                .orElse(null);

        if (existingCard == null) {
            return null;
        }

        try {
            CreditCard updatedCard = copyOf(existingCard);

            if (updates.containsKey("customerId")) {
                updatedCard.setCustomerId(
                        Long.parseLong(updates.get("customerId").toString()));
            }

            if (updates.containsKey("cardType")) {
                updatedCard.setCardType(updates.get("cardType").toString());
            }

            if (updates.containsKey("creditLimit")) {
                updatedCard.setCreditLimit(
                        new BigDecimal(updates.get("creditLimit").toString()));
            }

            if (updates.containsKey("availableCredit")) {
                updatedCard.setAvailableCredit(
                        new BigDecimal(updates.get("availableCredit").toString()));
            }

            if (updates.containsKey("outstandingAmount")) {
                updatedCard.setOutstandingAmount(
                        new BigDecimal(updates.get("outstandingAmount").toString()));
            }

            if (updates.containsKey("expiryDate")) {
                updatedCard.setExpiryDate(
                        LocalDate.parse(updates.get("expiryDate").toString()));
            }

            if (updates.containsKey("cardStatus")) {
                updatedCard.setCardStatus(updates.get("cardStatus").toString());
            }

            if (!isValidCreditCard(updatedCard)) {
                return null;
            }

            return creditCardRepository.saveAndFlush(updatedCard);
        } catch (RuntimeException exception) {
            return null;
        }
    }

    @Transactional
    public CreditCard recordPurchase(String cardNumber, BigDecimal amount) {
        CreditCard card = creditCardRepository
                .findByCardNumberForUpdate(cardNumber)
                .orElse(null);

        if (card == null) {
            return null;
        }

        validateUsableCard(card);

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Purchase amount must be greater than zero");
        }

        if (card.getAvailableCredit().compareTo(amount) < 0) {
            throw new IllegalArgumentException("Insufficient available credit");
        }

        card.setAvailableCredit(card.getAvailableCredit().subtract(amount));
        card.setOutstandingAmount(card.getOutstandingAmount().add(amount));
        return creditCardRepository.saveAndFlush(card);
    }

    @Transactional
    public CreditCard recordPayment(String cardNumber, BigDecimal amount) {
        CreditCard card = creditCardRepository
                .findByCardNumberForUpdate(cardNumber)
                .orElse(null);

        if (card == null) {
            return null;
        }

        validateUsableCard(card);

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Payment amount must be greater than zero");
        }

        if (amount.compareTo(card.getOutstandingAmount()) > 0) {
            throw new IllegalArgumentException(
                    "Payment amount cannot exceed outstanding amount");
        }

        card.setOutstandingAmount(card.getOutstandingAmount().subtract(amount));
        card.setAvailableCredit(card.getAvailableCredit().add(amount));

        if (card.getAvailableCredit().compareTo(card.getCreditLimit()) > 0) {
            card.setAvailableCredit(card.getCreditLimit());
        }

        return creditCardRepository.saveAndFlush(card);
    }

    private void validateUsableCard(CreditCard card) {
        if (!"ACTIVE".equalsIgnoreCase(card.getCardStatus())) {
            throw new IllegalArgumentException("Credit card is not active");
        }

        if (card.getExpiryDate() == null
                || !card.getExpiryDate().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Credit card is expired");
        }
    }

    private boolean isValidCreditCard(CreditCard card) {
        if (card.getCardNumber() == null
                || !card.getCardNumber().matches("\\d{16}")) {
            return false;
        }

        if (card.getCustomerId() == null || card.getCustomerId() <= 0) {
            return false;
        }

        if (card.getCardType() == null
                || !(card.getCardType().equalsIgnoreCase("SILVER")
                || card.getCardType().equalsIgnoreCase("GOLD")
                || card.getCardType().equalsIgnoreCase("PLATINUM"))) {
            return false;
        }

        if (card.getCreditLimit() == null
                || card.getCreditLimit().compareTo(BigDecimal.ZERO) <= 0) {
            return false;
        }

        if (card.getAvailableCredit() == null
                || card.getAvailableCredit().compareTo(BigDecimal.ZERO) < 0) {
            return false;
        }

        if (card.getOutstandingAmount() == null
                || card.getOutstandingAmount().compareTo(BigDecimal.ZERO) < 0) {
            return false;
        }

        if (card.getAvailableCredit().compareTo(card.getCreditLimit()) > 0) {
            return false;
        }

        if (card.getAvailableCredit()
                .add(card.getOutstandingAmount())
                .compareTo(card.getCreditLimit()) != 0) {
            return false;
        }

        if (card.getExpiryDate() == null
                || !card.getExpiryDate().isAfter(LocalDate.now())) {
            return false;
        }

        if (card.getCardStatus() == null
                || !(card.getCardStatus().equalsIgnoreCase("ACTIVE")
                || card.getCardStatus().equalsIgnoreCase("BLOCKED"))) {
            return false;
        }

        card.setCardType(card.getCardType().toUpperCase());
        card.setCardStatus(card.getCardStatus().toUpperCase());
        return true;
    }

    private CreditCard copyOf(CreditCard card) {
        return new CreditCard(
                card.getCardNumber(),
                card.getCustomerId(),
                card.getCardType(),
                card.getCreditLimit(),
                card.getAvailableCredit(),
                card.getOutstandingAmount(),
                card.getExpiryDate(),
                card.getCardStatus()
        );
    }
}
