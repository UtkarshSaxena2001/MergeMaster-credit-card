package customers;
import org.springframework.stereotype.Repository;
import java.util.*; import java.util.concurrent.*; import java.util.concurrent.atomic.AtomicLong;
@Repository
public class CustomerRepository {
 private final Map<Long,Customer> data=new ConcurrentHashMap<>(); private final AtomicLong ids=new AtomicLong();
 public Customer save(Customer c){if(c.getCustomerId()==null)c.setCustomerId(ids.incrementAndGet());data.put(c.getCustomerId(),c);return c;}
 public Optional<Customer> findById(Long id){return Optional.ofNullable(data.get(id));}
 public List<Customer> findAll(){return data.values().stream().sorted(Comparator.comparing(Customer::getCustomerId)).toList();}
 public void deleteById(Long id){data.remove(id);}
 public boolean existsById(Long id){return data.containsKey(id);}
 public boolean duplicateEmail(String email,Long ignore){return data.values().stream().anyMatch(c->!Objects.equals(c.getCustomerId(),ignore)&&c.getEmailAddress().equalsIgnoreCase(email));}
 public boolean duplicateMobile(String mobile,Long ignore){return data.values().stream().anyMatch(c->!Objects.equals(c.getCustomerId(),ignore)&&c.getMobileNumber().equals(mobile));}
 public boolean duplicatePan(String pan,Long ignore){return data.values().stream().anyMatch(c->!Objects.equals(c.getCustomerId(),ignore)&&c.getPanNumber().equalsIgnoreCase(pan));}
}
