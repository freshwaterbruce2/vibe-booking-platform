# IONOS VPS + Plesk Deployment Script for Vibe Booking Platform
# Optimized for Plesk-managed hosting environment

param(
    [Parameter(Mandatory=$false)]
    [string]$PleskUrl = "",
    
    [Parameter(Mandatory=$false)]
    [string]$PleskUser = "admin",
    
    [Parameter(Mandatory=$false)]
    [string]$PleskPassword = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Domain = "",
    
    [Parameter(Mandatory=$false)]
    [string]$FtpHost = "",
    
    [Parameter(Mandatory=$false)]
    [string]$FtpUser = "",
    
    [Parameter(Mandatory=$false)]
    [string]$FtpPassword = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$FirstDeploy = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTests = $false
)

Write-Host "🚀 IONOS VPS + Plesk Deployment Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Configuration validation
if (-not $Domain) {
    Write-Host "❌ Error: Domain parameter is required" -ForegroundColor Red
    Write-Host "Usage: .\deploy-ionos-plesk.ps1 -Domain 'yourdomain.com' -PleskUrl 'https://your-server:8443'" -ForegroundColor Yellow
    exit 1
}

if (-not $PleskUrl) {
    Write-Host "❌ Error: PleskUrl parameter is required" -ForegroundColor Red
    Write-Host "Usage: .\deploy-ionos-plesk.ps1 -Domain 'yourdomain.com' -PleskUrl 'https://your-server:8443'" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Deployment Configuration:" -ForegroundColor Yellow
Write-Host "  Domain: $Domain" -ForegroundColor Cyan
Write-Host "  Plesk Panel: $PleskUrl" -ForegroundColor Cyan
Write-Host "  First Deploy: $FirstDeploy" -ForegroundColor Cyan

# Pre-deployment tests (unless skipped)
if (-not $SkipTests) {
    Write-Host "🧪 Running pre-deployment tests..." -ForegroundColor Yellow
    
    # Run the deployment test script
    & ".\scripts\test-ionos-deployment.ps1" -TestOnly
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Pre-deployment tests failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Pre-deployment tests passed" -ForegroundColor Green
}

# Build applications
Write-Host "🔨 Building applications..." -ForegroundColor Yellow

# Build frontend (React static)
Write-Host "  → Building React frontend..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
    exit 1
}

# Verify frontend build
if (Test-Path "dist\index.html") {
    $distSize = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "  ✅ Frontend build successful ($([math]::Round($distSize, 2)) MB)" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend build verification failed - index.html not found" -ForegroundColor Red
    exit 1
}

# Build backend (Node.js)
Write-Host "  → Building Node.js backend..." -ForegroundColor Cyan
Set-Location backend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend build failed" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Verify backend build
if (Test-Path "dist\server.js") {
    Write-Host "  ✅ Backend build successful" -ForegroundColor Green
} else {
    Write-Host "❌ Backend build verification failed - server.js not found" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..

# FTP deployment function
function Deploy-Via-FTP {
    param(
        [string]$SourcePath,
        [string]$TargetPath,
        [string]$Description
    )
    
    Write-Host "  → $Description..." -ForegroundColor Cyan
    
    if (-not $FtpHost -or -not $FtpUser -or -not $FtpPassword) {
        Write-Host "  ⚠️  FTP credentials not provided - showing manual upload instructions" -ForegroundColor Yellow
        Write-Host "    Manual Upload Required:" -ForegroundColor White
        Write-Host "    Source: $SourcePath" -ForegroundColor White
        Write-Host "    Target: $TargetPath" -ForegroundColor White
        Write-Host "    Use Plesk File Manager or FTP client" -ForegroundColor White
        return
    }
    
    try {
        # Create WinSCP script for automated FTP deployment
        $winscpScript = @"
open ftp://${FtpUser}:${FtpPassword}@${FtpHost}
lcd "$SourcePath"
cd $TargetPath
put *
exit
"@
        
        $winscpScript | Out-File -FilePath "temp-ftp-script.txt" -Encoding ASCII
        
        # Check if WinSCP is available
        if (Get-Command "winscp.com" -ErrorAction SilentlyContinue) {
            winscp.com /script=temp-ftp-script.txt
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✅ $Description completed" -ForegroundColor Green
            } else {
                Write-Host "  ❌ $Description failed" -ForegroundColor Red
            }
        } else {
            Write-Host "  ⚠️  WinSCP not found - use manual upload" -ForegroundColor Yellow
            Write-Host "    Install WinSCP or use Plesk File Manager" -ForegroundColor White
        }
        
        # Clean up script file
        if (Test-Path "temp-ftp-script.txt") {
            Remove-Item "temp-ftp-script.txt" -Force
        }
        
    } catch {
        Write-Host "  ❌ FTP deployment error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Deploy frontend to Plesk httpdocs
Write-Host "📤 Deploying frontend to Plesk..." -ForegroundColor Yellow
Deploy-Via-FTP -SourcePath "dist\*" -TargetPath "httpdocs/" -Description "Frontend deployment"

# Deploy backend to Plesk Node.js application
Write-Host "📤 Deploying backend to Plesk..." -ForegroundColor Yellow
Deploy-Via-FTP -SourcePath "backend\*" -TargetPath "api/" -Description "Backend deployment"

# Create Plesk configuration instructions
Write-Host "🔧 Plesk Configuration Instructions..." -ForegroundColor Yellow

$pleskInstructions = @"
==============================================
PLESK CONFIGURATION INSTRUCTIONS
==============================================

1. LOG INTO PLESK PANEL
   → Open: $PleskUrl
   → Username: $PleskUser
   → Password: [Your Plesk Password]

2. CREATE DOMAIN/SUBSCRIPTION
   → Go to: Websites & Domains
   → Click: Add Domain
   → Domain name: $Domain
   → Document root: httpdocs (default)
   → Click: OK

3. ENABLE NODE.JS APPLICATION
   → Go to: Websites & Domains → $Domain
   → Click: Node.js
   → Application mode: Production
   → Application root: api
   → Application startup file: dist/server.js
   → Application URL: /api
   → Node.js version: 18.x
   → Click: Enable Node.js

4. SET ENVIRONMENT VARIABLES
   → In Node.js settings, add these variables:
   
   NODE_ENV = production
   PORT = 3001
   LOCAL_SQLITE = true
   DATABASE_PATH = /var/www/vhosts/$Domain/private/database.sqlite
   
   SENDGRID_API_KEY = [Your SendGrid Key]
   OPENAI_API_KEY = [Your OpenAI Key]
   LITEAPI_KEY = [Your LiteAPI Key]
   
   SQUARE_ACCESS_TOKEN = [Your Square Token]
   SQUARE_APPLICATION_ID = [Your Square App ID]
   SQUARE_LOCATION_ID = [Your Square Location ID]
   SQUARE_WEBHOOK_SIGNATURE_KEY = [Your Square Webhook Key]
   SQUARE_ENVIRONMENT = production
   
   ADMIN_IPS = [Your IP Address]
   SENTRY_DSN = [Your Sentry DSN]

5. CONFIGURE DATABASE
   → SSH into server or use Plesk terminal:
   → cd /var/www/vhosts/$Domain/api
   → npm install --production
   → npm run db:setup:local

6. SET UP SSL CERTIFICATE
   → Go to: Websites & Domains → $Domain
   → Click: SSL/TLS Certificates
   → Click: Get free certificate (Let's Encrypt)
   → Select: Secure the domain and its www subdomain
   → Click: Get it free

7. CONFIGURE NGINX RULES (if needed)
   → Go to: Websites & Domains → $Domain
   → Click: Apache & nginx Settings
   → Add to nginx directives:
   
   location /api/ {
       proxy_pass http://localhost:3001/;
       proxy_http_version 1.1;
       proxy_set_header Upgrade \$http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host \$host;
       proxy_set_header X-Real-IP \$remote_addr;
       proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto \$scheme;
       proxy_cache_bypass \$http_upgrade;
   }

8. START NODE.JS APPLICATION
   → Go back to: Node.js settings
   → Click: NPM install (to install dependencies)
   → Click: Restart app

9. TEST DEPLOYMENT
   → Frontend: https://$Domain
   → Backend API: https://$Domain/api/health
   → Check logs in Node.js section if issues occur

==============================================
"@

$pleskInstructions | Out-File -FilePath "plesk-setup-instructions.txt" -Encoding UTF8
Write-Host "📄 Plesk setup instructions saved to: plesk-setup-instructions.txt" -ForegroundColor Cyan

# Create environment variables template for Plesk
Write-Host "📝 Creating Plesk environment variables template..." -ForegroundColor Yellow

$pleskEnvTemplate = @"
# Plesk Node.js Environment Variables Template
# Copy these to your Plesk Node.js application settings

# === CORE APPLICATION ===
NODE_ENV=production
PORT=3001

# === DATABASE ===
LOCAL_SQLITE=true
DATABASE_PATH=/var/www/vhosts/$Domain/private/database.sqlite

# === JWT SECRETS (GENERATE NEW ONES) ===
JWT_SECRET=05ba3147e30cec7c5c469038478cc2c0d176ddb7a43645daf97d212d3ee0a136
JWT_REFRESH_SECRET=8f2e7b9c1a5d6e4f3c8b7a9e2d1f4c6b8e7a3f5d9c2b6e1a4f8c7b5e3d9a2c6f
JWT_RESET_SECRET=3e7f8c2b9a1d5e6c4f7b8a2e9d3c6f1b5e8a7c4f9d2b6e3a8c1f7b4e9d5c2a6

# === EMAIL SERVICE ===
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.YOUR_SENDGRID_API_KEY_HERE
EMAIL_FROM=bookings@$Domain
EMAIL_FROM_NAME=Vibe Booking

# === API KEYS ===
OPENAI_API_KEY=sk-YOUR_OPENAI_API_KEY_HERE
LITEAPI_KEY=YOUR_PRODUCTION_LITEAPI_KEY_HERE

# === SQUARE PAYMENTS ===
SQUARE_ENVIRONMENT=production
SQUARE_ACCESS_TOKEN=YOUR_PRODUCTION_SQUARE_ACCESS_TOKEN
SQUARE_APPLICATION_ID=YOUR_PRODUCTION_SQUARE_APPLICATION_ID
SQUARE_LOCATION_ID=YOUR_PRODUCTION_SQUARE_LOCATION_ID
SQUARE_WEBHOOK_SIGNATURE_KEY=YOUR_SQUARE_WEBHOOK_SIGNATURE_KEY

# === SECURITY ===
ADMIN_IPS=YOUR_IP_ADDRESS
CORS_ORIGINS=https://$Domain,https://www.$Domain

# === MONITORING ===
SENTRY_DSN=YOUR_SENTRY_DSN_HERE
"@

$pleskEnvTemplate | Out-File -FilePath "plesk-environment-variables.txt" -Encoding UTF8
Write-Host "📄 Environment variables template saved to: plesk-environment-variables.txt" -ForegroundColor Cyan

# Final deployment summary
Write-Host ""
Write-Host "🎉 IONOS VPS + Plesk Deployment Preparation Complete!" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Files prepared for deployment:" -ForegroundColor Cyan
Write-Host "  ✅ Frontend build: dist/" -ForegroundColor Green
Write-Host "  ✅ Backend build: backend/dist/" -ForegroundColor Green
Write-Host "  ✅ Setup instructions: plesk-setup-instructions.txt" -ForegroundColor Green
Write-Host "  ✅ Environment template: plesk-environment-variables.txt" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Upload dist/ contents to Plesk httpdocs/ folder" -ForegroundColor White
Write-Host "2. Upload backend/ contents to Plesk api/ folder" -ForegroundColor White
Write-Host "3. Follow plesk-setup-instructions.txt step by step" -ForegroundColor White
Write-Host "4. Configure environment variables in Plesk Node.js settings" -ForegroundColor White
Write-Host "5. Test your live site at https://$Domain" -ForegroundColor White
Write-Host ""
Write-Host "📊 Plesk Panel Access:" -ForegroundColor Cyan
Write-Host "  URL: $PleskUrl" -ForegroundColor White
Write-Host "  User: $PleskUser" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Your Site URLs:" -ForegroundColor Cyan
Write-Host "  Frontend: https://$Domain" -ForegroundColor White
Write-Host "  Backend API: https://$Domain/api/health" -ForegroundColor White
Write-Host "  Admin Panel: $PleskUrl" -ForegroundColor White
Write-Host ""
Write-Host "💡 Pro Tip: Use Plesk File Manager for easy file uploads!" -ForegroundColor Yellow

# Save deployment summary
$deploymentSummary = @"
IONOS VPS + Plesk Deployment Summary
=====================================
Date: $(Get-Date)
Domain: $Domain
Plesk URL: $PleskUrl

Build Information:
- Frontend: $(if (Test-Path 'dist\index.html') { 'Built successfully' } else { 'Not built' })
- Backend: $(if (Test-Path 'backend\dist\server.js') { 'Built successfully' } else { 'Not built' })

Deployment Status:
- Files prepared for upload
- Plesk configuration instructions created
- Environment variables template created

Manual Steps Required:
1. Upload files via Plesk File Manager or FTP
2. Configure Node.js application in Plesk
3. Set environment variables
4. Enable SSL certificate
5. Test deployment

Support Files:
- plesk-setup-instructions.txt (detailed setup guide)
- plesk-environment-variables.txt (environment template)
"@

$deploymentSummary | Out-File -FilePath "deployment-summary-plesk-$(Get-Date -Format 'yyyy-MM-dd').txt" -Encoding UTF8

Write-Host "📄 Deployment summary saved to: deployment-summary-plesk-$(Get-Date -Format 'yyyy-MM-dd').txt" -ForegroundColor Cyan