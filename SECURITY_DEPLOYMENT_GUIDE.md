# Security Deployment Guide
**Vibe Booking Platform - Production Security Implementation**

## CRITICAL Security Fixes Applied

### ✅ FIXED: Authentication & Authorization
- **Payment route protection**: Authentication middleware properly applied at router level
- **User access validation**: Comprehensive role-based access control implemented
- **Token validation**: JWT tokens validated with user existence and status checks

### ✅ FIXED: CORS Configuration Security
- **Development-only localhost**: CORS localhost access restricted to development environment
- **Production origin validation**: Strict whitelist enforcement for production domains

### ✅ FIXED: SQL Injection Prevention
- **Payment stats queries**: Replaced JavaScript filtering with proper SQL WHERE clauses
- **Parameterized queries**: All database queries use Drizzle ORM parameterization
- **User ID filtering**: Proper SQL-level user access control

### ✅ FIXED: Rate Limiting Coverage
- **Health check protection**: Added rate limiting to prevent health check abuse
- **Multi-tier rate limiting**: Comprehensive protection across all endpoints

### ✅ ENHANCED: Payment Source Validation
- **Square source ID validation**: Added format validation for payment sources
- **Invalid source detection**: Logging and rejection of malformed payment tokens
- **Security logging**: Enhanced audit trail for payment security events

---

## Pre-Deployment Security Checklist

### 1. Environment Configuration (CRITICAL)

#### Generate Secure Secrets
```bash
# Generate JWT secrets (minimum 64 characters)
openssl rand -base64 64  # For JWT_SECRET
openssl rand -base64 64  # For JWT_REFRESH_SECRET
openssl rand -base64 64  # For SESSION_SECRET
```

#### Configure Production Environment Variables
```bash
# Copy the secure template
cp backend/.env.production.secure backend/.env.production

# Edit and replace ALL placeholder values:
# - JWT_SECRET=REPLACE_WITH_SECURE_64_CHARACTER_SECRET_FROM_OPENSSL
# - SQUARE_ACCESS_TOKEN=YOUR_SQUARE_PRODUCTION_ACCESS_TOKEN
# - CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

### 2. SSL/TLS Configuration (CRITICAL)

#### Certificate Requirements
- **Minimum TLS 1.2** (Recommended: TLS 1.3)
- **Valid SSL certificate** from trusted CA
- **HSTS enabled** with 1-year max-age
- **Perfect Forward Secrecy** enabled

#### Web Server Configuration (Nginx/Apache)
```nginx
# Example Nginx configuration
server {
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";
}
```

### 3. Database Security

#### PostgreSQL Security Hardening
```sql
-- Create dedicated application user
CREATE USER vibe_booking_app WITH PASSWORD 'secure_random_password';

-- Grant minimal permissions
GRANT CONNECT ON DATABASE vibehotels TO vibe_booking_app;
GRANT USAGE ON SCHEMA public TO vibe_booking_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO vibe_booking_app;

-- Enable SSL connections
-- In postgresql.conf:
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
```

#### SQLite Security (Alternative)
```bash
# Secure file permissions
chmod 600 /path/to/database.db
chown app:app /path/to/database.db

# Enable WAL mode for better concurrency
sqlite3 database.db "PRAGMA journal_mode=WAL;"
```

### 4. Infrastructure Security

#### Firewall Configuration
```bash
# Allow only necessary ports
ufw allow 22/tcp    # SSH (restrict to specific IPs)
ufw allow 80/tcp    # HTTP (redirect to HTTPS)
ufw allow 443/tcp   # HTTPS
ufw deny 3001/tcp   # Block direct backend access
```

#### Process Security
```bash
# Run application as non-root user
useradd -r -s /bin/false vibe-booking
chown -R vibe-booking:vibe-booking /app

# Use systemd for process management
# /etc/systemd/system/vibe-booking.service
[Unit]
Description=Vibe Booking Platform
After=network.target

[Service]
Type=simple
User=vibe-booking
WorkingDirectory=/app
ExecStart=/usr/bin/node dist/server.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

---

## Monitoring and Alerting Setup

### 1. Security Monitoring (REQUIRED)

#### Log Analysis
```bash
# Set up log rotation
echo "/var/log/vibe-booking/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    create 0644 vibe-booking vibe-booking
}" > /etc/logrotate.d/vibe-booking
```

#### Security Alerts
```javascript
// Example security alert conditions
const securityAlerts = {
  'High rate limit violations': 'More than 10 rate limit violations per minute',
  'Failed authentication attempts': 'More than 5 failed auth attempts from single IP',
  'Payment failures': 'Payment failure rate > 10%',
  'Database connection errors': 'Any database connection failure',
  'SSL certificate expiry': 'Certificate expires within 30 days'
};
```

### 2. Application Performance Monitoring

#### Key Metrics to Monitor
- **Response time percentiles** (p50, p95, p99)
- **Error rates** by endpoint and status code
- **Database connection pool utilization**
- **Memory and CPU usage**
- **Payment success rates**

#### Recommended Tools
- **Sentry**: Error tracking and performance monitoring
- **Datadog/New Relic**: Application performance monitoring
- **Prometheus + Grafana**: Custom metrics and dashboards

---

## Security Testing Requirements

### 1. Pre-Deployment Testing

#### Automated Security Scanning
```bash
# Install and run security scanners
npm audit --audit-level=high
npx snyk test

# OWASP dependency check
dependency-check --project "Vibe Booking" --scan .
```

#### Manual Security Testing
- [ ] **SQL injection testing** on all input parameters
- [ ] **XSS testing** on all form inputs
- [ ] **Authentication bypass attempts**
- [ ] **Payment flow security testing**
- [ ] **CORS policy validation**

### 2. Post-Deployment Verification

#### Penetration Testing Checklist
- [ ] **External network scanning**
- [ ] **Web application security assessment**
- [ ] **Payment processing security review**
- [ ] **Social engineering resistance testing**

---

## Incident Response Plan

### 1. Security Incident Classification

#### Critical (Response: Immediate)
- **Payment data compromise**
- **Authentication system breach**
- **Database access compromise**
- **SSL certificate compromise**

#### High (Response: Within 2 hours)
- **Elevated failed login attempts**
- **Unusual payment patterns**
- **Database performance degradation**
- **Rate limiting bypass attempts**

### 2. Response Procedures

#### Immediate Actions
1. **Assess scope** of security incident
2. **Isolate affected systems** if necessary
3. **Preserve evidence** for forensic analysis
4. **Notify stakeholders** according to severity
5. **Begin containment** and remediation

#### Communication Plan
- **Internal team notification**: Slack/email alerts
- **Customer communication**: Pre-drafted templates ready
- **Regulatory compliance**: PCI-DSS breach notification procedures
- **Law enforcement**: Contact procedures for criminal activity

---

## Compliance Requirements

### PCI-DSS Compliance Checklist
- [ ] **Secure payment processing** (Square handles card data)
- [ ] **Network security** (Firewall, SSL/TLS)
- [ ] **Access control** (Authentication, authorization)
- [ ] **Monitoring** (Logging, alerting)
- [ ] **Information security policy** (Documented procedures)
- [ ] **Regular security testing** (Penetration testing, vulnerability scans)

### GDPR Compliance
- [ ] **Data minimization** (Only collect necessary data)
- [ ] **Consent management** (Clear privacy policy)
- [ ] **Right to deletion** (Data purge procedures)
- [ ] **Data portability** (Export user data capability)
- [ ] **Breach notification** (72-hour reporting requirement)

---

## Maintenance and Updates

### 1. Security Update Schedule

#### Daily
- [ ] Monitor security alerts and logs
- [ ] Review rate limiting and blocking reports
- [ ] Check SSL certificate status

#### Weekly
- [ ] Review access logs for anomalies
- [ ] Update security monitoring dashboards
- [ ] Verify backup integrity

#### Monthly
- [ ] Security dependency updates
- [ ] Security scan and vulnerability assessment
- [ ] Access control review and cleanup
- [ ] Incident response plan testing

#### Quarterly
- [ ] Penetration testing
- [ ] Security policy review and updates
- [ ] Disaster recovery testing
- [ ] Compliance audit preparation

### 2. Emergency Procedures

#### Security Hotfixes
```bash
# Emergency deployment process
git checkout -b security-hotfix-$(date +%Y%m%d)
# Apply security fix
git commit -m "SECURITY: Fix critical vulnerability"
# Deploy immediately to production
```

#### System Compromise Response
1. **Immediate isolation** of affected systems
2. **Evidence preservation** for forensic analysis
3. **Emergency communication** to stakeholders
4. **Coordinated recovery** with security team
5. **Post-incident review** and improvements

---

## Contact Information

### Security Team
- **Security Lead**: security@company.com
- **Incident Response**: incident@company.com
- **Emergency Hotline**: +1-XXX-XXX-XXXX

### External Partners
- **Payment Processor**: Square Support
- **SSL Certificate Authority**: Certificate provider support
- **Penetration Testing**: External security consultants
- **Legal Counsel**: Legal team for compliance issues

---

## Deployment Approval

Before deploying to production, ensure ALL items in this checklist are completed and verified by the security team.

**Security Team Approval**: _________________ Date: _________

**Operations Team Approval**: _________________ Date: _________

**Final Deployment Authorization**: _________________ Date: _________

---

**Remember**: Security is an ongoing process, not a one-time implementation. Regular monitoring, testing, and updates are essential for maintaining a secure production environment.