package com.ofss;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Map;

import org.springframework.stereotype.Service;

@Service
public class CreditCardService {

    private final ArrayList<CreditCard> allCreditCards;

    public CreditCardService() {

        allCreditCards = new ArrayList<>();

        CreditCard card1 = new CreditCard(
                "1111222233334444",
                1,
                "GOLD",
                new BigDecimal("100000.00"),
                new BigDecimal("85000.00"),
                new BigDecimal("15000.00"),
                LocalDate.of(2029, 12, 31),
                "ACTIVE"
        );

        CreditCard card2 = new CreditCard(
                "5555666677778888",
                2,
                "PLATINUM",
                new BigDecimal("200000.00"),
                new BigDecimal("180000.00"),
                new BigDecimal("20000.00"),
                LocalDate.of(2030, 6, 30),
                "ACTIVE"
        );

        CreditCard card3 = new CreditCard(
                "9999000011112222",
                3,
                "SILVER",
                new BigDecimal("50000.00"),
                new BigDecimal("50000.00"),
                BigDecimal.ZERO,
                LocalDate.of(2028, 10, 31),
                "BLOCKED"
        );

        allCreditCards.add(card1);
        allCreditCards.add(card2);
        allCreditCards.add(card3);

        System.out.println(
                "CreditCardService initialized with "
                        + allCreditCards.size()
                        + " cards."
        );
    }

    // GET all cards
    public ArrayList<CreditCard> fetchAllCreditCards() {
        return allCreditCards;
    }

    // GET card by card number
    public CreditCard fetchCreditCardByNumber(String cardNumber) {

        return allCreditCards
                .stream()
                .filter(card -> card.getCardNumber().equals(cardNumber))
                .findFirst()
                .orElse(null);
    }

    // POST
    public boolean addNewCreditCard(CreditCard newCreditCard) {

        if (newCreditCard == null ||
                newCreditCard.getCardNumber() == null ||
                newCreditCard.getCardNumber().isBlank()) {
            return false;
        }

        CreditCard existingCard =
                fetchCreditCardByNumber(newCreditCard.getCardNumber());

        if (existingCard != null) {
            return false;
        }

        if (!isValidCreditCard(newCreditCard)) {
            return false;
        }

        allCreditCards.add(newCreditCard);
        return true;
    }

    // DELETE
    public boolean deleteCreditCard(String cardNumber) {

        return allCreditCards.removeIf(
                card -> card.getCardNumber().equals(cardNumber)
        );
    }

    // PUT: replace complete card information
    public CreditCard replaceCreditCard(
            String cardNumber,
            CreditCard replacementCard) {

        CreditCard existingCard =
                fetchCreditCardByNumber(cardNumber);

        if (existingCard == null || replacementCard == null) {
            return null;
        }

        replacementCard.setCardNumber(cardNumber);

        if (!isValidCreditCard(replacementCard)) {
            return null;
        }

        int index = allCreditCards.indexOf(existingCard);
        allCreditCards.set(index, replacementCard);

        return replacementCard;
    }

    // PATCH: update selected fields
    public CreditCard updateCreditCardPartially(
            String cardNumber,
            Map<String, Object> updates) {

        CreditCard existingCard =
                fetchCreditCardByNumber(cardNumber);

        if (existingCard == null || updates == null) {
            return null;
        }

        try {
            if (updates.containsKey("customerId")) {
                existingCard.setCustomerId(
                        Integer.parseInt(
                                updates.get("customerId").toString()
                        )
                );
            }

            if (updates.containsKey("cardType")) {
                existingCard.setCardType(
                        updates.get("cardType").toString().toUpperCase()
                );
            }

            if (updates.containsKey("creditLimit")) {
                existingCard.setCreditLimit(
                        new BigDecimal(
                                updates.get("creditLimit").toString()
                        )
                );
            }

            if (updates.containsKey("availableCredit")) {
                existingCard.setAvailableCredit(
                        new BigDecimal(
                                updates.get("availableCredit").toString()
                        )
                );
            }

            if (updates.containsKey("outstandingAmount")) {
                existingCard.setOutstandingAmount(
                        new BigDecimal(
                                updates.get("outstandingAmount").toString()
                        )
                );
            }

            if (updates.containsKey("expiryDate")) {
                existingCard.setExpiryDate(
                        LocalDate.parse(
                                updates.get("expiryDate").toString()
                        )
                );
            }

            if (updates.containsKey("cardStatus")) {
                existingCard.setCardStatus(
                        updates.get("cardStatus").toString().toUpperCase()
                );
            }

            if (!isValidCreditCard(existingCard)) {
                return null;
            }

            return existingCard;

        } catch (Exception exception) {
            return null;
        }
    }

    private boolean isValidCreditCard(CreditCard card) {

        if (card.getCardNumber() == null ||
                card.getCardNumber().length() != 16) {
            return false;
        }

        if (!card.getCardNumber().matches("\\d{16}")) {
            return false;
        }

        if (card.getCustomerId() <= 0) {
            return false;
        }

        if (card.getCardType() == null ||
                !(card.getCardType().equalsIgnoreCase("SILVER") ||
                  card.getCardType().equalsIgnoreCase("GOLD") ||
                  card.getCardType().equalsIgnoreCase("PLATINUM"))) {
            return false;
        }

        if (card.getCreditLimit() == null ||
                card.getCreditLimit().compareTo(BigDecimal.ZERO) <= 0) {
            return false;
        }

        if (card.getAvailableCredit() == null ||
                card.getAvailableCredit().compareTo(BigDecimal.ZERO) < 0) {
            return false;
        }

        if (card.getOutstandingAmount() == null ||
                card.getOutstandingAmount().compareTo(BigDecimal.ZERO) < 0) {
            return false;
        }

        if (card.getAvailableCredit()
                .compareTo(card.getCreditLimit()) > 0) {
            return false;
        }

        if (card.getExpiryDate() == null) {
            return false;
        }

        if (card.getCardStatus() == null ||
                !(card.getCardStatus().equalsIgnoreCase("ACTIVE") ||
                  card.getCardStatus().equalsIgnoreCase("BLOCKED"))) {
            return false;
        }

        card.setCardType(card.getCardType().toUpperCase());
        card.setCardStatus(card.getCardStatus().toUpperCase());

        return true;
    }
}