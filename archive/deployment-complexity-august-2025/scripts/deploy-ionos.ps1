# IONOS VPS Deployment Script for Vibe Booking Platform
# Optimized for Windows development to Linux VPS deployment

param(
    [Parameter(Mandatory=$false)]
    [string]$ServerIP = "",
    
    [Parameter(Mandatory=$false)]
    [string]$ServerUser = "root",
    
    [Parameter(Mandatory=$false)]
    [string]$Domain = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$FirstDeploy = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$ProductionDeploy = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTests = $false
)

Write-Host "🚀 IONOS VPS Deployment Script for Vibe Booking Platform" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Configuration validation
if (-not $ServerIP) {
    Write-Host "❌ Error: ServerIP parameter is required" -ForegroundColor Red
    Write-Host "Usage: .\deploy-ionos.ps1 -ServerIP '1.2.3.4' -Domain 'yourdomain.com'" -ForegroundColor Yellow
    exit 1
}

if (-not $Domain) {
    Write-Host "❌ Error: Domain parameter is required" -ForegroundColor Red
    Write-Host "Usage: .\deploy-ionos.ps1 -ServerIP '1.2.3.4' -Domain 'yourdomain.com'" -ForegroundColor Yellow
    exit 1
}

# Environment validation
Write-Host "🔍 Validating deployment environment..." -ForegroundColor Yellow

# Check if required tools are installed
$tools = @('ssh', 'scp', 'npm', 'node')
foreach ($tool in $tools) {
    if (!(Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Error: $tool is not installed or not in PATH" -ForegroundColor Red
        exit 1
    }
}

# Validate project structure
$requiredPaths = @(
    "package.json",
    "backend\package.json", 
    "src\App.tsx",
    "backend\src\server.ts"
)

foreach ($path in $requiredPaths) {
    if (!(Test-Path $path)) {
        Write-Host "❌ Error: Required file missing: $path" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Environment validation passed" -ForegroundColor Green

# Pre-deployment checks
if (-not $SkipTests) {
    Write-Host "🧪 Running pre-deployment tests..." -ForegroundColor Yellow
    
    # Frontend type checking
    Write-Host "  → TypeScript checking..." -ForegroundColor Cyan
    npm run typecheck
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ TypeScript errors found. Fix before deploying." -ForegroundColor Red
        exit 1
    }
    
    # Linting
    Write-Host "  → ESLint checking..." -ForegroundColor Cyan
    npm run lint
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Linting errors found. Fix before deploying." -ForegroundColor Red
        exit 1
    }
    
    # Backend tests
    Write-Host "  → Backend tests..." -ForegroundColor Cyan
    Set-Location backend
    npm test
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Backend tests failed. Fix before deploying." -ForegroundColor Red
        Set-Location ..
        exit 1
    }
    Set-Location ..
    
    Write-Host "✅ Pre-deployment tests passed" -ForegroundColor Green
}

# Build production assets
Write-Host "🔨 Building production assets..." -ForegroundColor Yellow

# Frontend build
Write-Host "  → Building React frontend..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
    exit 1
}

# Backend build
Write-Host "  → Building Node.js backend..." -ForegroundColor Cyan
Set-Location backend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend build failed" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..

Write-Host "✅ Build completed successfully" -ForegroundColor Green

# Server preparation (first deploy only)
if ($FirstDeploy) {
    Write-Host "🔧 Setting up IONOS VPS for first deployment..." -ForegroundColor Yellow
    
    # Create server setup script
    $setupScript = @"
#!/bin/bash
echo "🔧 Setting up IONOS VPS for Vibe Booking Platform..."

# Update system
apt update && apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install PM2 globally
npm install -g pm2

# Install nginx
apt install -y nginx

# Create application directories
mkdir -p D:/vibe-booking/database
mkdir -p D:/vibe-booking/backups
mkdir -p /var/log/vibe-booking

# Create vibe-booking user
useradd -r -s /bin/false vibe-booking
chown -R vibe-booking:vibe-booking D:/vibe-booking/
chown -R vibe-booking:vibe-booking /var/log/vibe-booking

# Set up logrotate
cat > /etc/logrotate.d/vibe-booking << EOF
/var/log/vibe-booking/*.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    create 0644 vibe-booking vibe-booking
}
EOF

# Configure firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3001/tcp
ufw --force enable

echo "✅ IONOS VPS setup completed"
"@

    # Upload and execute setup script
    $setupScript | ssh $ServerUser@$ServerIP 'cat > /tmp/setup-vps.sh && chmod +x /tmp/setup-vps.sh && sudo /tmp/setup-vps.sh'
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Server setup failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ IONOS VPS setup completed" -ForegroundColor Green
}

# Deploy application files
Write-Host "📤 Deploying application to IONOS VPS..." -ForegroundColor Yellow

# Create deployment directory structure on server
ssh $ServerUser@$ServerIP "mkdir -p /var/www/$Domain/{frontend,backend,backups}"

# Upload frontend files
Write-Host "  → Uploading frontend files..." -ForegroundColor Cyan
scp -r dist/* $ServerUser@${ServerIP}:/var/www/$Domain/frontend/

# Upload backend files
Write-Host "  → Uploading backend files..." -ForegroundColor Cyan
scp -r backend/dist/* $ServerUser@${ServerIP}:/var/www/$Domain/backend/
scp backend/package.json $ServerUser@${ServerIP}:/var/www/$Domain/backend/

# Install backend dependencies on server
Write-Host "  → Installing backend dependencies..." -ForegroundColor Cyan
ssh $ServerUser@$ServerIP "cd /var/www/$Domain/backend && npm ci --production"

# Configure nginx
Write-Host "🔧 Configuring nginx..." -ForegroundColor Yellow

$nginxConfig = @"
server {
    listen 80;
    server_name $Domain www.$Domain;
    
    # Redirect HTTP to HTTPS (after SSL setup)
    # return 301 https://`$server_name`$request_uri;
    
    # Frontend - React SPA
    location / {
        root /var/www/$Domain/frontend;
        try_files `$uri `$uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_cache_bypass `$http_upgrade;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001/api/health;
        access_log off;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
"@

# Upload nginx configuration
$nginxConfig | ssh $ServerUser@$ServerIP "cat > /etc/nginx/sites-available/$Domain"
ssh $ServerUser@$ServerIP "ln -sf /etc/nginx/sites-available/$Domain /etc/nginx/sites-enabled/$Domain"
ssh $ServerUser@$ServerIP "nginx -t && systemctl reload nginx"

# Configure PM2 ecosystem
Write-Host "🔧 Configuring PM2 process manager..." -ForegroundColor Yellow

$pm2Config = @"
{
  "apps": [{
    "name": "vibe-booking",
    "script": "/var/www/$Domain/backend/server.js",
    "instances": "max",
    "exec_mode": "cluster",
    "env": {
      "NODE_ENV": "production",
      "PORT": "3001",
      "LOCAL_SQLITE": "true",
      "DATABASE_PATH": "D:/vibe-booking/database/database.sqlite"
    },
    "error_file": "/var/log/vibe-booking/error.log",
    "out_file": "/var/log/vibe-booking/out.log",
    "log_file": "/var/log/vibe-booking/combined.log",
    "time": true,
    "max_restarts": 5,
    "restart_delay": 5000
  }]
}
"@

$pm2Config | ssh $ServerUser@$ServerIP "cat > /var/www/$Domain/ecosystem.config.json"

# Start/restart application
Write-Host "🚀 Starting application with PM2..." -ForegroundColor Yellow
ssh $ServerUser@$ServerIP "cd /var/www/$Domain && pm2 start ecosystem.config.json && pm2 save && pm2 startup"

# Set up database
Write-Host "🗄️ Setting up SQLite database..." -ForegroundColor Yellow
ssh $ServerUser@$ServerIP "cd /var/www/$Domain/backend && LOCAL_SQLITE=true npm run db:setup:local"

# Set up SSL certificate (Let's Encrypt)
if ($ProductionDeploy) {
    Write-Host "🔐 Setting up SSL certificate..." -ForegroundColor Yellow
    
    $sslSetup = @"
#!/bin/bash
# Install certbot
apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
certbot --nginx -d $Domain -d www.$Domain --non-interactive --agree-tos --email admin@$Domain

# Set up automatic renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
"@

    $sslSetup | ssh $ServerUser@$ServerIP 'cat > /tmp/setup-ssl.sh && chmod +x /tmp/setup-ssl.sh && sudo /tmp/setup-ssl.sh'
    
    Write-Host "✅ SSL certificate installed" -ForegroundColor Green
}

# Post-deployment verification
Write-Host "🔍 Verifying deployment..." -ForegroundColor Yellow

# Check if services are running
ssh $ServerUser@$ServerIP "systemctl status nginx --no-pager"
ssh $ServerUser@$ServerIP "pm2 status"

# Health check
Write-Host "  → Testing API health endpoint..." -ForegroundColor Cyan
$healthCheck = ssh $ServerUser@$ServerIP "curl -f http://localhost:3001/api/health"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ API health check passed" -ForegroundColor Green
} else {
    Write-Host "❌ API health check failed" -ForegroundColor Red
}

# Test frontend
Write-Host "  → Testing frontend access..." -ForegroundColor Cyan
$frontendCheck = ssh $ServerUser@$ServerIP "curl -f http://localhost/"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend access test passed" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend access test failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 IONOS VPS Deployment Completed!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host "🌐 Website: http://$Domain" -ForegroundColor Cyan
Write-Host "🔧 Admin Panel: https://$ServerIP:8443 (Plesk)" -ForegroundColor Cyan
Write-Host "📊 PM2 Monitoring: ssh $ServerUser@$ServerIP 'pm2 monit'" -ForegroundColor Cyan
Write-Host "📝 Logs: ssh $ServerUser@$ServerIP 'pm2 logs vibe-booking'" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Point your domain DNS to $ServerIP" -ForegroundColor White
Write-Host "2. Configure your environment variables in PM2" -ForegroundColor White
Write-Host "3. Set up monitoring and backups" -ForegroundColor White
Write-Host "4. Test payment processing in production" -ForegroundColor White
Write-Host "5. Launch marketing campaigns!" -ForegroundColor White

# Save deployment info
$deploymentInfo = @"
IONOS VPS Deployment Information
================================
Deployment Date: $(Get-Date)
Server IP: $ServerIP
Domain: $Domain
SSL Enabled: $ProductionDeploy

Application Details:
- Frontend: /var/www/$Domain/frontend/
- Backend: /var/www/$Domain/backend/
- Database: /var/lib/vibe-booking/database.sqlite
- Logs: /var/log/vibe-booking/
- PM2 Config: /var/www/$Domain/ecosystem.config.json

Service Management:
- Nginx: systemctl [start|stop|restart|status] nginx
- PM2: pm2 [start|stop|restart|status|logs] vibe-booking
- SSL Renewal: certbot renew

Monitoring URLs:
- Health Check: http://$Domain/health
- API Status: http://$Domain/api/health
- PM2 Web: pm2 web (port 9615)
"@

$deploymentInfo | Out-File -FilePath "deployment-info-$(Get-Date -Format 'yyyy-MM-dd').txt" -Encoding UTF8

Write-Host "📄 Deployment information saved to deployment-info-$(Get-Date -Format 'yyyy-MM-dd').txt" -ForegroundColor Cyan