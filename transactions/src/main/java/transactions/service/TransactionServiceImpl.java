package transactions.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;


import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import transactions.dto.PaymentRequest;
import transactions.dto.PurchaseRequest;
import transactions.dto.TransactionResponse;
import transactions.dto.ReportResponse;
import transactions.entity.Transaction;
import transactions.enums.TransactionStatus;
import transactions.enums.TransactionType;
import transactions.exception.CardNotFoundException;
import transactions.exception.InvalidPaymentException;
import transactions.exception.MerchantNotFoundException;
import transactions.exception.TransactionNotFoundException;
import transactions.integration.CreditCardRecord;
import transactions.integration.CreditCardRepository;
import transactions.integration.MerchantRecord;
import transactions.integration.MerchantRepository;
import transactions.repository.TransactionRepository;
import transactions.response.ApiResponse;
import transactions.constants.TransactionConstants;
import transactions.util.TransactionMapper;
import transactions.validation.PaymentValidator;
import transactions.validation.PurchaseValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class TransactionServiceImpl implements TransactionService {
	private static final Logger logger =
	        LoggerFactory.getLogger(TransactionServiceImpl.class);

    private final TransactionRepository transactionRepository;
    private final CreditCardRepository creditCardRepository;
    private final MerchantRepository merchantRepository;

    public TransactionServiceImpl(TransactionRepository transactionRepository,
                                  CreditCardRepository creditCardRepository,
                                  MerchantRepository merchantRepository) {
        this.transactionRepository = transactionRepository;
        this.creditCardRepository = creditCardRepository;
        this.merchantRepository = merchantRepository;
    }

    
    @Override
    @Transactional
    public TransactionResponse purchase(PurchaseRequest request) {
        logger.info("Purchase request received for card {}", request.getCardNumber());

        PurchaseValidator.validateRequest(request);

        CreditCardRecord card = creditCardRepository.findById(request.getCardNumber())
                .orElse(null);

        String cardValidationError = PurchaseValidator.validateCard(card);
        if (cardValidationError != null) {
            return saveTransaction(
                    request.getCardNumber(),
                    TransactionType.PURCHASE,
                    request.getAmount(),
                    request.getMerchantId(),
                    TransactionStatus.FAILED,
                    cardValidationError
            );
        }

        MerchantRecord merchant = merchantRepository.findById(request.getMerchantId())
                .orElse(null);

        String merchantValidationError = PurchaseValidator.validateMerchant(merchant);
        if (merchantValidationError != null) {
            return saveTransaction(
                    request.getCardNumber(),
                    TransactionType.PURCHASE,
                    request.getAmount(),
                    request.getMerchantId(),
                    TransactionStatus.FAILED,
                    merchantValidationError
            );
        }

        BigDecimal availableCredit = safe(card.getAvailableCredit());
        BigDecimal amount = request.getAmount();

        if (availableCredit.compareTo(amount) < 0) {
            return saveTransaction(
                    card.getCardNumber(),
                    TransactionType.PURCHASE,
                    amount,
                    merchant.getMerchantId(),
                    TransactionStatus.FAILED,
                    TransactionConstants.INSUFFICIENT_CREDIT
            );
        }

        card.setAvailableCredit(availableCredit.subtract(amount));
        card.setOutstandingAmount(safe(card.getOutstandingAmount()).add(amount));
        creditCardRepository.save(card);

        logger.info("Purchase completed successfully for card {}", card.getCardNumber());

        return saveTransaction(
                card.getCardNumber(),
                TransactionType.PURCHASE,
                amount,
                merchant.getMerchantId(),
                TransactionStatus.SUCCESS,
                null
        );
    }

    @Override
    @Transactional
    public TransactionResponse payment(PaymentRequest request) {

        PaymentValidator.validateRequest(request);

        CreditCardRecord card = creditCardRepository.findById(request.getCardNumber())
                .orElse(null);

        String cardValidationError = PaymentValidator.validateCard(card);
        if (cardValidationError != null) {
            return saveTransaction(
                    request.getCardNumber(),
                    TransactionType.PAYMENT,
                    request.getAmount(),
                    null,
                    TransactionStatus.FAILED,
                    cardValidationError
            );
        }

        String amountValidationError = PaymentValidator.validatePaymentAmount(card, request.getAmount());
        if (amountValidationError != null) {
            return saveTransaction(
                    request.getCardNumber(),
                    TransactionType.PAYMENT,
                    request.getAmount(),
                    null,
                    TransactionStatus.FAILED,
                    amountValidationError
            );
        }

        BigDecimal outstanding = safe(card.getOutstandingAmount());
        BigDecimal amount = request.getAmount();

        card.setOutstandingAmount(outstanding.subtract(amount));
        card.setAvailableCredit(safe(card.getAvailableCredit()).add(amount));
        creditCardRepository.save(card);

        logger.info("Payment completed successfully for card {}", card.getCardNumber());

        return saveTransaction(
                card.getCardNumber(),
                TransactionType.PAYMENT,
                amount,
                null,
                TransactionStatus.SUCCESS,
                null
        );
    }
    
    @Override
    public TransactionResponse getTransactionById(Long transactionId) {
        Transaction transaction = transactionRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new TransactionNotFoundException(
                        "Transaction not found with id: " + transactionId));
        return TransactionMapper.toResponse(transaction);
    }

    @Override
    public List<TransactionResponse> getAllTransactions() {
        return transactionRepository.findAll()
                .stream()
                .map(TransactionMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TransactionResponse> getTransactionsByCardNumber(String cardNumber) {
        return transactionRepository.findByCardNumberOrderByTransactionDateTimeDesc(cardNumber)
                .stream()
                .map(TransactionMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TransactionResponse> getTransactionsByMerchant(Long merchantId) {
        return transactionRepository.findByMerchantIdOrderByTransactionDateTimeDesc(merchantId)
                .stream()
                .map(TransactionMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TransactionResponse> getTransactionsByDateRange(LocalDateTime from, LocalDateTime to) {
        return transactionRepository.findByTransactionDateTimeBetweenOrderByTransactionDateTimeDesc(from, to)
                .stream()
                .map(TransactionMapper::toResponse)
                .collect(Collectors.toList());
    }

    

   

    private BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private TransactionResponse saveTransaction(String cardNumber,
                                                TransactionType type,
                                                BigDecimal amount,
                                                Long merchantId,
                                                TransactionStatus status,
                                                String failureReason) {

        Transaction transaction = new Transaction();
        transaction.setCardNumber(cardNumber);
        transaction.setTransactionType(type);
        transaction.setAmount(amount);
        transaction.setMerchantId(merchantId);
        transaction.setTransactionDateTime(LocalDateTime.now());
        transaction.setStatus(status);
        transaction.setFailureReason(failureReason);

        Transaction saved = transactionRepository.save(transaction);
        return TransactionMapper.toResponse(saved);
    }

    

    @Override
    public ReportResponse getTodayPurchaseTotal() {
        return getTodayTotal(
                TransactionType.PURCHASE,
                "Today's Purchase Total"
        );
    }

    @Override
    public ReportResponse getTodayPaymentTotal() {
        return getTodayTotal(
                TransactionType.PAYMENT,
                "Today's Payment Total"
        );
    }

    private ReportResponse getTodayTotal(TransactionType type, String reportName) {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime startOfNextDay = today.plusDays(1).atStartOfDay();

        BigDecimal total = transactionRepository.sumAmountByTypeAndStatusBetween(
                type,
                TransactionStatus.SUCCESS,
                startOfDay,
                startOfNextDay
        );

        return new ReportResponse(reportName, total, reportName);
    }
    @Override
    public ReportResponse getMerchantWithHighestSales() {
        List<TransactionResponse> all = getAllTransactions();

        Long topMerchantId = all.stream()
                .filter(t -> t.getTransactionType() == TransactionType.PURCHASE)
                .filter(t -> t.getStatus() == TransactionStatus.SUCCESS)
                .filter(t -> t.getMerchantId() != null)
                .collect(Collectors.groupingBy(TransactionResponse::getMerchantId, Collectors.mapping(TransactionResponse::getAmount, Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))))
                .entrySet()
                .stream()
                .max(java.util.Map.Entry.comparingByValue())
                .map(java.util.Map.Entry::getKey)
                .orElse(null);

        BigDecimal amount = BigDecimal.ZERO;
        if (topMerchantId != null) {
            amount = all.stream()
                    .filter(t -> t.getTransactionType() == TransactionType.PURCHASE)
                    .filter(t -> t.getStatus() == TransactionStatus.SUCCESS)
                    .filter(t -> topMerchantId.equals(t.getMerchantId()))
                    .map(TransactionResponse::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        return new ReportResponse("Merchant With Highest Sales", amount, topMerchantId == null ? null : String.valueOf(topMerchantId));
    }

    @Override
    public ReportResponse getMostUsedCard() {
        String cardNumber = transactionRepository.findAll()
                .stream()
                .filter(t -> t.getStatus() == TransactionStatus.SUCCESS)
                .collect(Collectors.groupingBy(Transaction::getCardNumber, Collectors.counting()))
                .entrySet()
                .stream()
                .max(java.util.Map.Entry.comparingByValue())
                .map(java.util.Map.Entry::getKey)
                .orElse(null);

        return new ReportResponse("Most Used Card", BigDecimal.ZERO, cardNumber);
    }

    @Override
    public ReportResponse getTotalOutstandingAcrossAllCustomers() {
        BigDecimal totalOutstanding = transactionRepository.findAll()
                .stream()
                .filter(t -> t.getStatus() == TransactionStatus.SUCCESS)
                .filter(t -> t.getTransactionType() == TransactionType.PURCHASE)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new ReportResponse("Total Outstanding Across All Customers", totalOutstanding, null);
    }

    @Override
    public ReportResponse getLargestPurchaseTransaction() {
        Transaction largest = transactionRepository.findAll()
                .stream()
                .filter(t -> t.getStatus() == TransactionStatus.SUCCESS)
                .filter(t -> t.getTransactionType() == TransactionType.PURCHASE)
                .max(java.util.Comparator.comparing(Transaction::getAmount))
                .orElse(null);

        if (largest == null) {
            return new ReportResponse("Largest Purchase Transaction", BigDecimal.ZERO, null);
        }

        return new ReportResponse(
                "Largest Purchase Transaction",
                largest.getAmount(),
                largest.getCardNumber()
        );
    }
    
}