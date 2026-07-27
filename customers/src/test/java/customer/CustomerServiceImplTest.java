package customer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CustomerServiceImplTest {

    @Mock
    private CustomerRepository customerRepository;

    private CustomerServiceImpl customerService;

    @BeforeEach
    void setUp() {
        customerService = new CustomerServiceImpl(customerRepository);
    }

    @Test
    void addCustomerNormalizesAndSavesData() {
        CustomerRequest request = createRequest(
                "  Rahul   Sharma  ",
                "RAHUL@EXAMPLE.COM",
                "9876543210",
                "abcde1234f");

        when(customerRepository.saveAndFlush(any(Customer.class)))
                .thenAnswer(invocation -> {
                    Customer customer = invocation.getArgument(0);
                    customer.setCustomerId(1L);
                    return customer;
                });

        CustomerResponse response = customerService.addCustomer(request);

        assertEquals(1L, response.getCustomerId());
        assertEquals("Rahul Sharma", response.getCustomerName());
        assertEquals("rahul@example.com", response.getEmail());
        assertEquals("ABCDE1234F", response.getPanNumber());
        verify(customerRepository).saveAndFlush(any(Customer.class));
    }

    @Test
    void getCustomerByIdThrowsWhenCustomerDoesNotExist() {
        when(customerRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(CustomerNotFoundException.class,
                () -> customerService.getCustomerById(99L));
    }

    private CustomerRequest createRequest(String name, String email,
                                          String mobileNumber, String panNumber) {
        CustomerRequest request = new CustomerRequest();
        request.setCustomerName(name);
        request.setEmail(email);
        request.setMobileNumber(mobileNumber);
        request.setPanNumber(panNumber);
        return request;
    }
}
