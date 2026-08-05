# MergeMaster Oracle JET portal

The Oracle JET client for the integrated MergeMaster API lives in this folder.
It provides a live dashboard plus dedicated Customers, Cards, Merchants, and
Transactions pages. The client uses the Spring Boot APIs rather than mock data.

## Start it locally

1. Run the integrated Spring Boot application from the repository root with Java 17:

   ```powershell
   $env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot'
   $env:Path = "$env:JAVA_HOME\bin;$env:Path"
   $env:ORACLE_DB_URL = 'jdbc:oracle:thin:@//localhost:1521/FREE'
   $env:ORACLE_DB_USERNAME = 'SYSTEM'
   $secure = Read-Host 'Oracle password' -AsSecureString
   $env:ORACLE_DB_PASSWORD = ([pscredential]::new($env:ORACLE_DB_USERNAME, $secure)).GetNetworkCredential().Password
   $mvn = 'C:\Users\Utkarsh\.m2\wrapper\dists\apache-maven-3.9.16\0daed3be3ebd1c706f0e69e8b07c6b73f5cc4ea3dfce72a8d0ec2e849ca2ddb0\bin\mvn.cmd'

   # One-time build, and whenever a backend module changes:
   & $mvn -f .\pom.xml -pl main -am clean install -DskipTests
   if ($LASTEXITCODE -ne 0) { throw 'Backend build failed' }

   # Start only the integrated Spring Boot module:
   & $mvn -f .\main\pom.xml spring-boot:run
   ```

2. In this folder, install dependencies and start the JET dev server:

   ```powershell
   npm.cmd install
   npx.cmd ojet serve web --server-port 8000 --server-only
   ```

3. Open `http://localhost:8000`. The development API target is
   `http://localhost:8080`; the integrated backend allows this origin through
   its CORS configuration.

To use another API host, set `localStorage.mergemaster.apiBaseUrl` in the
browser console and refresh the page.

## Sign in

- **Administrator:** username `admin`, password `admin`. This retains the full
  operations portal.
- **Customer:** enter the customer record's exact name as the username. Existing
  customers start with their customer name as the password, and admins can assign
  a different customer password from the Customers page. Customer access is
  limited to that customer's dashboard and transaction history; it is read-only
  and includes MergeGuide assistance.

The login and role filtering are implemented in the browser for this local
demo. Deploying this outside local development requires server-side
authentication and authorization before customer data should be considered
protected.

## MergeGuide assistant

- **Customer Assistant** can explain card status, purchases and payments, and
  permitted account data such as masked card details, available credit,
  outstanding balance, expiry date, and recent transactions.
- **Admin Assistant** can explain customer, card, merchant, and transaction
  workflows and calculate aggregate daily purchase/payment totals and a top
  purchase merchant from the current portal data.
- Chat is guidance and read-only information only. It never creates a
  purchase, payment, card change, or account change.

## Included safeguards

- New cards can only be issued to an existing customer, and their available
  credit is derived from the limit and outstanding balance.
- Purchases are checked against available credit; payments are checked against
  the current outstanding balance before the request is sent.
- Customer and merchant deletion is blocked in the UI when linked card or
  transaction history would be left behind.
- Card and PAN values are masked in the working lists where practical.
