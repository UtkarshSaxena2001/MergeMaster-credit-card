package transactions.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ofss.CreditCardService;

import merchant.MerchantService;
import transactions.dto.PaymentRequest;
import transactions.dto.PurchaseRequest;
import transactions.dto.TransactionResponse;
import transactions.entity.Transaction;
import transactions.enums.TransactionStatus;
import transactions.enums.TransactionType;
import transactions.exception.CardNotFoundException;
import transactions.exception.InsufficientCreditException;
import transactions.exception.InvalidPaymentException;
import transactions.exception.MerchantNotFoundException;
import transactions.exception.TransactionNotFoundException;
import transactions.repository.TransactionRepository;

@Service
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;
    private final CreditCardService creditCardService;
    private final MerchantService merchantService;

    public TransactionServiceImpl(TransactionRepository transactionRepository,
                                  CreditCardService creditCardService,
                                  MerchantService merchantService) {
        this.transactionRepository = transactionRepository;
        this.creditCardService = creditCardService;
        this.merchantService = merchantService;
    }

    @Override
    @Transactional
    public TransactionResponse purchase(PurchaseRequest request) {
        validatePurchaseRequest(request);
        validateMerchantExists(request.getMerchantId());
        recordCardPurchase(request);

        Transaction transaction = new Transaction();
        transaction.setCardNumber(request.getCardNumber());
        transaction.setTransactionType(TransactionType.PURCHASE);
        transaction.setAmount(request.getAmount());
        transaction.setMerchantId(request.getMerchantId());
        transaction.setTransactionDateTime(LocalDateTime.now());
        transaction.setStatus(TransactionStatus.SUCCESS);
        transaction.setFailureReason(null);

        Transaction saved = transactionRepository.save(transaction);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public TransactionResponse payment(PaymentRequest request) {
        validatePaymentRequest(request);
        recordCardPayment(request);

        Transaction transaction = new Transaction();
        transaction.setCardNumber(request.getCardNumber());
        transaction.setTransactionType(TransactionType.PAYMENT);
        transaction.setAmount(request.getAmount());
        transaction.setMerchantId(null);
        transaction.setTransactionDateTime(LocalDateTime.now());
        transaction.setStatus(TransactionStatus.SUCCESS);
        transaction.setFailureReason(null);

        Transaction saved = transactionRepository.save(transaction);
        return toResponse(saved);
    }

    @Override
    public TransactionResponse getTransactionById(Long transactionId) {
        Transaction transaction = transactionRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new TransactionNotFoundException(
                        "Transaction not found with id: " + transactionId));
        return toResponse(transaction);
    }

    @Override
    public List<TransactionResponse> getAllTransactions() {
        return transactionRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TransactionResponse> getTransactionsByCardNumber(String cardNumber) {
        return transactionRepository.findByCardNumberOrderByTransactionDateTimeDesc(cardNumber)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TransactionResponse> getTransactionsByMerchant(Long merchantId) {
        return transactionRepository.findByMerchantIdOrderByTransactionDateTimeDesc(merchantId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TransactionResponse> getTransactionsByDateRange(LocalDateTime from, LocalDateTime to) {
        return transactionRepository.findByTransactionDateTimeBetweenOrderByTransactionDateTimeDesc(from, to)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private void validatePurchaseRequest(PurchaseRequest request) {
        if (request == null) {
            throw new InvalidPaymentException("Purchase request cannot be null");
        }
        if (request.getCardNumber() == null || request.getCardNumber().trim().isEmpty()) {
            throw new CardNotFoundException("Card number is required");
        }
        if (request.getMerchantId() == null) {
            throw new MerchantNotFoundException("Merchant ID is required for purchase");
        }
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new InsufficientCreditException("Purchase amount must be greater than zero");
        }
    }

    private void validatePaymentRequest(PaymentRequest request) {
        if (request == null) {
            throw new InvalidPaymentException("Payment request cannot be null");
        }
        if (request.getCardNumber() == null || request.getCardNumber().trim().isEmpty()) {
            throw new CardNotFoundException("Card number is required");
        }
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidPaymentException("Payment amount must be greater than zero");
        }
    }

    private void recordCardPurchase(PurchaseRequest request) {
        try {
            Object card = creditCardService.recordPurchase(
                    request.getCardNumber(),
                    request.getAmount());

            if (card == null) {
                throw new CardNotFoundException(
                        "Card not found with number: " + request.getCardNumber());
            }
        } catch (IllegalArgumentException | IllegalStateException exception) {
            throw new InsufficientCreditException(exception.getMessage());
        }
    }

    private void recordCardPayment(PaymentRequest request) {
        try {
            Object card = creditCardService.recordPayment(
                    request.getCardNumber(),
                    request.getAmount());

            if (card == null) {
                throw new CardNotFoundException(
                        "Card not found with number: " + request.getCardNumber());
            }
        } catch (IllegalArgumentException | IllegalStateException exception) {
            throw new InvalidPaymentException(exception.getMessage());
        }
    }

    private void validateMerchantExists(Long merchantId) {
        try {
            merchantService.getMerchantById(merchantId);
        } catch (merchant.MerchantNotFoundException exception) {
            throw new MerchantNotFoundException(exception.getMessage());
        }
    }

    private TransactionResponse toResponse(Transaction transaction) {
        return new TransactionResponse(
                transaction.getTransactionId(),
                transaction.getCardNumber(),
                transaction.getTransactionType(),
                transaction.getAmount(),
                transaction.getMerchantId(),
                transaction.getTransactionDateTime(),
                transaction.getStatus(),
                transaction.getFailureReason()
        );
    }
}
