package main;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import customer.Customer;
import customer.CustomerRepository;

@Component
@ConditionalOnProperty(name = "app.seed-sample-data", havingValue = "true")
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final CustomerRepository customerRepository;

    public DataInitializer(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @Override
    public void run(String... args) {
        if (customerRepository.count() > 0) {
            log.info("Customers already exist in the database, skipping data initialization.");
            return;
        }

        log.info("Seeding sample customer data...");

        Customer customer1 = new Customer();
        customer1.setCustomerName("John Doe");
        customer1.setEmail("john.doe@example.com");
        customer1.setMobileNumber("9876543210");
        customer1.setPanNumber("ABCDE1234F");
        customerRepository.save(customer1);

        Customer customer2 = new Customer();
        customer2.setCustomerName("Jane Smith");
        customer2.setEmail("jane.smith@example.com");
        customer2.setMobileNumber("8765432109");
        customer2.setPanNumber("XYZAB5678G");
        customerRepository.save(customer2);

        Customer customer3 = new Customer();
        customer3.setCustomerName("Alice Johnson");
        customer3.setEmail("alice.johnson@example.com");
        customer3.setMobileNumber("7654321098");
        customer3.setPanNumber("PQRST9012H");
        customerRepository.save(customer3);

        log.info("Seeded {} sample customers.", customerRepository.count());
    }
}
