# Vibe Booking - Production Launch Checklist

## ✅ Completed Tasks

### 1. Payment Integration (Square)
- ✅ Fixed Square service imports and configuration
- ✅ Configured Square as primary payment provider
- ✅ Updated payment descriptors to "Vibe Booking"
- ✅ Fixed database connection issues in payment services

### 2. Database Configuration
- ✅ Configured database to use D: drive (`D:/vibe-booking.db`)
- ✅ Created comprehensive database migration files
- ✅ Updated all database references to use Vibe Booking

### 3. Environment Configuration
- ✅ Created production environment file with Square settings
- ✅ Updated all references from "Hotel Booking" to "Vibe Booking"
- ✅ Configured proper database paths for D: drive

## 🚀 Quick Launch Steps

### Step 1: Configure Environment Variables
1. Copy `.env.production` to `.env`
2. Replace all placeholder values:
   - `SQUARE_ACCESS_TOKEN`: Your Square production access token
   - `SQUARE_LOCATION_ID`: Your Square location ID
   - `SQUARE_APPLICATION_ID`: Your Square application ID
   - `SQUARE_WEBHOOK_SIGNATURE_KEY`: Your Square webhook signature key
   - `LITEAPI_API_KEY`: Your LiteAPI production key
   - `OPENAI_API_KEY`: Your OpenAI API key
   - Generate secure JWT secrets (64 characters each)

### Step 2: Initialize Database
```bash
cd backend
# Run the migration to create tables on D: drive
sqlite3 D:/vibe-booking.db < src/database/migrations/001_initial_schema.sql
```

### Step 3: Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../
npm install
```

### Step 4: Build for Production
```bash
# Build frontend
npm run build

# Build backend
cd backend
npm run build
```

### Step 5: Start Production Server
```bash
# Start backend server
cd backend
npm run start:prod

# Or use PM2 for process management
pm2 start dist/server.js --name vibe-booking-api
```

## 📱 Square Payment Setup

1. **Square Dashboard Configuration:**
   - Log into Square Dashboard
   - Navigate to Applications
   - Configure webhook endpoints:
     - Payment webhook: `https://api.vibebooking.com/api/payments/webhook/square`
   - Enable webhook events:
     - `payment.updated`
     - `refund.updated`

2. **Test Square Integration:**
   ```bash
   # Use Square sandbox for testing
   SQUARE_ENVIRONMENT=sandbox npm run dev
   ```

## 🔒 Security Checklist

- [ ] Generate cryptographically secure JWT secrets (64+ characters)
- [ ] Configure HTTPS with SSL certificates
- [ ] Set up firewall rules for production server
- [ ] Enable rate limiting
- [ ] Configure CORS for production domains only
- [ ] Set up monitoring and alerting

## 🗄️ Database Location

Your Vibe Booking database will be stored at:
- **Production**: `D:/vibe-booking.db`
- **Backup**: Recommend setting up daily backups to `D:/backups/vibe-booking/`

## 🎯 Next Priority Tasks

1. **Testing Setup** - Implement comprehensive backend tests
2. **Performance Optimization** - Code splitting and bundle optimization
3. **Monitoring** - Deploy Prometheus/Grafana stack
4. **Security Headers** - Configure HTTPS and security headers
5. **PCI DSS Compliance** - Implement remaining PCI DSS 4.0 features

## 📞 Support Contacts

- **Square Support**: https://squareup.com/help
- **LiteAPI Support**: https://liteapi.travel/support
- **Domain/Hosting**: Configure with your provider

## 🌐 Production URLs

- **API**: https://api.vibebooking.com
- **Website**: https://vibebooking.com
- **Admin Panel**: https://admin.vibebooking.com

## 💳 Commission Structure

- **Platform Commission**: 5% of booking amount
- **Automatically calculated and tracked**
- **Commission reports available in admin panel**

---

**Vibe Booking is now configured for production deployment with Square payments and D: drive database storage.**