import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public final class OracleCustomerProbe {
    private OracleCustomerProbe() {
    }

    public static void main(String[] args) throws Exception {
        String email = args[0].trim().toLowerCase();
        boolean deleteAfterCheck = Boolean.parseBoolean(args[1]);

        try (Connection connection = DriverManager.getConnection(
                System.getenv("ORACLE_DB_URL"),
                System.getenv("ORACLE_DB_USERNAME"),
                System.getenv("ORACLE_DB_PASSWORD"))) {
            printCustomer(connection, email);
            if (deleteAfterCheck) {
                try (PreparedStatement statement = connection.prepareStatement(
                        "delete from customer where lower(email) = ?")) {
                    statement.setString(1, email);
                    System.out.println("deleted=" + statement.executeUpdate());
                }
            }
        }
    }

    private static void printCustomer(Connection connection, String email)
            throws Exception {
        try (PreparedStatement statement = connection.prepareStatement(
                "select customer_id, customer_name, email, mobile_number, pan_number "
                        + "from customer where lower(email) = ?")) {
            statement.setString(1, email);
            try (ResultSet result = statement.executeQuery()) {
                if (!result.next()) {
                    System.out.println("customer_not_found");
                    return;
                }
                System.out.println("customer_id=" + result.getLong("customer_id"));
                System.out.println("customer_name=" + result.getString("customer_name"));
                System.out.println("email=" + result.getString("email"));
                System.out.println("mobile_number=" + result.getString("mobile_number"));
                System.out.println("pan_number=" + result.getString("pan_number"));
            }
        }
    }
}
