# IONOS VPS Deployment Guide for Vibe Booking Platform

Complete step-by-step guide to deploy your luxury hotel booking platform to IONOS VPS.

## 🎯 Overview

Your platform is production-ready and optimized for IONOS VPS deployment with:
- **Database**: SQLite on D: drive for performance
- **Security**: JWT authentication, IP whitelisting, SSL certificates
- **Payments**: Square integration with webhook verification
- **Monitoring**: Comprehensive logging and error tracking
- **Compliance**: GDPR privacy policy, terms of service, cookie consent

## 💰 IONOS VPS Pricing & Plan Selection

### Recommended: VPS Linux L - $6/month
- **2 vCPU cores** (sufficient for hotel booking traffic)
- **4 GB RAM** (handles concurrent users and database)
- **80 GB SSD NVMe storage** (fast SQLite performance)
- **Unlimited traffic** up to 1 Gbit/s
- **DDoS protection** included
- **Free Plesk license** for easy management
- **24/7 support**

**Perfect for your production hotel booking platform with room to scale.**

## 📋 Pre-Deployment Checklist

### 1. Test Your Deployment Locally
```powershell
# Run comprehensive deployment test
.\scripts\test-ionos-deployment.ps1

# Test with build process
.\scripts\test-ionos-deployment.ps1 -SkipBuild:$false

# Quick validation only
.\scripts\test-ionos-deployment.ps1 -TestOnly
```

### 2. Prepare Production Environment Variables
Copy `.env.ionos.example` and fill in your production values:
- **SENDGRID_API_KEY**: Email service for booking confirmations
- **OPENAI_API_KEY**: AI-powered hotel search
- **LITEAPI_KEY**: Real hotel data integration
- **SQUARE_ACCESS_TOKEN**: Payment processing (production)
- **SENTRY_DSN**: Error monitoring
- **ADMIN_IPS**: Your IP address for admin access

### 3. Secure Your Secrets
Generate new JWT secrets:
```powershell
# Generate 3 unique 64-character secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_RESET_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

## 🚀 Step-by-Step Deployment

### Step 1: Purchase IONOS VPS
1. Go to [IONOS VPS Hosting](https://www.ionos.com/servers/vps)
2. Select **VPS Linux L** ($6/month)
3. Choose **Ubuntu 20.04 LTS** or **Ubuntu 22.04 LTS**
4. Select your preferred data center (US/Europe)
5. Complete purchase and note your server IP address

### Step 2: Purchase Domain (Optional)
1. Purchase domain through IONOS or your preferred registrar
2. If using external registrar, you'll configure DNS later
3. Popular options: `.com`, `.hotel`, `.travel`, `.luxury`

### Step 3: Initial Server Setup (First Deploy)
```powershell
# First deployment - sets up server environment
.\scripts\deploy-ionos.ps1 -ServerIP "YOUR_SERVER_IP" -Domain "yourdomain.com" -FirstDeploy

# Example:
.\scripts\deploy-ionos.ps1 -ServerIP "192.168.1.100" -Domain "vibebooking.com" -FirstDeploy
```

This automatically:
- Updates server packages
- Installs Node.js 18.x
- Installs PM2 process manager
- Installs and configures nginx
- Sets up application directories on D: drive
- Configures firewall and security
- Creates system user and permissions

### Step 4: Full Production Deployment
```powershell
# Production deployment with SSL certificate
.\scripts\deploy-ionos.ps1 -ServerIP "YOUR_SERVER_IP" -Domain "yourdomain.com" -ProductionDeploy

# Example:
.\scripts\deploy-ionos.ps1 -ServerIP "192.168.1.100" -Domain "vibebooking.com" -ProductionDeploy
```

This automatically:
- Runs pre-deployment tests
- Builds frontend and backend
- Uploads files to server
- Configures nginx with your domain
- Sets up PM2 with cluster mode
- Initializes SQLite database on D: drive
- Installs Let's Encrypt SSL certificate
- Starts monitoring and health checks

### Step 5: Configure DNS
Point your domain to your IONOS VPS IP address:

**If domain purchased through IONOS:**
1. Log into IONOS control panel
2. Go to Domains & SSL → Your Domain → DNS
3. Add/modify A records:
   - `@` → Your Server IP
   - `www` → Your Server IP

**If domain purchased elsewhere:**
1. Log into your domain registrar
2. Update nameservers or DNS records:
   - `A record: @ → Your Server IP`
   - `A record: www → Your Server IP`

### Step 6: Verify Deployment
```powershell
# Test your live site
curl https://yourdomain.com/api/health
curl https://yourdomain.com

# Or visit in browser
https://yourdomain.com
```

## 🔧 Post-Deployment Configuration

### Set Up Environment Variables
SSH into your server and configure production environment:
```bash
ssh root@YOUR_SERVER_IP
cd /var/www/yourdomain.com/backend
cp .env.example .env
nano .env  # Edit with your production values
pm2 restart vibe-booking
```

### Configure Production Secrets
Update your `.env` file with production values:
```bash
# Critical: Replace with your actual production keys
SENDGRID_API_KEY=SG.your_production_key
SQUARE_ACCESS_TOKEN=your_production_square_token
OPENAI_API_KEY=sk-your_production_openai_key
LITEAPI_KEY=your_production_liteapi_key
ADMIN_IPS=your.actual.ip.address
```

### Set Up Monitoring
Access your monitoring dashboard:
```bash
# SSH into server
ssh root@YOUR_SERVER_IP

# Check application status
pm2 status
pm2 logs vibe-booking
pm2 monit  # Real-time monitoring

# Check nginx status
systemctl status nginx

# View system resources
htop
df -h  # Check D: drive usage
```

## 📊 Ongoing Management

### Daily Monitoring
- **Health Check**: `https://yourdomain.com/api/health`
- **PM2 Status**: `pm2 status`
- **Logs**: `pm2 logs vibe-booking`
- **System Resources**: `htop`, `df -h`

### Automatic Backups
Your database automatically backs up daily at 2 AM to `D:/vibe-booking/backups/`

### SSL Certificate Renewal
Let's Encrypt certificates auto-renew. Check status:
```bash
certbot certificates
```

### Application Updates
```bash
# SSH into server
ssh root@YOUR_SERVER_IP

# Pull latest code
cd /var/www/yourdomain.com/backend
git pull origin main

# Rebuild and restart
npm run build
pm2 restart vibe-booking
```

## 🛡️ Security Best Practices

### Server Security
- **Firewall**: Only ports 22, 80, 443, 3001 open
- **SSH**: Use key-based authentication, disable password login
- **Updates**: Run `apt update && apt upgrade` weekly
- **Monitoring**: Set up Sentry alerts for errors

### Application Security
- **IP Whitelisting**: Admin endpoints restricted to your IP
- **JWT Secrets**: Strong 64-character production secrets
- **Rate Limiting**: 100 requests per 15 minutes
- **HTTPS**: All traffic encrypted with Let's Encrypt

### Backup Strategy
- **Database**: Daily automated SQLite backups
- **Files**: Weekly full application backups
- **Retention**: 30-day backup retention policy
- **Testing**: Monthly backup restoration tests

## 💡 Performance Optimization

### Database Performance
- **SQLite on D: drive**: Faster I/O performance
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Indexed searches and filters

### Application Performance
- **PM2 Cluster Mode**: Uses all CPU cores
- **nginx Caching**: Static asset caching
- **Gzip Compression**: Reduced bandwidth usage
- **CDN Ready**: Easy CloudFlare integration

### Monitoring & Alerts
- **Sentry Integration**: Real-time error tracking
- **Performance Monitoring**: API response time tracking
- **Business Metrics**: Booking conversion tracking
- **Uptime Monitoring**: Health check endpoints

## 📈 Scaling Options

### Vertical Scaling (Upgrade VPS)
- **VPS Linux XL**: $12/month, 4 vCPU, 8 GB RAM
- **VPS Linux XXL**: $22/month, 6 vCPU, 16 GB RAM

### Horizontal Scaling
- **Load Balancer**: Multiple VPS instances
- **Database**: Upgrade to PostgreSQL cluster
- **CDN**: CloudFlare for global performance

## 🎉 Launch Checklist

- [ ] IONOS VPS purchased and configured
- [ ] Domain purchased and DNS configured
- [ ] SSL certificate installed and working
- [ ] Production environment variables set
- [ ] Payment processing tested in production
- [ ] Email confirmations working
- [ ] Monitoring and alerts configured
- [ ] Backup system verified
- [ ] Security audit completed
- [ ] Performance testing passed

## 📞 Support & Troubleshooting

### Common Issues

**Database Connection Errors:**
```bash
# Check D: drive permissions
ls -la D:/vibe-booking/
chown -R vibe-booking:vibe-booking D:/vibe-booking/
```

**SSL Certificate Issues:**
```bash
# Renew SSL certificate
certbot renew --nginx
```

**High Memory Usage:**
```bash
# Restart PM2 processes
pm2 restart all
pm2 flush  # Clear logs
```

### Support Contacts
- **IONOS Support**: 24/7 technical support included
- **Application Logs**: `/var/log/vibe-booking/`
- **Nginx Logs**: `/var/log/nginx/`
- **PM2 Logs**: `pm2 logs vibe-booking`

## 🚀 Ready to Launch!

Your luxury hotel booking platform is now production-ready on IONOS VPS with:

✅ **Enterprise Security**: JWT authentication, IP whitelisting, SSL encryption  
✅ **Payment Processing**: Square integration with 5% commission  
✅ **Legal Compliance**: GDPR privacy policy, terms of service  
✅ **Performance**: SQLite on D: drive, PM2 clustering, nginx caching  
✅ **Monitoring**: Sentry error tracking, health checks  
✅ **Scalability**: Ready for traffic growth and feature expansion  

**Time to start making money!** 💰

---

*Last updated: August 2025*