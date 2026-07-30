package transactions;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = { "transactions", "com.ofss", "merchant" })
@EntityScan(basePackages = { "transactions.entity", "com.ofss", "merchant" })
@EnableJpaRepositories(basePackages = { "transactions.repository", "com.ofss", "merchant" })
public class TransactionsApplication {

	public static void main(String[] args) {
		SpringApplication.run(TransactionsApplication.class, args);
	}

}
