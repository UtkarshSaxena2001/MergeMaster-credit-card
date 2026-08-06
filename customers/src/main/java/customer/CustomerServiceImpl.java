package customer;

import java.security.SecureRandom;
import java.util.List;
import java.util.Locale;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CustomerServiceImpl implements CustomerService {

    private static final String PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    private static final int GENERATED_PASSWORD_LENGTH = 10;

    private final CustomerRepository customerRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public CustomerServiceImpl(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @Override
    public CustomerResponse addCustomer(CustomerRequest request) {
        String email = normalizeEmail(request.getEmail());
        String mobileNumber = request.getMobileNumber().trim();
        String panNumber = normalizePan(request.getPanNumber());

        validateUniqueForCreate(email, mobileNumber, panNumber);

        Customer customer = new Customer();
        updateEntity(customer, request, email, mobileNumber, panNumber);

        try {
            return toResponse(customerRepository.saveAndFlush(customer));
        } catch (DataIntegrityViolationException exception) {
            throw new IllegalArgumentException(buildCreateConflictMessage(email, mobileNumber, panNumber));
        }
    }

    @Override
    public CustomerResponse updateCustomer(Long customerId, CustomerRequest request) {
        Customer customer = findCustomer(customerId);
        String email = normalizeEmail(request.getEmail());
        String mobileNumber = request.getMobileNumber().trim();
        String panNumber = normalizePan(request.getPanNumber());

        validateUniqueForUpdate(customerId, email, mobileNumber, panNumber);
        updateEntity(customer, request, email, mobileNumber, panNumber);

        try {
            return toResponse(customerRepository.saveAndFlush(customer));
        } catch (DataIntegrityViolationException exception) {
            throw new IllegalArgumentException(buildUpdateConflictMessage(customerId, email, mobileNumber, panNumber));
        }
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerResponse getCustomerById(Long customerId) {
        return toResponse(findCustomer(customerId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerResponse> getAllCustomers() {
        return customerRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public void deleteCustomer(Long customerId) {
        Customer customer = findCustomer(customerId);

        try {
            customerRepository.delete(customer);
            customerRepository.flush();
        } catch (DataIntegrityViolationException exception) {
            throw new IllegalStateException(
                    "Customer cannot be deleted because a credit card is linked to the customer");
        }
    }

    private Customer findCustomer(Long customerId) {
        return customerRepository.findById(customerId)
                .orElseThrow(() -> new CustomerNotFoundException(customerId));
    }

    private void validateUniqueForCreate(String email, String mobileNumber, String panNumber) {
        if (customerRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("Email is already registered");
        }
        if (customerRepository.existsByMobileNumber(mobileNumber)) {
            throw new IllegalArgumentException("Mobile number is already registered");
        }
        if (customerRepository.existsByPanNumberIgnoreCase(panNumber)) {
            throw new IllegalArgumentException("PAN number is already registered");
        }
    }

    private String buildCreateConflictMessage(String email, String mobileNumber, String panNumber) {
        if (customerRepository.existsByEmailIgnoreCase(email)) {
            return "Email is already registered";
        }
        if (customerRepository.existsByMobileNumber(mobileNumber)) {
            return "Mobile number is already registered";
        }
        if (customerRepository.existsByPanNumberIgnoreCase(panNumber)) {
            return "PAN number is already registered";
        }
        return "Customer could not be saved. Check that email, mobile number, and PAN are valid and unique.";
    }

    private void validateUniqueForUpdate(Long customerId, String email,
                                         String mobileNumber, String panNumber) {
        if (customerRepository.existsByEmailIgnoreCaseAndCustomerIdNot(email, customerId)) {
            throw new IllegalArgumentException("Email belongs to another customer");
        }
        if (customerRepository.existsByMobileNumberAndCustomerIdNot(mobileNumber, customerId)) {
            throw new IllegalArgumentException("Mobile number belongs to another customer");
        }
        if (customerRepository.existsByPanNumberIgnoreCaseAndCustomerIdNot(panNumber, customerId)) {
            throw new IllegalArgumentException("PAN number belongs to another customer");
        }
    }

    private String buildUpdateConflictMessage(Long customerId, String email, String mobileNumber, String panNumber) {
        if (customerRepository.existsByEmailIgnoreCaseAndCustomerIdNot(email, customerId)) {
            return "Email belongs to another customer";
        }
        if (customerRepository.existsByMobileNumberAndCustomerIdNot(mobileNumber, customerId)) {
            return "Mobile number belongs to another customer";
        }
        if (customerRepository.existsByPanNumberIgnoreCaseAndCustomerIdNot(panNumber, customerId)) {
            return "PAN number belongs to another customer";
        }
        return "Customer could not be updated. Check that email, mobile number, and PAN are valid and unique.";
    }

    private void updateEntity(Customer customer, CustomerRequest request,
                              String email, String mobileNumber, String panNumber) {
        String customerName = request.getCustomerName().trim().replaceAll("\\s+", " ");
        customer.setCustomerName(customerName);
        customer.setPassword(resolvePassword(request.getPassword(), customerName, customer.getPassword()));
        customer.setEmail(email);
        customer.setMobileNumber(mobileNumber);
        customer.setPanNumber(panNumber);
    }

    private String resolvePassword(String requestedPassword, String customerName, String currentPassword) {
        if (requestedPassword != null && !requestedPassword.trim().isEmpty()) {
            return requestedPassword.trim();
        }
        if (currentPassword != null && !currentPassword.trim().isEmpty()) {
            return currentPassword.trim();
        }
        return generateInitialPassword();
    }

    private String generateInitialPassword() {
        StringBuilder password = new StringBuilder(GENERATED_PASSWORD_LENGTH);
        for (int index = 0; index < GENERATED_PASSWORD_LENGTH; index += 1) {
            password.append(PASSWORD_ALPHABET.charAt(secureRandom.nextInt(PASSWORD_ALPHABET.length())));
        }
        return password.toString();
    }

    private CustomerResponse toResponse(Customer customer) {
        return new CustomerResponse(
                customer.getCustomerId(),
                customer.getCustomerName(),
                customer.getPassword(),
                customer.getEmail(),
                customer.getMobileNumber(),
                customer.getPanNumber());
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizePan(String panNumber) {
        return panNumber.trim().toUpperCase(Locale.ROOT);
    }

}
