package main.admin;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ofss.CreditCard;
import com.ofss.CreditCardRepository;

import customer.CustomerNotFoundException;
import customer.CustomerRepository;
import merchant.MerchantNotFoundException;
import merchant.MerchantRepository;
import transactions.exception.TransactionNotFoundException;
import transactions.repository.TransactionRepository;

@Service
public class AdminDeleteService {

    private final CustomerRepository customerRepository;
    private final CreditCardRepository creditCardRepository;
    private final MerchantRepository merchantRepository;
    private final TransactionRepository transactionRepository;

    public AdminDeleteService(CustomerRepository customerRepository,
                              CreditCardRepository creditCardRepository,
                              MerchantRepository merchantRepository,
                              TransactionRepository transactionRepository) {
        this.customerRepository = customerRepository;
        this.creditCardRepository = creditCardRepository;
        this.merchantRepository = merchantRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional
    public void deleteCustomerCascade(Long customerId) {
        if (!customerRepository.existsById(customerId)) {
            throw new CustomerNotFoundException(customerId);
        }
        List<CreditCard> cards = creditCardRepository.findByCustomerId(customerId);
        cards.forEach(card -> transactionRepository.deleteByCardNumber(card.getCardNumber()));
        creditCardRepository.deleteByCustomerId(customerId);
        customerRepository.deleteById(customerId);
    }

    @Transactional
    public void deleteCardCascade(String cardNumber) {
        if (!creditCardRepository.existsById(cardNumber)) {
            throw new IllegalArgumentException("Credit card not found");
        }
        transactionRepository.deleteByCardNumber(cardNumber);
        creditCardRepository.deleteById(cardNumber);
    }

    @Transactional
    public void deleteMerchantCascade(Long merchantId) {
        if (!merchantRepository.existsById(merchantId)) {
            throw new MerchantNotFoundException("Merchant not found with id: " + merchantId);
        }
        transactionRepository.deleteByMerchantId(merchantId);
        merchantRepository.deleteById(merchantId);
    }

    @Transactional
    public void deleteTransaction(Long transactionId) {
        if (!transactionRepository.existsById(transactionId)) {
            throw new TransactionNotFoundException("Transaction not found with id: " + transactionId);
        }
        transactionRepository.deleteById(transactionId);
    }
}
