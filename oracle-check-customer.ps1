param(
    [Parameter(Mandatory = $true)]
    [string]$Email,
    [switch]$DeleteAfterCheck
)

$ErrorActionPreference = "Stop"

$javaHome = "C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot"
$java = Join-Path $javaHome "bin\java.exe"
$ojdbc = "C:\Users\Utkarsh\.m2\repository\com\oracle\database\jdbc\ojdbc11\23.26.2.0.0\ojdbc11-23.26.2.0.0.jar"

if ([string]::IsNullOrWhiteSpace($env:ORACLE_DB_URL)) {
    $env:ORACLE_DB_URL = "jdbc:oracle:thin:@//localhost:1521/FREE"
}
if ([string]::IsNullOrWhiteSpace($env:ORACLE_DB_USERNAME)) {
    $env:ORACLE_DB_USERNAME = "SYSTEM"
}
if ([string]::IsNullOrWhiteSpace($env:ORACLE_DB_PASSWORD)) {
    $securePassword = Read-Host "Oracle password" -AsSecureString
    $env:ORACLE_DB_PASSWORD = ([pscredential]::new($env:ORACLE_DB_USERNAME, $securePassword)).GetNetworkCredential().Password
}

& $java -cp ".\tools;$ojdbc" OracleCustomerProbe $Email $DeleteAfterCheck.IsPresent
