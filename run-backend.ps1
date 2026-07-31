param(
    [switch]$SkipBuild,
    [string]$OracleUrl = "jdbc:oracle:thin:@//localhost:1521/FREE",
    [string]$OracleUsername = "SYSTEM"
)

$ErrorActionPreference = "Stop"

$javaHome = "C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot"
$cachedMaven = "C:\Users\Utkarsh\.m2\wrapper\dists\apache-maven-3.9.16\0daed3be3ebd1c706f0e69e8b07c6b73f5cc4ea3dfce72a8d0ec2e849ca2ddb0\bin\mvn.cmd"

if (-not (Test-Path $javaHome)) {
    throw "Java 17 was not found at $javaHome"
}

$env:JAVA_HOME = $javaHome
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
$env:ORACLE_DB_URL = $OracleUrl
$env:ORACLE_DB_USERNAME = $OracleUsername

if ([string]::IsNullOrWhiteSpace($env:ORACLE_DB_PASSWORD)) {
    $securePassword = Read-Host "Oracle password" -AsSecureString
    $env:ORACLE_DB_PASSWORD = ([pscredential]::new($OracleUsername, $securePassword)).GetNetworkCredential().Password
}

$mavenCommand = Get-Command mvn.cmd -ErrorAction SilentlyContinue
if ($mavenCommand) {
    $maven = $mavenCommand.Source
} elseif (Test-Path $cachedMaven) {
    $maven = $cachedMaven
} else {
    throw "Maven was not found. Install Maven or restore the cached Maven wrapper distribution."
}

if (-not $SkipBuild) {
    & $maven -f .\pom.xml -pl main -am clean install -DskipTests
    if ($LASTEXITCODE -ne 0) {
        throw "Backend build failed"
    }
}

& $maven -f .\main\pom.xml spring-boot:run
