package transactions.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import transactions.dto.PaymentRequest;
import transactions.dto.PurchaseRequest;
import transactions.dto.ReportResponse;
import transactions.dto.TransactionResponse;
import transactions.response.ApiResponse;
import transactions.service.TransactionService;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping("/purchase")
    public ApiResponse<TransactionResponse> purchase(@Valid @RequestBody PurchaseRequest request) {
        TransactionResponse response = transactionService.purchase(request);
        return new ApiResponse<>(true, "Purchase completed successfully", response);
    }

    @PostMapping("/payment")
    public ApiResponse<TransactionResponse> payment(@Valid @RequestBody PaymentRequest request) {
        TransactionResponse response = transactionService.payment(request);
        return new ApiResponse<>(true, "Payment completed successfully", response);
    }

    @GetMapping("/{id}")
    public ApiResponse<TransactionResponse> getTransactionById(@PathVariable Long id) {
        TransactionResponse response = transactionService.getTransactionById(id);
        return new ApiResponse<>(true, "Transaction fetched successfully", response);
    }

    @GetMapping
    public ApiResponse<List<TransactionResponse>> getAllTransactions() {
        List<TransactionResponse> response = transactionService.getAllTransactions();
        return new ApiResponse<>(true, "Transactions fetched successfully", response);
    }

    @GetMapping("/card/{cardNumber}")
    public ApiResponse<List<TransactionResponse>> getTransactionsByCard(@PathVariable String cardNumber) {
        List<TransactionResponse> response = transactionService.getTransactionsByCardNumber(cardNumber);
        return new ApiResponse<>(true, "Transactions fetched successfully for card", response);
    }

    @GetMapping("/merchant/{merchantId}")
    public ApiResponse<List<TransactionResponse>> getTransactionsByMerchant(@PathVariable Long merchantId) {
        List<TransactionResponse> response = transactionService.getTransactionsByMerchant(merchantId);
        return new ApiResponse<>(true, "Transactions fetched successfully for merchant", response);
    }

    @GetMapping("/date-range")
    public ApiResponse<List<TransactionResponse>> getTransactionsByDateRange(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime from,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime to) {

        List<TransactionResponse> response = transactionService.getTransactionsByDateRange(from, to);
        return new ApiResponse<>(true, "Transactions fetched successfully for date range", response);
    }

    @GetMapping("/reports/today-purchase-total")
    public ApiResponse<ReportResponse> getTodayPurchaseTotal() {
        ReportResponse response = transactionService.getTodayPurchaseTotal();
        return new ApiResponse<>(true, "Today's purchase total fetched successfully", response);
    }

    @GetMapping("/reports/today-payment-total")
    public ApiResponse<ReportResponse> getTodayPaymentTotal() {
        ReportResponse response = transactionService.getTodayPaymentTotal();
        return new ApiResponse<>(true, "Today's payment total fetched successfully", response);
    }

    @GetMapping("/reports/merchant-highest-sales")
    public ApiResponse<ReportResponse> getMerchantWithHighestSales() {
        ReportResponse response = transactionService.getMerchantWithHighestSales();
        return new ApiResponse<>(true, "Merchant with highest sales fetched successfully", response);
    }

    @GetMapping("/reports/most-used-card")
    public ApiResponse<ReportResponse> getMostUsedCard() {
        ReportResponse response = transactionService.getMostUsedCard();
        return new ApiResponse<>(true, "Most used card fetched successfully", response);
    }

    @GetMapping("/reports/total-outstanding")
    public ApiResponse<ReportResponse> getTotalOutstandingAcrossAllCustomers() {
        ReportResponse response = transactionService.getTotalOutstandingAcrossAllCustomers();
        return new ApiResponse<>(true, "Total outstanding fetched successfully", response);
    }

    @GetMapping("/reports/largest-purchase")
    public ApiResponse<ReportResponse> getLargestPurchaseTransaction() {
        ReportResponse response = transactionService.getLargestPurchaseTransaction();
        return new ApiResponse<>(true, "Largest purchase fetched successfully", response);
    }
}