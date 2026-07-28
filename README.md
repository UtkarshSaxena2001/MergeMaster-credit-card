# MergeMaster Credit Card

This is a Maven multi-module Spring Boot project. The `main` module starts the integrated Credit Card, Customer, Merchant, and Transactions APIs.

## Run in STS or VS Code

1. Import/open the repository root as an **Existing Maven Project** (STS) or as a folder with the Java Extension Pack (VS Code).
2. Use Java 17.
3. Run `main.MainApp`, or run `mvn spring-boot:run -pl main -am` from the repository root.

The integrated application starts on `http://localhost:8080` using an in-memory H2 database. H2 Console is available at `/h2-console`.

## Build and test

```powershell
mvn test
```

Use the Maven installation configured in STS or VS Code if `mvn` is not on your terminal PATH.
