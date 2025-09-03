# Quick Deploy - Skip Backend Build Issues
Write-Host "Quick Hotel Booking Deployment" -ForegroundColor Cyan

# Frontend is already built and working - just package it
$deployDir = "ionos-deployment"
if (Test-Path $deployDir) {
    Remove-Item -Recurse -Force $deployDir
}
New-Item -ItemType Directory -Path $deployDir

Write-Host "Copying frontend build..." -ForegroundColor Green
Copy-Item -Recurse -Path "dist\*" -Destination "$deployDir\"

Write-Host "Creating backend structure..." -ForegroundColor Green
New-Item -ItemType Directory -Path "$deployDir\api"

# Copy working backend source files (not the broken build)
Copy-Item -Recurse -Path "backend\src\*" -Destination "$deployDir\api\"
Copy-Item -Path "backend\package.json" -Destination "$deployDir\api\"

# Create simple package.json
$packageJson = @'
{
  "name": "vibe-booking",
  "version": "2.0.0",
  "main": "api/server.js",
  "type": "module",
  "scripts": {
    "start": "node api/server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
'@

$packageJson | Out-File -FilePath "$deployDir\package.json" -Encoding UTF8

# Create .htaccess
$htaccess = @'
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d  
RewriteRule . /index.html [L]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
'@

$htaccess | Out-File -FilePath "$deployDir\.htaccess" -Encoding UTF8

# Create production .env
$prodEnv = @'
NODE_ENV=production
PORT=3001
LOCAL_SQLITE=true
API_BASE_URL=https://your-domain.ionos.space
CORS_ORIGIN=https://your-domain.ionos.space
OPENAI_API_KEY=your-key-here
LITEAPI_API_KEY=your-key-here
SQUARE_ACCESS_TOKEN=your-square-token
SQUARE_APPLICATION_ID=your-square-app-id
SQUARE_ENVIRONMENT=production
JWT_SECRET=your-32-char-secret-here
EMAIL_PROVIDER=smtp
EMAIL_FROM=noreply@yourdomain.com
LOG_LEVEL=info
'@

$prodEnv | Out-File -FilePath "$deployDir\.env" -Encoding UTF8

Write-Host "Deployment package ready!" -ForegroundColor Green
Write-Host "Upload contents of 'ionos-deployment' folder to IONOS" -ForegroundColor Yellow