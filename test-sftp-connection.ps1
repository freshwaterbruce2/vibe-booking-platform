# test-sftp-connection.ps1 - Test IONOS SFTP Connection
Write-Host "🔧 Testing IONOS SFTP Connection..." -ForegroundColor Cyan

# Load configuration
$config = Get-Content "deploy-config.json" | ConvertFrom-Json

if ($config.ionos.password -eq "YOUR_IONOS_PASSWORD") {
    Write-Host "❌ Please update your IONOS password in deploy-config.json first!" -ForegroundColor Red
    Write-Host "Get it from: IONOS Control Panel > Hosting > SFTP & SSH Access" -ForegroundColor Yellow
    exit 1
}

Write-Host "Testing connection to:" -ForegroundColor Yellow
Write-Host "  Host: $($config.ionos.host)" -ForegroundColor Gray
Write-Host "  Port: $($config.ionos.port)" -ForegroundColor Gray
Write-Host "  User: $($config.ionos.username)" -ForegroundColor Gray

# Create test script
$testScript = @"
open sftp://$($config.ionos.username):$($config.ionos.password)@$($config.ionos.host):$($config.ionos.port)/ -hostkey=* -rawsettings FSProtocol=2
pwd
ls
close
exit
"@

$scriptPath = "$env:TEMP\test_sftp.txt"
$testScript | Out-File -FilePath $scriptPath -Encoding ASCII

# Test connection
& "C:\Program Files (x86)\WinSCP\WinSCP.com" /script="$scriptPath"

Remove-Item $scriptPath

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ SFTP Connection Successful!" -ForegroundColor Green
    Write-Host "You can now run the deployment script." -ForegroundColor Cyan
} else {
    Write-Host "`n❌ SFTP Connection Failed!" -ForegroundColor Red
    Write-Host "Please check your password in deploy-config.json" -ForegroundColor Yellow
}