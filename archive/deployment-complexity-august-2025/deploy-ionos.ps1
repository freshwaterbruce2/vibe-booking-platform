# IONOS Hotel Booking Deployment Script
# Minimal deployment configuration for IONOS PHP Package (10GB, 5 stages, 2GB DB)

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("staging", "production")]
    [string]$Environment = "staging",
    
    [Parameter(Mandatory=$false)]
    [string]$DomainUrl = ""
)

Write-Host "🏨 Vibe Hotel Booking - IONOS Deployment" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow

# Build frontend for production
Write-Host "`n📦 Building frontend..." -ForegroundColor Green
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
    exit 1
}

# Build backend
Write-Host "`n🔧 Building backend..." -ForegroundColor Green
cd backend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend build failed" -ForegroundColor Red
    exit 1
}
cd ..

# Create deployment package
Write-Host "`n📁 Creating deployment package..." -ForegroundColor Green
$deployDir = "ionos-deployment"
if (Test-Path $deployDir) {
    Remove-Item -Recurse -Force $deployDir
}
New-Item -ItemType Directory -Path $deployDir

# Copy frontend build
Copy-Item -Recurse -Path "dist\*" -Destination "$deployDir\"

# Copy backend build and dependencies
New-Item -ItemType Directory -Path "$deployDir\api"
Copy-Item -Recurse -Path "backend\dist\*" -Destination "$deployDir\api\"
Copy-Item -Path "backend\package.json" -Destination "$deployDir\api\"

# Create IONOS-specific configuration
$ionosConfig = @'
{
  "name": "vibe-booking",
  "version": "2.0.0",
  "main": "api/server.js",
  "scripts": {
    "start": "node api/server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
'@

$ionosConfig | Out-File -FilePath "$deployDir\package.json" -Encoding UTF8

# Create .htaccess for frontend routing
$htaccess = @'
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# API routing  
RewriteRule ^api/(.*)$ api/server.js [L]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
'@

$htaccess | Out-File -FilePath "$deployDir\.htaccess" -Encoding UTF8

# Create production environment template
if ($Environment -eq "production") {
    $prodEnv = @'
NODE_ENV=production
PORT=443

# Database (PostgreSQL on IONOS)
LOCAL_SQLITE=false
DATABASE_URL=postgresql://username:password@localhost:5432/hotelbooking

# API URLs
API_BASE_URL=https://your-domain.ionos.space
CORS_ORIGIN=https://your-domain.ionos.space

# External APIs (set your actual keys)
OPENAI_API_KEY=your-openai-key
LITEAPI_API_KEY=your-liteapi-key

# Square Payment (production)
SQUARE_ACCESS_TOKEN=your-square-production-token
SQUARE_APPLICATION_ID=your-square-app-id
SQUARE_ENVIRONMENT=production
SQUARE_LOCATION_ID=your-location-id

# Security
JWT_SECRET=your-secure-jwt-secret-32-chars-min
JWT_REFRESH_SECRET=your-secure-refresh-secret-32-chars-min
JWT_RESET_SECRET=your-secure-reset-secret-32-chars-min

# Email service
EMAIL_PROVIDER=smtp
EMAIL_FROM=noreply@yourdomain.com
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
LOG_LEVEL=info
'@
    
    $prodEnv | Out-File -FilePath "$deployDir\.env" -Encoding UTF8
    Write-Host "✅ Production .env template created (update with your actual values)" -ForegroundColor Yellow
}

Write-Host "`n🚀 Deployment package ready in '$deployDir' folder" -ForegroundColor Green
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Upload contents of '$deployDir' to your IONOS web space" -ForegroundColor White
Write-Host "  2. Update .env with your actual database and API credentials" -ForegroundColor White
Write-Host "  3. Install Node.js dependencies on IONOS server" -ForegroundColor White
Write-Host "  4. Set up PostgreSQL database (2GB available)" -ForegroundColor White

# Display current build size
$buildSize = (Get-ChildItem -Recurse $deployDir | Measure-Object -Property Length -Sum).Sum
$buildSizeMB = [Math]::Round($buildSize / 1MB, 2)
Write-Host "`nTotal deployment size: $buildSizeMB MB (well within 10GB limit)" -ForegroundColor Green