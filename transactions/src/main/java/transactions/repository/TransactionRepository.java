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
             AND t.transactionDateTime BETWEEN :startDateTime AND :endDateTime
           """)
    BigDecimal sumAmountByTypeAndStatusBetween(
            @Param("type") TransactionType type,
            @Param("status") TransactionStatus status,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime
    );
}
