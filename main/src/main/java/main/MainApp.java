package main;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import com.ofss.CreditCardApiApplication;

import customer.CustomerApplication;
import merchant.MerchantApplication;
import transactions.TransactionsApplication;

/**
 * Single entry point for the MergeMaster credit-card APIs.
 * All current MergeMaster API modules are loaded here.
 */
@SpringBootApplication
@ComponentScan(
        basePackages = { "com.ofss", "customer", "merchant", "transactions" },
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = {
                        CreditCardApiApplication.class,
                        CustomerApplication.class,
                        MerchantApplication.class,
                        TransactionsApplication.class
                }))
@Import(ApiCorsConfiguration.class)
@EntityScan(basePackages = { "customer", "merchant", "transactions.entity" })
@EnableJpaRepositories(basePackages = { "customer", "merchant", "transactions.repository" })
public class MainApp {

    public static void main(String[] args) {
        SpringApplication.run(MainApp.class, args);
    }
}
