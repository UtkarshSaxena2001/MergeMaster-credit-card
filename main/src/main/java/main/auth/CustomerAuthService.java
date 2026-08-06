package main.auth;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import customer.Customer;
import customer.CustomerRepository;

@Service
public class CustomerAuthService {

    private static final long OTP_VALID_SECONDS = 300;

    private final CustomerRepository customerRepository;
    private final SecureRandom secureRandom = new SecureRandom();
    private final Map<String, OtpChallenge> otpChallenges = new ConcurrentHashMap<>();

    public CustomerAuthService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public AuthResponse requestOtp(OtpRequest request) {
        String mobileNumber = request.getMobileNumber().trim();
        Customer customer = customerRepository.findByMobileNumber(mobileNumber)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No customer account is registered with that mobile number."));
        String otp = generateOtp();
        otpChallenges.put(mobileNumber, new OtpChallenge(otp, Instant.now().plusSeconds(OTP_VALID_SECONDS)));
        return new AuthResponse("Demo OTP for " + mobileNumber + " is " + otp + ".", customer.getCustomerId(),
                customer.getCustomerName());
    }

    @Transactional
    public AuthResponse verifyOtpAndSetup(OtpSetupRequest request) {
        String mobileNumber = request.getMobileNumber().trim();
        verifyOtp(mobileNumber, request.getOtp().trim());
        String customerName = normalizeName(request.getCustomerName());
        Customer customer = customerRepository.findByMobileNumber(mobileNumber)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No customer account is registered with that mobile number."));
        if (!normalizeName(customer.getCustomerName()).equalsIgnoreCase(customerName)) {
            throw new IllegalArgumentException("Customer name does not match this registered mobile number.");
        }
        customer.setPassword(request.getPassword().trim());
        Customer savedCustomer = customerRepository.saveAndFlush(customer);
        otpChallenges.remove(mobileNumber);
        return toAuthResponse("Customer login setup completed.", savedCustomer);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(CustomerLoginRequest request) {
        String customerName = normalizeName(request.getCustomerName());
        Customer customer = customerRepository.findByCustomerNameIgnoreCase(customerName)
                .orElseThrow(() -> new IllegalArgumentException(
                        "We could not find that customer name. If this is your first login, use First-time OTP."));
        if (!customer.getPassword().trim().equals(request.getPassword().trim())) {
            throw new IllegalArgumentException("The password does not match this customer account.");
        }
        return toAuthResponse("Customer login successful.", customer);
    }

    private void verifyOtp(String mobileNumber, String otp) {
        OtpChallenge challenge = otpChallenges.get(mobileNumber);
        if (challenge == null) {
            throw new IllegalArgumentException("Request an OTP for your registered mobile number first.");
        }
        if (Instant.now().isAfter(challenge.expiresAt())) {
            otpChallenges.remove(mobileNumber);
            throw new IllegalArgumentException("OTP expired. Request a new OTP.");
        }
        if (!challenge.otp().equals(otp)) {
            throw new IllegalArgumentException("Enter the correct demo OTP shown in the toast.");
        }
    }

    private String generateOtp() {
        return String.valueOf(100000 + secureRandom.nextInt(900000));
    }

    private String normalizeName(String name) {
        return name.trim().replaceAll("\\s+", " ");
    }

    private AuthResponse toAuthResponse(String message, Customer customer) {
        return new AuthResponse(message, customer.getCustomerId(), customer.getCustomerName());
    }

    private record OtpChallenge(String otp, Instant expiresAt) {
    }
}
