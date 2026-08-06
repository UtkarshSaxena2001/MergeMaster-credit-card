package main.auth;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/customer")
public class CustomerAuthController {

    private final CustomerAuthService customerAuthService;

    public CustomerAuthController(CustomerAuthService customerAuthService) {
        this.customerAuthService = customerAuthService;
    }

    @PostMapping("/otp/request")
    public ResponseEntity<AuthResponse> requestOtp(@Valid @RequestBody OtpRequest request) {
        return ResponseEntity.ok(customerAuthService.requestOtp(request));
    }

    @PostMapping("/otp/setup")
    public ResponseEntity<AuthResponse> verifyOtpAndSetup(@Valid @RequestBody OtpSetupRequest request) {
        return ResponseEntity.ok(customerAuthService.verifyOtpAndSetup(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody CustomerLoginRequest request) {
        return ResponseEntity.ok(customerAuthService.login(request));
    }
}
