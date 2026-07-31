# MergeMaster Credit Card

This is a Maven multi-module Spring Boot project. The `main` module starts the integrated Credit Card, Customer, Merchant, and Transactions APIs.

## Run in STS or VS Code

1. Import/open the repository root as an **Existing Maven Project** (STS) or as a folder with the Java Extension Pack (VS Code).
2. Use Java 17.
3. Run `main.MainApp`.

From a terminal, set the Oracle credentials through environment variables, build
the reactor first, and then start only the integrated `main` module:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
$env:ORACLE_DB_URL = 'jdbc:oracle:thin:@//localhost:1521/FREE'
$env:ORACLE_DB_USERNAME = 'SYSTEM'
$secure = Read-Host 'Oracle password' -AsSecureString
$env:ORACLE_DB_PASSWORD = ([pscredential]::new($env:ORACLE_DB_USERNAME, $secure)).GetNetworkCredential().Password

mvn -f .\pom.xml -pl main -am clean install -DskipTests
if ($LASTEXITCODE -ne 0) { throw 'Backend build failed' }
mvn -f .\main\pom.xml spring-boot:run
```

If `mvn` is not on your PATH, use the included helper from the repository root:

```powershell
.\run-backend.ps1
```

Do not combine `spring-boot:run` with `-am`: Maven would apply the Spring Boot
goal to the root aggregator first, and that POM intentionally has no main
class.

The integrated application starts on `http://localhost:8080` and validates the
existing Oracle FREE schema. H2 is used only by automated tests.

## Oracle JET portal

The full Oracle JET operations portal is in [`main/credit-card-portal`](main/credit-card-portal).
It includes separate Dashboard, Customers, Cards, Merchants, and Transactions pages.
See its [README](main/credit-card-portal/README.md) for development instructions.

## Build and test

```powershell
mvn test
```

Use Java 17 or newer. Use the Maven installation configured in STS or VS Code if `mvn` is not on your terminal PATH.
