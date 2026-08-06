package main.admin;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/delete")
public class AdminDeleteController {

    private final AdminDeleteService adminDeleteService;

    public AdminDeleteController(AdminDeleteService adminDeleteService) {
        this.adminDeleteService = adminDeleteService;
    }

    @DeleteMapping("/customers/{customerId}")
    public ResponseEntity<Void> deleteCustomer(@PathVariable Long customerId) {
        adminDeleteService.deleteCustomerCascade(customerId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/creditcards/{cardNumber}")
    public ResponseEntity<Void> deleteCard(@PathVariable String cardNumber) {
        adminDeleteService.deleteCardCascade(cardNumber);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/merchants/{merchantId}")
    public ResponseEntity<Void> deleteMerchant(@PathVariable Long merchantId) {
        adminDeleteService.deleteMerchantCascade(merchantId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/transactions/{transactionId}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable Long transactionId) {
        adminDeleteService.deleteTransaction(transactionId);
        return ResponseEntity.noContent().build();
    }
}
