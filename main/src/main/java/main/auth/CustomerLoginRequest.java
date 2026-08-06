package main.auth;

import jakarta.validation.constraints.NotBlank;

public class CustomerLoginRequest {

    @NotBlank(message = "Customer name is required")
    private String customerName;

    @NotBlank(message = "Password is required")
    private String password;

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
