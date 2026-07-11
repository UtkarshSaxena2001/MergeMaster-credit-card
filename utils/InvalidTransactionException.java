package utils;

public class InvalidTransactionException {
    public void invalidTransactionException(String message) {
        System.out.println("Unable to procced with transaction because " + message);
    }
}
