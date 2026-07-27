package transactions.repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import transactions.entity.Transaction;
import transactions.enums.TransactionStatus;
import transactions.enums.TransactionType;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByTransactionId(Long transactionId);

    List<Transaction> findByCardNumberOrderByTransactionDateTimeDesc(String cardNumber);

    List<Transaction> findByMerchantIdOrderByTransactionDateTimeDesc(Long merchantId);

    List<Transaction> findByTransactionTypeOrderByTransactionDateTimeDesc(TransactionType transactionType);

    List<Transaction> findByStatusOrderByTransactionDateTimeDesc(TransactionStatus status);

    List<Transaction> findByTransactionDateTimeBetweenOrderByTransactionDateTimeDesc(
            LocalDateTime startDateTime,
            LocalDateTime endDateTime
    );

    @Query("""
    	       SELECT COALESCE(SUM(t.amount), 0)
    	       FROM Transaction t
    	       WHERE t.transactionType = :type
    	         AND t.status = :status
    	         AND t.transactionDateTime >= :startDateTime
    	         AND t.transactionDateTime < :endDateTime
    	       """)
    	BigDecimal sumAmountByTypeAndStatusBetween(
    	        @Param("type") TransactionType type,
    	        @Param("status") TransactionStatus status,
    	        @Param("startDateTime") LocalDateTime startDateTime,
    	        @Param("endDateTime") LocalDateTime endDateTime
    	);
    @Query("""
    	       SELECT COALESCE(SUM(t.amount), 0)
    	       FROM Transaction t
    	       WHERE t.transactionType = transactions.enums.TransactionType.PURCHASE
    	         AND t.status = transactions.enums.TransactionStatus.SUCCESS
    	         AND t.merchantId = :merchantId
    	       """)
    	BigDecimal sumPurchaseAmountByMerchantId(@Param("merchantId") Long merchantId);

    	@Query("""
    	       SELECT t.cardNumber
    	       FROM Transaction t
    	       WHERE t.status = transactions.enums.TransactionStatus.SUCCESS
    	       GROUP BY t.cardNumber
    	       ORDER BY COUNT(t) DESC
    	       """)
    	List<String> findMostUsedCards();

    	@Query("""
    	       SELECT COALESCE(SUM(t.amount), 0)
    	       FROM Transaction t
    	       WHERE t.status = transactions.enums.TransactionStatus.SUCCESS
    	         AND t.transactionType = transactions.enums.TransactionType.PURCHASE
    	       """)
    	BigDecimal sumAllSuccessfulPurchases();

    	@Query("""
    	       SELECT COALESCE(MAX(t.amount), 0)
    	       FROM Transaction t
    	       WHERE t.status = transactions.enums.TransactionStatus.SUCCESS
    	         AND t.transactionType = transactions.enums.TransactionType.PURCHASE
    	       """)
    	BigDecimal findLargestSuccessfulPurchase();
}
