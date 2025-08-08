# Vibe Booking - Project Structure

## 📁 Directory Structure

```
vibe-booking/
├── src/                    # React 18 + TypeScript frontend
│   ├── components/         # Reusable UI components
│   ├── pages/              # Page components
│   ├── store/              # Zustand state management
│   ├── services/           # API service layer
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript definitions
│   └── utils/              # Utility functions
│
├── backend/                # TypeScript + Express.js backend
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── database/       # Database schemas and migrations
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic services
│   │   └── utils/          # Backend utilities
│   └── data/               # SQLite database location (D:/vibe-booking.db in production)
│
├── legacy/                 # Legacy vanilla JS implementation (reference)
│   └── vanilla-js-implementation/
│
├── docs/                   # Organized documentation
│   ├── api/                # API documentation
│   ├── deployment/         # Deployment guides
│   ├── development/        # Development documentation
│   └── security/           # Security documentation
│
├── deployment/             # Kubernetes and Docker configurations
│   ├── kubernetes/         # K8s manifests
│   ├── monitoring/         # Prometheus/Grafana configs
│   └── scripts/            # Deployment scripts
│
├── scripts/                # Utility scripts
├── tests/                  # E2E tests (Playwright)
└── public/                 # Static assets

```

## 🔧 Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Framer Motion
- **State Management**: Zustand with persistence
- **Testing**: Vitest + React Testing Library + Playwright

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: SQLite (D: drive) / PostgreSQL (production-ready)
- **ORM**: Drizzle ORM
- **Payment**: Square Payment SDK (primary)
- **AI**: OpenAI API for natural language search

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **Monitoring**: Prometheus + Grafana
- **CI/CD**: GitHub Actions

## 💳 Payment Integration

**Primary Provider**: Square
- Production-ready integration
- PCI DSS compliant
- 5% commission structure
- Webhook support

## 🗄️ Database

**Location**: `D:/vibe-booking.db`
- SQLite for local development
- PostgreSQL-ready schemas
- Comprehensive migration system
- Automated backups recommended

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   cd backend && npm install
   ```

2. **Configure Environment**
   ```bash
   cp backend/.env.production backend/.env
   # Edit .env with your Square API keys
   ```

3. **Initialize Database**
   ```bash
   sqlite3 D:/vibe-booking.db < backend/src/database/migrations/001_initial_schema.sql
   ```

4. **Start Development**
   ```bash
   # Terminal 1: Frontend
   npm run dev
   
   # Terminal 2: Backend
   cd backend && npm run dev
   ```

## 📝 Key Files

- `/backend/.env.production` - Production environment template
- `/backend/src/database/migrations/` - Database schema
- `/VIBE-BOOKING-LAUNCH.md` - Production launch checklist
- `/src/App.tsx` - Main React application
- `/backend/src/server.ts` - Express server entry point

## 🔗 API Endpoints

- `POST /api/payments/create` - Create Square payment
- `POST /api/payments/refund` - Process refunds
- `GET /api/hotels/search` - Search hotels with AI
- `POST /api/bookings/create` - Create booking
- `GET /api/bookings/:id` - Get booking details

## 🎯 Next Steps

1. Configure Square production credentials
2. Set up SSL certificates for HTTPS
3. Deploy monitoring stack
4. Configure automated backups
5. Set up production domain

---

**Vibe Booking** - Modern hotel booking platform with Square payments and AI-powered search.