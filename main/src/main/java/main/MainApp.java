package main;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * Single entry point for the MergeMaster credit-card APIs.
 * Customer support can be added here as another module later.
 */
@SpringBootApplication(scanBasePackages = { "com.ofss", "merchant", "transactions" })
@EntityScan(basePackages = { "merchant", "transactions.entity" })
@EnableJpaRepositories(basePackages = { "merchant", "transactions.repository" })
public class MainApp {

    public static void main(String[] args) {
        SpringApplication.run(MainApp.class, args);
    }
}
