package transactions.integration;

import java.util.Optional;

public interface CreditCardGateway {
    Optional<CreditCardSnapshot> findByCardNumber(String cardNumber);

    CreditCardSnapshot save(CreditCardSnapshot card);
}
