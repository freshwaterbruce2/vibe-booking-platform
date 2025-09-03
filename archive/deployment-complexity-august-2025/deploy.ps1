# deploy.ps1 - Automated Deployment Script with SFTP Support
Write-Host "🚀 Starting Vibe Hotel Bookings Deployment..." -ForegroundColor Cyan

$projectRoot = Get-Location

# Load configuration
if (Test-Path "$projectRoot\deploy-config.json") {
    $config = Get-Content "$projectRoot\deploy-config.json" | ConvertFrom-Json
    Write-Host "✅ Configuration loaded from deploy-config.json" -ForegroundColor Green
} else {
    Write-Host "❌ ERROR: deploy-config.json not found!" -ForegroundColor Red
    Write-Host "Please update deploy-config.json with your credentials first." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if credentials are configured
if ($config.ionos.password -eq "YOUR_IONOS_PASSWORD") {
    Write-Host "❌ ERROR: Please update your IONOS password in deploy-config.json" -ForegroundColor Red
    Write-Host "Get it from: IONOS Control Panel > Hosting > SFTP & SSH Access > Show Password" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 1: Deploy Backend to Railway
Write-Host "`n📦 Deploying Backend to Railway..." -ForegroundColor Yellow
Set-Location "$projectRoot\backend"

# Check if Railway is initialized
$railwayCheck = railway status 2>&1
if ($railwayCheck -like "*No project*") {
    Write-Host "Initializing Railway project..." -ForegroundColor Yellow
    railway init --name $config.railway.projectName
}

# Deploy and get URL
railway up --detach
Start-Sleep -Seconds 5

# Get the deployed URL
try {
    $statusJson = railway status --json 2>$null
    if ($statusJson) {
        $status = $statusJson | ConvertFrom-Json
        $railwayUrl = $status.url
    }
} catch {
    Write-Host "Getting Railway URL via alternative method..." -ForegroundColor Gray
}

if (-not $railwayUrl) {
    $railwayUrl = railway open --url 2>$null
}

if (-not $railwayUrl) {
    Write-Host "⚠️  Could not automatically get Railway URL" -ForegroundColor Yellow
    $railwayUrl = Read-Host "Please enter your Railway URL manually"
}

Write-Host "✅ Backend deployed to: $railwayUrl" -ForegroundColor Green

# Step 2: Set Railway Environment Variables
Write-Host "`n🔧 Setting Railway Environment Variables..." -ForegroundColor Yellow
railway variables set NODE_ENV=production
railway variables set CORS_ORIGIN=https://vibehotelbookings.com
railway variables set SQUARE_ACCESS_TOKEN=$($config.square.accessToken)
railway variables set SQUARE_APPLICATION_ID=$($config.square.applicationId)
railway variables set SQUARE_LOCATION_ID=$($config.square.locationId)
railway variables set LITEAPI_API_KEY=$($config.liteapi.apiKey)

Write-Host "✅ Environment variables configured" -ForegroundColor Green

# Step 3: Build Frontend with Backend URL
Write-Host "`n🔨 Building Frontend..." -ForegroundColor Yellow
Set-Location $projectRoot

# Create production env file
@"
VITE_API_URL=$railwayUrl
VITE_SQUARE_APPLICATION_ID=$($config.square.applicationId)
VITE_SQUARE_LOCATION_ID=$($config.square.locationId)
VITE_ENABLE_MOCK_PAYMENTS=false
"@ | Out-File -FilePath ".env.production" -Encoding UTF8

# Build the frontend
npm run build

# Clean up env file
Remove-Item ".env.production" -ErrorAction SilentlyContinue

Write-Host "✅ Frontend built with API URL: $railwayUrl" -ForegroundColor Green

# Step 4: Upload to IONOS using WinSCP with SFTP
Write-Host "`n📤 Uploading to IONOS via SFTP..." -ForegroundColor Yellow
Write-Host "   Host: $($config.ionos.host)" -ForegroundColor Gray
Write-Host "   User: $($config.ionos.username)" -ForegroundColor Gray

# Create WinSCP script for SFTP
$winscpScript = @"
# Connect via SFTP
open sftp://$($config.ionos.username):$($config.ionos.password)@$($config.ionos.host):$($config.ionos.port)/ -hostkey=* -rawsettings FSProtocol=2
option transfer binary
option confirm off
option batch abort

# Navigate to web root (may need adjustment based on IONOS structure)
cd /

# Check if we're in the right directory
pwd

# Clean old files (but keep .htaccess)
rm *.html
rm *.js
rm *.css
rm *.json
rm *.svg
rm *.png
rm *.txt
rm -r assets/

# Upload dist contents
lcd "$projectRoot\dist"
put -resumesupport=off * ./

# Set permissions (SFTP may not support chmod)
# chmod 755 assets/
# chmod 644 *.html
# chmod 644 *.json
# chmod 644 *.js
# chmod 644 *.css

close
exit
"@

# Save script temporarily
$scriptPath = "$env:TEMP\deploy_script.txt"
$winscpScript | Out-File -FilePath $scriptPath -Encoding ASCII

# Execute WinSCP
$winscpPath = "C:\Program Files (x86)\WinSCP\WinSCP.com"
if (Test-Path $winscpPath) {
    Write-Host "Executing WinSCP..." -ForegroundColor Gray
    & $winscpPath /script="$scriptPath" /log="$projectRoot\deploy.log" /loglevel=1
    
    # Check if upload was successful
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Frontend uploaded to IONOS successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Upload completed with warnings (check deploy.log)" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ WinSCP not found at expected location" -ForegroundColor Red
    Write-Host "Please ensure WinSCP is installed" -ForegroundColor Yellow
}

# Clean up
Remove-Item $scriptPath -ErrorAction SilentlyContinue

# Step 5: Verify Deployment
Write-Host "`n🔍 Verifying Deployment..." -ForegroundColor Yellow

# Test backend health
try {
    $backendHealth = Invoke-RestMethod -Uri "$railwayUrl/api/health" -Method Get -ErrorAction Stop
    Write-Host "✅ Backend Status: Online" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend health check: $railwayUrl/api/health" -ForegroundColor Yellow
    Write-Host "   (Backend may still be starting up)" -ForegroundColor Gray
}

# Test frontend
try {
    $frontendResponse = Invoke-WebRequest -Uri "https://vibehotelbookings.com" -UseBasicParsing -ErrorAction Stop
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✅ Frontend Status: Live" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Frontend not responding yet (may take a minute to propagate)" -ForegroundColor Yellow
}

# Final Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🎉 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Frontend: https://vibehotelbookings.com" -ForegroundColor White
Write-Host "Backend:  $railwayUrl" -ForegroundColor White
Write-Host "SFTP Host: $($config.ionos.host)" -ForegroundColor Gray
Write-Host "Time:     $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan

# Save the Railway URL for future reference
$railwayUrl | Out-File -FilePath "$projectRoot\last-railway-url.txt" -Encoding UTF8

# Open the site in browser
Start-Process "https://vibehotelbookings.com"

Write-Host "`nDeployment log saved to: deploy.log" -ForegroundColor Gray
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")