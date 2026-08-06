package main.auth;

public class AuthResponse {

    private String message;
    private Long customerId;
    private String customerName;

    public AuthResponse() {
    }

    public AuthResponse(String message, Long customerId, String customerName) {
        this.message = message;
        this.customerId = customerId;
        this.customerName = customerName;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

}
