package com.ofss;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
class CreditCardApiApplicationTests {

	@Autowired
	private CreditCardService creditCardService;

	@Test
	void contextLoads() {
	}

	@Test
	@Transactional
	void persistsCardPurchasesAndPayments() {
		CreditCard card = new CreditCard(
				"4111111111111111",
				1L,
				"GOLD",
				new BigDecimal("10000.00"),
				new BigDecimal("10000.00"),
				BigDecimal.ZERO,
				LocalDate.now().plusYears(3),
				"ACTIVE");

		assertTrue(creditCardService.addNewCreditCard(card));

		CreditCard purchased = creditCardService.recordPurchase(
				card.getCardNumber(),
				new BigDecimal("1250.00"));
		assertEquals(new BigDecimal("8750.00"), purchased.getAvailableCredit());
		assertEquals(new BigDecimal("1250.00"), purchased.getOutstandingAmount());

		CreditCard paid = creditCardService.recordPayment(
				card.getCardNumber(),
				new BigDecimal("250.00"));
		assertEquals(new BigDecimal("9000.00"), paid.getAvailableCredit());
		assertEquals(new BigDecimal("1000.00"), paid.getOutstandingAmount());
	}
}
