package main;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.Map;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/system")
public class DatabaseStatusController {

    private final DataSource dataSource;
    private final String datasourceUrl;

    public DatabaseStatusController(
            DataSource dataSource,
            @Value("${spring.datasource.url}") String datasourceUrl) {
        this.dataSource = dataSource;
        this.datasourceUrl = datasourceUrl;
    }

    @GetMapping("/database")
    public ResponseEntity<Map<String, String>> databaseStatus() {
        Map<String, String> response = new LinkedHashMap<>();

        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metadata = connection.getMetaData();
            response.put("status", "UP");
            response.put("database", metadata.getDatabaseProductName());
            response.put("service", serviceName(datasourceUrl));
            return ResponseEntity.ok(response);
        } catch (SQLException exception) {
            response.put("status", "DOWN");
            response.put("database", "Unavailable");
            response.put("service", serviceName(datasourceUrl));
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
        }
    }

    private String serviceName(String url) {
        int separator = url.lastIndexOf('/');
        if (separator < 0 || separator == url.length() - 1) {
            return "configured service";
        }
        return url.substring(separator + 1);
    }
}
