# IONOS + Plesk Complete Deployment Guide
## Vibe Booking Platform - Production Ready

Complete step-by-step plan to deploy your luxury hotel booking platform using IONOS VPS with Plesk management.

## 🎯 DEPLOYMENT STRATEGY OVERVIEW

**ARCHITECTURE:**
- **Frontend**: React build → Plesk `httpdocs/` (static hosting)
- **Backend**: Node.js app → Plesk Node.js Extension (managed process)
- **Database**: SQLite on D: drive (`/var/www/vhosts/domain.com/private/`)
- **Management**: Plesk Panel for easy administration
- **SSL**: Let's Encrypt via Plesk (free, auto-renewing)

## 📋 STEP-BY-STEP EXECUTION PLAN

### PHASE 1: PURCHASE & INITIAL SETUP (30 minutes)

#### Step 1.1: Purchase IONOS VPS + Plesk
1. **Go to**: [IONOS VPS Hosting](https://www.ionos.com/servers/vps)
2. **Select**: VPS Linux L ($6/month)
   - 2 vCPU cores
   - 4 GB RAM
   - 80 GB SSD NVMe storage
   - Unlimited traffic
3. **Choose**: Ubuntu 22.04 LTS
4. **Add**: Plesk Web Admin license (+$10/month)
5. **Complete purchase** and note server IP address

#### Step 1.2: Install Plesk on VPS
```bash
# SSH into your new VPS
ssh root@YOUR_SERVER_IP

# Install Plesk (automatic installation)
sh <(curl https://autoinstall.plesk.com/one-click-installer || wget -O - https://autoinstall.plesk.com/one-click-installer)

# Note: Installation takes 15-20 minutes
# You'll receive Plesk admin credentials via email
```

#### Step 1.3: Purchase Domain (if needed)
- **Option A**: Through IONOS (integrated DNS management)
- **Option B**: External registrar (configure DNS later)
- **Recommended domains**: `yourbrand.com`, `hotelbooking.com`, `vibetravel.com`

### PHASE 2: BUILD & PREPARE DEPLOYMENT (15 minutes)

#### Step 2.1: Test Deployment Readiness
```powershell
# Run comprehensive deployment test
.\scripts\test-ionos-deployment.ps1

# Should show all green checkmarks ✅
```

#### Step 2.2: Build Applications for Production
```powershell
# Execute the Plesk deployment script
.\scripts\deploy-ionos-plesk.ps1 -Domain "yourdomain.com" -PleskUrl "https://YOUR_SERVER_IP:8443"

# This creates:
# - Built frontend in dist/
# - Built backend in backend/dist/
# - plesk-setup-instructions.txt
# - plesk-environment-variables.txt
```

### PHASE 3: PLESK CONFIGURATION (45 minutes)

#### Step 3.1: Access Plesk Panel
1. **Open**: `https://YOUR_SERVER_IP:8443`
2. **Login** with credentials from email
3. **Accept** license agreement
4. **Complete** initial setup wizard

#### Step 3.2: Create Domain & Hosting
1. **Go to**: `Websites & Domains`
2. **Click**: `Add Domain`
3. **Enter**: `yourdomain.com`
4. **Document root**: `httpdocs` (default)
5. **Click**: `OK`

#### Step 3.3: Upload Frontend Files
1. **Go to**: `Websites & Domains → yourdomain.com`
2. **Click**: `File Manager`
3. **Navigate**: to `httpdocs/` folder
4. **Upload**: all files from your `dist/` folder
5. **Extract**: if uploaded as ZIP

#### Step 3.4: Set Up Node.js Backend
1. **Go to**: `Websites & Domains → yourdomain.com`
2. **Click**: `Node.js`
3. **Configure**:
   - Application mode: `Production`
   - Application root: `api`
   - Application startup file: `dist/server.js`
   - Application URL: `/api`
   - Node.js version: `18.x`
4. **Click**: `Enable Node.js`

#### Step 3.5: Upload Backend Files
1. **In File Manager**, create `api/` folder
2. **Upload** all files from your `backend/` folder to `api/`
3. **Ensure** `dist/server.js` exists in `api/dist/`

#### Step 3.6: Install Backend Dependencies
1. **In Node.js settings**, click `NPM install`
2. **Wait** for dependencies to install
3. **Check** for any error messages

### PHASE 4: ENVIRONMENT CONFIGURATION (30 minutes)

#### Step 4.1: Set Environment Variables
In Plesk Node.js settings, add these environment variables:

**Core Settings:**
```
NODE_ENV = production
PORT = 3001
LOCAL_SQLITE = true
DATABASE_PATH = /var/www/vhosts/yourdomain.com/private/database.sqlite
```

**JWT Secrets (generate new ones):**
```powershell
# Generate in PowerShell:
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_RESET_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

**API Keys:**
```
SENDGRID_API_KEY = SG.your_sendgrid_api_key
OPENAI_API_KEY = sk-your_openai_api_key
LITEAPI_KEY = your_liteapi_key
```

**Square Payments:**
```
SQUARE_ENVIRONMENT = production
SQUARE_ACCESS_TOKEN = your_square_access_token
SQUARE_APPLICATION_ID = your_square_app_id
SQUARE_LOCATION_ID = your_square_location_id
SQUARE_WEBHOOK_SIGNATURE_KEY = your_webhook_key
```

**Security:**
```
ADMIN_IPS = your.ip.address
CORS_ORIGINS = https://yourdomain.com,https://www.yourdomain.com
```

#### Step 4.2: Initialize Database
1. **Go to**: Plesk Node.js settings
2. **Click**: `Open in terminal` or SSH to server
3. **Navigate**: `cd /var/www/vhosts/yourdomain.com/api`
4. **Run**: `npm run db:setup:local`
5. **Verify**: Database created in `private/` folder

#### Step 4.3: Configure SSL Certificate
1. **Go to**: `Websites & Domains → yourdomain.com`
2. **Click**: `SSL/TLS Certificates`
3. **Click**: `Get free certificate (Let's Encrypt)`
4. **Select**: Domain + www subdomain
5. **Click**: `Get it free`
6. **Enable**: `Redirect from HTTP to HTTPS`

### PHASE 5: DNS & DOMAIN SETUP (15 minutes)

#### Step 5.1: Configure DNS Records
**If domain through IONOS:**
1. **Go to**: IONOS Control Panel → Domains
2. **Click**: Your domain → DNS
3. **Set A records**:
   - `@` → Your Server IP
   - `www` → Your Server IP

**If external domain:**
1. **Login** to your domain registrar
2. **Update DNS records**:
   - `A record: @ → Your Server IP`
   - `A record: www → Your Server IP`

#### Step 5.2: Configure Nginx Proxy (Optional)
If API calls need special routing:
1. **Go to**: `Websites & Domains → yourdomain.com`
2. **Click**: `Apache & nginx Settings`
3. **Add to nginx directives**:
```nginx
location /api/ {
    proxy_pass http://localhost:3001/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

### PHASE 6: TESTING & LAUNCH (30 minutes)

#### Step 6.1: Start Node.js Application
1. **Go to**: Node.js settings
2. **Click**: `Restart app`
3. **Check**: Application status shows "Running"
4. **Review**: Logs for any errors

#### Step 6.2: Test All Functionality
```bash
# Test frontend
curl https://yourdomain.com

# Test backend API
curl https://yourdomain.com/api/health

# Test database connection
curl https://yourdomain.com/api/health/db
```

**Browser Testing:**
1. **Visit**: `https://yourdomain.com`
2. **Test**: Hotel search functionality
3. **Test**: Booking flow (use test credit card)
4. **Test**: Payment processing
5. **Test**: Email confirmations

#### Step 6.3: Performance & Security Verification
1. **SSL Test**: [SSL Labs Test](https://www.ssllabs.com/ssltest/)
2. **Performance**: [GTmetrix](https://gtmetrix.com/)
3. **Security**: [Security Headers](https://securityheaders.com/)

### PHASE 7: MONITORING & OPTIMIZATION (15 minutes)

#### Step 7.1: Set Up Monitoring
1. **Plesk Monitoring**: Enable resource monitoring
2. **Sentry**: Configure error tracking with your DSN
3. **Uptime Monitoring**: Set up external uptime checks

#### Step 7.2: Configure Backups
1. **Go to**: `Backup Manager` in Plesk
2. **Create**: Backup schedule (daily)
3. **Include**: Website files, databases, mail
4. **Retention**: 30 days

#### Step 7.3: Performance Optimization
1. **Enable**: Gzip compression in Plesk
2. **Configure**: Browser caching
3. **Optimize**: Static file delivery
4. **Monitor**: Resource usage

## 🎉 LAUNCH CHECKLIST

- [ ] **IONOS VPS** purchased and Plesk installed
- [ ] **Domain** purchased and DNS configured
- [ ] **Frontend** uploaded to httpdocs/
- [ ] **Backend** uploaded and Node.js configured
- [ ] **Environment variables** set in Plesk
- [ ] **Database** initialized and working
- [ ] **SSL certificate** installed and active
- [ ] **API endpoints** responding correctly
- [ ] **Payment processing** tested in production
- [ ] **Email confirmations** working
- [ ] **Monitoring** and backups configured
- [ ] **Performance** tests passed
- [ ] **Security** audit completed

## 📊 EXPECTED TIMELINE

| Phase | Duration | Tasks |
|-------|----------|--------|
| 1. Purchase & Setup | 30 min | VPS purchase, Plesk installation |
| 2. Build & Prepare | 15 min | Local builds, file preparation |
| 3. Plesk Configuration | 45 min | Domain setup, file uploads |
| 4. Environment Config | 30 min | Variables, database, SSL |
| 5. DNS Setup | 15 min | Domain configuration |
| 6. Testing & Launch | 30 min | Comprehensive testing |
| 7. Monitoring | 15 min | Backups, monitoring setup |
| **TOTAL** | **3 hours** | **Complete production deployment** |

## 💰 TOTAL COST BREAKDOWN

- **IONOS VPS Linux L**: $6/month
- **Plesk Web Admin License**: $10/month
- **Domain**: $10-15/year (if new)
- **SSL Certificate**: FREE (Let's Encrypt)
- **Total Monthly**: $16/month for professional hosting

## 🚀 POST-LAUNCH REVENUE OPTIMIZATION

1. **Payment Processing**: 5% platform commission active
2. **SEO Optimization**: Submit to search engines
3. **Marketing Integration**: Google Ads, Facebook Pixel
4. **Analytics**: Google Analytics, conversion tracking
5. **A/B Testing**: Landing page optimization
6. **Email Marketing**: Customer retention campaigns

## 📞 SUPPORT & TROUBLESHOOTING

**Common Issues & Solutions:**

**Node.js app won't start:**
- Check environment variables
- Verify dist/server.js exists
- Review logs in Plesk Node.js settings

**Database connection errors:**
- Ensure private/ folder permissions
- Check DATABASE_PATH in environment
- Verify SQLite file creation

**SSL certificate issues:**
- Wait 10-15 minutes after DNS changes
- Use Let's Encrypt staging for testing
- Check domain validation

**API calls failing:**
- Verify nginx proxy configuration
- Check CORS origins setting
- Review firewall/security settings

## 🎯 SUCCESS METRICS

Your platform will be ready to generate revenue with:
- ✅ **99.9% Uptime** (Plesk + IONOS reliability)
- ✅ **< 2 second page load** (optimized builds)
- ✅ **PCI Compliance** (Square payments)
- ✅ **GDPR Compliance** (privacy controls)
- ✅ **Enterprise Security** (JWT + SSL)

**READY TO MAKE MONEY!** 💰

---
*Your luxury hotel booking platform deployment plan - August 2025*