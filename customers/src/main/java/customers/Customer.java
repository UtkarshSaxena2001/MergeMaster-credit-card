package customers;
public class Customer {
 private Long customerId; private String customerName; private String emailAddress; private String mobileNumber; private String panNumber;
 public Customer(){}
 public Customer(Long id,String name,String email,String mobile,String pan){this.customerId=id;this.customerName=name;this.emailAddress=email;this.mobileNumber=mobile;this.panNumber=pan;}
 public Long getCustomerId(){return customerId;} public void setCustomerId(Long v){customerId=v;}
 public String getCustomerName(){return customerName;} public void setCustomerName(String v){customerName=v;}
 public String getEmailAddress(){return emailAddress;} public void setEmailAddress(String v){emailAddress=v;}
 public String getMobileNumber(){return mobileNumber;} public void setMobileNumber(String v){mobileNumber=v;}
 public String getPanNumber(){return panNumber;} public void setPanNumber(String v){panNumber=v;}
}
