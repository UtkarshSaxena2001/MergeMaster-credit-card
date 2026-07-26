package customers;
import org.springframework.stereotype.Service; import java.util.*;
@Service
public class CustomerServiceImpl implements CustomerService {
 private final CustomerRepository repo; public CustomerServiceImpl(CustomerRepository repo){this.repo=repo;}
 public CustomerResponse createCustomer(CustomerRequest r){Customer c=normalize(r,null);check(c,null);return out(repo.save(c));}
 public CustomerResponse getCustomerById(Long id){return out(find(id));}
 public List<CustomerResponse> getAllCustomers(){return repo.findAll().stream().map(this::out).toList();}
 public CustomerResponse updateCustomer(Long id,CustomerRequest r){find(id);Customer c=normalize(r,id);check(c,id);return out(repo.save(c));}
 public void deleteCustomer(Long id){find(id);repo.deleteById(id);}
 private Customer find(Long id){return repo.findById(id).orElseThrow(()->new CustomerNotFoundException(id));}
 private void check(Customer c,Long id){if(repo.duplicateEmail(c.getEmailAddress(),id))throw new DuplicateCustomerException("Email already exists");if(repo.duplicateMobile(c.getMobileNumber(),id))throw new DuplicateCustomerException("Mobile already exists");if(repo.duplicatePan(c.getPanNumber(),id))throw new DuplicateCustomerException("PAN already exists");}
 private Customer normalize(CustomerRequest r,Long id){return new Customer(id,r.getCustomerName().trim(),r.getEmailAddress().trim().toLowerCase(Locale.ROOT),r.getMobileNumber().trim(),r.getPanNumber().trim().toUpperCase(Locale.ROOT));}
 private CustomerResponse out(Customer c){return new CustomerResponse(c.getCustomerId(),c.getCustomerName(),c.getEmailAddress(),c.getMobileNumber(),c.getPanNumber());}
}
