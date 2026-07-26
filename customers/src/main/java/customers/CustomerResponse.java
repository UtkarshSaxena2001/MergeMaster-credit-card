package customers;
public class CustomerResponse {
 private final Long customerId; private final String customerName; private final String emailAddress; private final String mobileNumber; private final String panNumber;
 public CustomerResponse(Long id,String name,String email,String mobile,String pan){customerId=id;customerName=name;emailAddress=email;mobileNumber=mobile;panNumber=pan;}
 public Long getCustomerId(){return customerId;} public String getCustomerName(){return customerName;} public String getEmailAddress(){return emailAddress;} public String getMobileNumber(){return mobileNumber;} public String getPanNumber(){return panNumber;}
}
