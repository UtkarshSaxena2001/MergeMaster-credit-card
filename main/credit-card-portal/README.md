# MergeMaster Oracle JET portal

The Oracle JET client for the integrated MergeMaster API lives in this folder.
It provides a live dashboard plus dedicated Customers, Cards, Merchants, and
Transactions pages. The client uses the Spring Boot APIs rather than mock data.

## Start it locally

1. Run the integrated Spring Boot application from the repository root with Java 17:

   ```powershell
   $env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot'
   $env:Path = "$env:JAVA_HOME\bin;$env:Path"
   & 'C:\Users\Utkarsh\.m2\wrapper\dists\apache-maven-3.9.16\0daed3be3ebd1c706f0e69e8b07c6b73f5cc4ea3dfce72a8d0ec2e849ca2ddb0\bin\mvn.cmd' -f .\pom.xml spring-boot:run -pl main -am
   ```

2. In this folder, install dependencies and start the JET dev server:

   ```powershell
   npm.cmd install
   ojet.cmd serve --server-port 8000 --server-only
   ```

3. Open `http://localhost:8000`. The development API target is
   `http://localhost:8080`; the integrated backend allows this origin through
   its CORS configuration.

To use another API host, set `localStorage.mergemaster.apiBaseUrl` in the
browser console and refresh the page.

## Included safeguards

- New cards can only be issued to an existing customer, and their available
  credit is derived from the limit and outstanding balance.
- Purchases are checked against available credit; payments are checked against
  the current outstanding balance before the request is sent.
- Customer and merchant deletion is blocked in the UI when linked card or
  transaction history would be left behind.
- Card and PAN values are masked in the working lists where practical.
