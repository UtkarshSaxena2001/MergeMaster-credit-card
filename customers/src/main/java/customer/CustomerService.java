package customer;

import java.util.List;

public interface CustomerService {

    CustomerResponse addCustomer(CustomerRequest request);

    CustomerResponse updateCustomer(Long customerId, CustomerRequest request);

    CustomerResponse getCustomerById(Long customerId);

    List<CustomerResponse> getAllCustomers();

    void deleteCustomer(Long customerId);
}
