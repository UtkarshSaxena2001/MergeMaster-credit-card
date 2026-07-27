package transactions.integration;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CreditCardRepository extends JpaRepository<CreditCardRecord, String> {
}
