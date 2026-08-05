package customer;

public class CustomerResponse {

    private Long customerId;
    private String customerName;
    private String password;
    private String email;
    private String mobileNumber;
    private String panNumber;

    public CustomerResponse() {
    }

    public CustomerResponse(Long customerId, String customerName, String password, String email,
                            String mobileNumber, String panNumber) {
        this.customerId = customerId;
        this.customerName = customerName;
        this.password = password;
        this.email = email;
        this.mobileNumber = mobileNumber;
        this.panNumber = panNumber;
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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getMobileNumber() {
        return mobileNumber;
    }

    public void setMobileNumber(String mobileNumber) {
        this.mobileNumber = mobileNumber;
    }

    public String getPanNumber() {
        return panNumber;
    }

    public void setPanNumber(String panNumber) {
        this.panNumber = panNumber;
    }
}
