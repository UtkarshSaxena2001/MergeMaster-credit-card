package com.ofss;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CreditCardApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(CreditCardApiApplication.class, args);
		System.out.println("Credit Card API started");
	}

}
