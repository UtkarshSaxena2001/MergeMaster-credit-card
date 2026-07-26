package customers;
import java.util.List;
public interface CustomerService { CustomerResponse createCustomer(CustomerRequest r); CustomerResponse getCustomerById(Long id); List<CustomerResponse> getAllCustomers(); CustomerResponse updateCustomer(Long id,CustomerRequest r); void deleteCustomer(Long id); }
