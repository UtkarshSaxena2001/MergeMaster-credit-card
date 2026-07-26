package customers;
import org.springframework.http.*; import org.springframework.web.bind.MethodArgumentNotValidException; import org.springframework.web.bind.annotation.*; import java.time.LocalDateTime; import java.util.*;
@RestControllerAdvice
public class GlobalExceptionHandler {
 @ExceptionHandler(CustomerNotFoundException.class) ResponseEntity<Map<String,Object>> notFound(Exception e){return error(HttpStatus.NOT_FOUND,e.getMessage());}
 @ExceptionHandler(DuplicateCustomerException.class) ResponseEntity<Map<String,Object>> duplicate(Exception e){return error(HttpStatus.CONFLICT,e.getMessage());}
 @ExceptionHandler(MethodArgumentNotValidException.class) ResponseEntity<Map<String,Object>> invalid(MethodArgumentNotValidException e){Map<String,Object>b=new LinkedHashMap<>();b.put("timestamp",LocalDateTime.now());b.put("status",400);b.put("message","Validation failed");Map<String,String>f=new LinkedHashMap<>();e.getBindingResult().getFieldErrors().forEach(x->f.putIfAbsent(x.getField(),x.getDefaultMessage()));b.put("errors",f);return ResponseEntity.badRequest().body(b);}
 private ResponseEntity<Map<String,Object>> error(HttpStatus s,String m){Map<String,Object>b=new LinkedHashMap<>();b.put("timestamp",LocalDateTime.now());b.put("status",s.value());b.put("message",m);return ResponseEntity.status(s).body(b);}
}
