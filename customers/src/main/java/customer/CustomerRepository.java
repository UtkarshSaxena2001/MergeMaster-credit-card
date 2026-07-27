package customer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByMobileNumber(String mobileNumber);

    boolean existsByPanNumberIgnoreCase(String panNumber);

    boolean existsByEmailIgnoreCaseAndCustomerIdNot(String email, Long customerId);

    boolean existsByMobileNumberAndCustomerIdNot(String mobileNumber, Long customerId);

    boolean existsByPanNumberIgnoreCaseAndCustomerIdNot(String panNumber, Long customerId);
}
