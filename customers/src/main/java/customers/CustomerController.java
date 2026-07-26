package customers;
import jakarta.validation.Valid; import org.springframework.http.*; import org.springframework.web.bind.annotation.*; import java.net.URI; import java.util.List;
@RestController @RequestMapping("/api/customers")
public class CustomerController {
 private final CustomerService service; public CustomerController(CustomerService s){service=s;}
 @PostMapping public ResponseEntity<CustomerResponse> create(@Valid @RequestBody CustomerRequest r){CustomerResponse c=service.createCustomer(r);return ResponseEntity.created(URI.create("/api/customers/"+c.getCustomerId())).body(c);}
 @GetMapping public List<CustomerResponse> all(){return service.getAllCustomers();}
 @GetMapping("/{id}") public CustomerResponse one(@PathVariable Long id){return service.getCustomerById(id);}
 @PutMapping("/{id}") public CustomerResponse update(@PathVariable Long id,@Valid @RequestBody CustomerRequest r){return service.updateCustomer(id,r);}
 @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id){service.deleteCustomer(id);return ResponseEntity.noContent().build();}
}
