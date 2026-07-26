package customers;
import jakarta.validation.constraints.*;
public class CustomerRequest {
 @NotBlank @Size(min=2,max=100) private String customerName;
 @NotBlank @Email private String emailAddress;
 @NotBlank @Pattern(regexp="^[6-9][0-9]{9}$") private String mobileNumber;
 @NotBlank @Pattern(regexp="^[A-Za-z]{5}[0-9]{4}[A-Za-z]$") private String panNumber;
 public String getCustomerName(){return customerName;} public void setCustomerName(String v){customerName=v;}
 public String getEmailAddress(){return emailAddress;} public void setEmailAddress(String v){emailAddress=v;}
 public String getMobileNumber(){return mobileNumber;} public void setMobileNumber(String v){mobileNumber=v;}
 public String getPanNumber(){return panNumber;} public void setPanNumber(String v){panNumber=v;}
}
