package com.ofss;

import java.util.ArrayList;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/creditcards")
public class CreditCardController {

    private final CreditCardService creditCardService;

    // Constructor dependency injection
    public CreditCardController(CreditCardService creditCardService) {
        this.creditCardService = creditCardService;
    }

    // API 1: Get all credit cards
    @GetMapping
    public ResponseEntity<ArrayList<CreditCard>> getAllCreditCards() {

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(creditCardService.fetchAllCreditCards());
    }

    // API 2: Get one credit card
    @GetMapping("/{cardNumber}")
    public ResponseEntity<Object> getCreditCardByNumber(
            @PathVariable String cardNumber) {

        CreditCard creditCard =
                creditCardService.fetchCreditCardByNumber(cardNumber);

        if (creditCard != null) {
            return ResponseEntity
                    .status(HttpStatus.OK)
                    .body(creditCard);
        }

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body("Credit card not found");
    }

    // API 3: Create a new credit card
    @PostMapping
    public ResponseEntity<String> addCreditCard(
            @RequestBody CreditCard newCreditCard) {

        boolean created =
                creditCardService.addNewCreditCard(newCreditCard);

        if (created) {
            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body("Credit card created successfully");
        }

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body("Credit card could not be created. "
                        + "Check the data or card number.");
    }

    // API 4: Delete a credit card
    @DeleteMapping("/{cardNumber}")
    public ResponseEntity<String> deleteCreditCard(
            @PathVariable String cardNumber) {

        final boolean deleted;
        try {
            deleted = creditCardService.deleteCreditCard(cardNumber);
        } catch (IllegalStateException exception) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(exception.getMessage());
        }

        if (deleted) {
            return ResponseEntity
                    .status(HttpStatus.OK)
                    .body("Credit card deleted successfully");
        }

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body("Credit card not found");
    }

    // API 5: Completely replace a credit card
    @PutMapping("/{cardNumber}")
    public ResponseEntity<Object> replaceCreditCard(
            @PathVariable String cardNumber,
            @RequestBody CreditCard replacementCard) {

        CreditCard updatedCard =
                creditCardService.replaceCreditCard(
                        cardNumber,
                        replacementCard
                );

        if (updatedCard != null) {
            return ResponseEntity
                    .status(HttpStatus.OK)
                    .body(updatedCard);
        }

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body("Credit card could not be replaced");
    }

    // API 6: Partially update a credit card
    @PatchMapping("/{cardNumber}")
    public ResponseEntity<Object> patchCreditCard(
            @PathVariable String cardNumber,
            @RequestBody Map<String, Object> updates) {

        CreditCard updatedCard =
                creditCardService.updateCreditCardPartially(
                        cardNumber,
                        updates
                );

        if (updatedCard != null) {
            return ResponseEntity
                    .status(HttpStatus.OK)
                    .body(updatedCard);
        }

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body("Credit card could not be updated");
    }
}
