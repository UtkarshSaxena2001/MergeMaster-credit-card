# MergeMaster Credit Card

This is a Maven multi-module Spring Boot project. The `main` module starts the integrated Credit Card, Customer, Merchant, and Transactions APIs.

## Run in STS or VS Code

1. Import/open the repository root as an **Existing Maven Project** (STS) or as a folder with the Java Extension Pack (VS Code).
2. Use Java 17.
3. Run `main.MainApp`.

From a terminal, build the reactor first and then start only the integrated
`main` module:

```powershell
mvn -f .\pom.xml -pl main -am clean install -DskipTests
if ($LASTEXITCODE -ne 0) { throw 'Backend build failed' }
mvn -f .\main\pom.xml spring-boot:run
```

Do not combine `spring-boot:run` with `-am`: Maven would apply the Spring Boot
goal to the root aggregator first, and that POM intentionally has no main
class.

The integrated application starts on `http://localhost:8080` using an in-memory H2 database. H2 Console is available at `/h2-console`.

## Oracle JET portal

The full Oracle JET operations portal is in [`main/credit-card-portal`](main/credit-card-portal).
It includes separate Dashboard, Customers, Cards, Merchants, and Transactions pages.
See its [README](main/credit-card-portal/README.md) for development instructions.

## Build and test

```powershell
mvn test
```

Use Java 17 or newer. Use the Maven installation configured in STS or VS Code if `mvn` is not on your terminal PATH.
