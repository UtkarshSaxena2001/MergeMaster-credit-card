package transactions.integration;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MerchantRepository extends JpaRepository<MerchantRecord, Long> {
}
