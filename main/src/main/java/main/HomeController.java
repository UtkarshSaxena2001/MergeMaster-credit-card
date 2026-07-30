package main;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class HomeController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> home() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("application", "MergeMaster Credit Card API");
        response.put("version", "1.0.0-SNAPSHOT");
        response.put("status", "RUNNING");

        Map<String, String> endpoints = new LinkedHashMap<>();
        endpoints.put("GET  /api/customers", "List all customers");
        endpoints.put("POST /api/customers", "Add a new customer");
        endpoints.put("GET  /api/customers/{id}", "Get customer by ID");
        endpoints.put("PUT  /api/customers/{id}", "Update customer");
        endpoints.put("DELETE /api/customers/{id}", "Delete customer");
        endpoints.put("GET  /api/creditcards", "List all credit cards");
        endpoints.put("POST /api/creditcards", "Add a new credit card");
        endpoints.put("GET  /api/creditcards/{cardNumber}", "Get credit card by number");
        endpoints.put("DELETE /api/creditcards/{cardNumber}", "Delete credit card");
        endpoints.put("PUT  /api/creditcards/{cardNumber}", "Replace credit card");
        endpoints.put("PATCH /api/creditcards/{cardNumber}", "Partially update credit card");
        endpoints.put("GET  /api/system/database", "Database connection status");

        response.put("endpoints", endpoints);
        return ResponseEntity.ok(response);
    }
}