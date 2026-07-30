package com.ofss;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface CreditCardRepository extends JpaRepository<CreditCard, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select card from CreditCard card where card.cardNumber = :cardNumber")
    Optional<CreditCard> findByCardNumberForUpdate(
            @Param("cardNumber") String cardNumber);
}
