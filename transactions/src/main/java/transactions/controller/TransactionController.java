package transactions.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import transactions.dto.PaymentRequest;
import transactions.dto.PurchaseRequest;
import transactions.dto.TransactionResponse;
import transactions.service.TransactionService;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping("/purchase")
    public TransactionResponse purchase(
            @Valid @RequestBody PurchaseRequest request) {

        return transactionService.purchase(request);
    }

    @PostMapping("/payment")
    public TransactionResponse payment(
            @Valid @RequestBody PaymentRequest request) {

        return transactionService.payment(request);
    }

    @GetMapping("/{id}")
    public TransactionResponse getTransactionById(
            @PathVariable Long id) {

        return transactionService.getTransactionById(id);
    }

    @GetMapping
    public List<TransactionResponse> getAllTransactions() {

        return transactionService.getAllTransactions();
    }

    @GetMapping("/card/{cardNumber}")
    public List<TransactionResponse> getTransactionsByCard(
            @PathVariable String cardNumber) {

        return transactionService.getTransactionsByCardNumber(cardNumber);
    }

    @GetMapping("/merchant/{merchantId}")
    public List<TransactionResponse> getTransactionsByMerchant(
            @PathVariable Long merchantId) {

        return transactionService.getTransactionsByMerchant(merchantId);
    }

    @GetMapping("/date-range")
    public List<TransactionResponse> getTransactionsByDateRange(

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime from,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime to) {

        return transactionService.getTransactionsByDateRange(from, to);
    }
}