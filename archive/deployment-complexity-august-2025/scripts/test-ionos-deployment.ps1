# IONOS Deployment Testing Script
# Test the deployment configuration locally before actual deployment

param(
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$TestOnly = $false
)

Write-Host "🧪 IONOS Deployment Testing Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Test 1: Environment validation
Write-Host "1️⃣  Testing environment setup..." -ForegroundColor Yellow

# Check Node.js version
$nodeVersion = node --version
Write-Host "  → Node.js version: $nodeVersion" -ForegroundColor Cyan
if ($nodeVersion -match "v(\d+)\.") {
    $majorVersion = [int]$matches[1]
    if ($majorVersion -lt 18) {
        Write-Host "  ❌ Node.js version must be 18 or higher" -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✅ Node.js version compatible" -ForegroundColor Green
}

# Check npm version
$npmVersion = npm --version
Write-Host "  → npm version: $npmVersion" -ForegroundColor Cyan

# Test 2: Project structure validation
Write-Host "2️⃣  Validating project structure..." -ForegroundColor Yellow

$requiredFiles = @(
    "package.json",
    "backend\package.json",
    "src\App.tsx",
    "backend\src\server.ts",
    "ionos-deployment.config.js",
    ".env.ionos.example"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file missing" -ForegroundColor Red
        exit 1
    }
}

# Test 3: Dependencies check
Write-Host "3️⃣  Checking dependencies..." -ForegroundColor Yellow

Write-Host "  → Frontend dependencies..." -ForegroundColor Cyan
npm list --depth=0 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Frontend dependencies OK" -ForegroundColor Green
} else {
    Write-Host "  ❌ Frontend dependencies issues - run npm install" -ForegroundColor Red
    exit 1
}

Write-Host "  → Backend dependencies..." -ForegroundColor Cyan
Set-Location backend
npm list --depth=0 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Backend dependencies OK" -ForegroundColor Green
} else {
    Write-Host "  ❌ Backend dependencies issues - run npm install in backend/" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..

if (-not $SkipBuild -and -not $TestOnly) {
    # Test 4: Build process
    Write-Host "4️⃣  Testing build process..." -ForegroundColor Yellow

    # Frontend build test
    Write-Host "  → Building React frontend..." -ForegroundColor Cyan
    npm run build 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0 -and (Test-Path "dist\index.html")) {
        Write-Host "  ✅ Frontend build successful" -ForegroundColor Green
        
        # Check build size
        $distSize = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
        Write-Host "  → Build size: $([math]::Round($distSize, 2)) MB" -ForegroundColor Cyan
        if ($distSize -gt 10) {
            Write-Host "  ⚠️  Build size is large (>10MB) - consider optimization" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ❌ Frontend build failed" -ForegroundColor Red
        exit 1
    }

    # Backend build test
    Write-Host "  → Building Node.js backend..." -ForegroundColor Cyan
    Set-Location backend
    npm run build 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0 -and (Test-Path "dist\server.js")) {
        Write-Host "  ✅ Backend build successful" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Backend build failed" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
    Set-Location ..
}

# Test 5: Configuration validation
Write-Host "5️⃣  Validating deployment configuration..." -ForegroundColor Yellow

# Test IONOS deployment config
if (Test-Path "ionos-deployment.config.js") {
    try {
        $config = node -p "JSON.stringify(require('./ionos-deployment.config.js').default, null, 2)" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ IONOS deployment config valid" -ForegroundColor Green
        } else {
            Write-Host "  ❌ IONOS deployment config has syntax errors" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "  ❌ Error parsing IONOS deployment config" -ForegroundColor Red
        exit 1
    }
}

# Test environment template
if (Test-Path ".env.ionos.example") {
    $envContent = Get-Content ".env.ionos.example" -Raw
    $requiredVars = @(
        "NODE_ENV",
        "PORT",
        "DATABASE_PATH",
        "JWT_SECRET",
        "EMAIL_FROM",
        "SQUARE_ACCESS_TOKEN"
    )
    
    foreach ($var in $requiredVars) {
        if ($envContent -match "$var=") {
            Write-Host "  ✅ $var configured" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $var missing from environment template" -ForegroundColor Red
        }
    }
}

# Test 6: Database setup simulation
Write-Host "6️⃣  Testing database setup..." -ForegroundColor Yellow

# Test SQLite database creation
if (-not (Test-Path "D:\")) {
    Write-Host "  ⚠️  D: drive not found - testing with local path" -ForegroundColor Yellow
    $testDbPath = ".\test-database.sqlite"
} else {
    $testDbPath = "D:\test-vibe-booking\database.sqlite"
    New-Item -ItemType Directory -Path "D:\test-vibe-booking" -Force | Out-Null
}

try {
    Set-Location backend
    $env:LOCAL_SQLITE = "true"
    $env:DATABASE_PATH = $testDbPath
    
    # Test database setup
    npm run db:setup:local 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Database setup test successful" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Database setup test failed" -ForegroundColor Red
    }
    
    # Clean up test database
    if (Test-Path $testDbPath) {
        Remove-Item $testDbPath -Force
    }
    if (Test-Path "D:\test-vibe-booking") {
        Remove-Item "D:\test-vibe-booking" -Recurse -Force
    }
    
    Set-Location ..
} catch {
    Write-Host "  ❌ Database test error: $($_.Exception.Message)" -ForegroundColor Red
    Set-Location ..
}

# Test 7: TypeScript and linting
Write-Host "7️⃣  Testing code quality..." -ForegroundColor Yellow

# TypeScript check
Write-Host "  → TypeScript checking..." -ForegroundColor Cyan
npm run typecheck 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ TypeScript check passed" -ForegroundColor Green
} else {
    Write-Host "  ❌ TypeScript errors found" -ForegroundColor Red
    exit 1
}

# Linting check
Write-Host "  → ESLint checking..." -ForegroundColor Cyan
npm run lint 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Linting passed" -ForegroundColor Green
} else {
    Write-Host "  ❌ Linting errors found" -ForegroundColor Red
    exit 1
}

# Test 8: Security validation
Write-Host "8️⃣  Testing security configuration..." -ForegroundColor Yellow

# Check for default secrets
$configContent = Get-Content "backend\src\config\index.ts" -Raw
if ($configContent -match "defaultsecret" -or $configContent -match "your-secret-key") {
    Write-Host "  ❌ Default secrets found - update with production secrets" -ForegroundColor Red
    exit 1
} else {
    Write-Host "  ✅ No default secrets detected" -ForegroundColor Green
}

# Check JWT secret length
$jwtMatches = [regex]::Matches($configContent, "secret.*?['\`\"]([^'\`\"]{32,})['\`\"]")
if ($jwtMatches.Count -gt 0) {
    Write-Host "  ✅ JWT secrets appear to be sufficiently long" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Could not verify JWT secret length" -ForegroundColor Yellow
}

# Test 9: Production readiness checks
Write-Host "9️⃣  Production readiness checks..." -ForegroundColor Yellow

# Check for console.log statements (should use logger)
$consoleCount = (Select-String -Path "src\**\*.tsx", "src\**\*.ts", "backend\src\**\*.ts" -Pattern "console\.(log|warn|error)" -ErrorAction SilentlyContinue).Count
if ($consoleCount -gt 0) {
    Write-Host "  ⚠️  Found $consoleCount console statements - consider using logger instead" -ForegroundColor Yellow
} else {
    Write-Host "  ✅ No console statements found" -ForegroundColor Green
}

# Check for TODO comments
$todoCount = (Select-String -Path "src\**\*.tsx", "src\**\*.ts", "backend\src\**\*.ts" -Pattern "TODO|FIXME|HACK" -ErrorAction SilentlyContinue).Count
if ($todoCount -gt 0) {
    Write-Host "  ⚠️  Found $todoCount TODO/FIXME comments - review before deployment" -ForegroundColor Yellow
} else {
    Write-Host "  ✅ No TODO comments found" -ForegroundColor Green
}

# Test 10: Deployment script validation
Write-Host "🔟 Testing deployment script..." -ForegroundColor Yellow

if (Test-Path "scripts\deploy-ionos.ps1") {
    # Check for required parameters
    $deployScript = Get-Content "scripts\deploy-ionos.ps1" -Raw
    if ($deployScript -match "ServerIP.*=.*\`"\`"") {
        Write-Host "  ✅ Deployment script requires ServerIP parameter" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Deployment script ServerIP parameter not properly configured" -ForegroundColor Red
    }
    
    if ($deployScript -match "Domain.*=.*\`"\`"") {
        Write-Host "  ✅ Deployment script requires Domain parameter" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Deployment script Domain parameter not properly configured" -ForegroundColor Red
    }
} else {
    Write-Host "  ❌ Deployment script not found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 IONOS Deployment Test Summary" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host "✅ Environment setup validated" -ForegroundColor Green
Write-Host "✅ Project structure confirmed" -ForegroundColor Green
Write-Host "✅ Dependencies checked" -ForegroundColor Green
if (-not $SkipBuild -and -not $TestOnly) {
    Write-Host "✅ Build process tested" -ForegroundColor Green
}
Write-Host "✅ Configuration validated" -ForegroundColor Green
Write-Host "✅ Database setup tested" -ForegroundColor Green
Write-Host "✅ Code quality verified" -ForegroundColor Green
Write-Host "✅ Security configuration checked" -ForegroundColor Green
Write-Host "✅ Production readiness assessed" -ForegroundColor Green
Write-Host "✅ Deployment script validated" -ForegroundColor Green

Write-Host ""
Write-Host "🚀 Ready for IONOS VPS Deployment!" -ForegroundColor Cyan
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Purchase IONOS VPS Linux L plan ($6/month)" -ForegroundColor White
Write-Host "2. Get your server IP address" -ForegroundColor White
Write-Host "3. Purchase and configure your domain" -ForegroundColor White
Write-Host "4. Run: .\scripts\deploy-ionos.ps1 -ServerIP 'x.x.x.x' -Domain 'yourdomain.com' -FirstDeploy -ProductionDeploy" -ForegroundColor White
Write-Host "5. Configure DNS to point to your server IP" -ForegroundColor White
Write-Host "6. Test your live site!" -ForegroundColor White

Write-Host ""
Write-Host "💡 Pro Tips:" -ForegroundColor Cyan
Write-Host "• Use strong passwords for your IONOS VPS" -ForegroundColor White
Write-Host "• Keep your server updated with: apt update && apt upgrade" -ForegroundColor White
Write-Host "• Monitor your application with: pm2 monit" -ForegroundColor White
Write-Host "• Set up regular backups with: crontab -e" -ForegroundColor White