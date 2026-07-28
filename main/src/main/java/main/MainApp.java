package main;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * Single entry point for the MergeMaster credit-card APIs.
 * All current MergeMaster API modules are loaded here.
 */
@SpringBootApplication(scanBasePackages = { "com.ofss", "customer", "merchant", "transactions" })
@EntityScan(basePackages = { "customer", "merchant", "transactions.entity" })
@EnableJpaRepositories(basePackages = { "customer", "merchant", "transactions.repository" })
public class MainApp {

    public static void main(String[] args) {
        SpringApplication.run(MainApp.class, args);
    }
}
