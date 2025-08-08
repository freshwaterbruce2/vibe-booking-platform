# Hotel Booking - Local Development Setup

## Quick Start (Windows)

Simply double-click `start-local.bat` to automatically set up and run the entire application locally.

## Manual Setup

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

### 2. Set Up SQLite Database

The database will be created at `D:\hotel-booking.db`:

```bash
cd backend
npm run db:setup:local
npm run db:seed:local
```

### 3. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev:local
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database**: D:\hotel-booking.db

## Test Accounts

### Admin Account
- Email: `admin@hotelbooking.com`
- Password: `admin123`

### Regular Users
- Email: `john.doe@example.com`
- Password: `password123`
- Email: `jane.smith@example.com`
- Password: `password123`

## Features Available Locally

✅ **Full Functionality:**
- User registration and authentication
- Hotel search and filtering
- Booking creation and management
- Payment processing (test mode)
- Admin dashboard
- Review system
- User profiles

✅ **Sample Data:**
- 3 sample hotels with different price ranges
- Multiple room types
- Sample bookings and payments
- Customer reviews

## Stripe Test Cards

For payment testing, use these test card numbers:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

Use any future expiry date and any 3-digit CVC.

## Database Management

### View Database
Use any SQLite viewer to inspect the database at `D:\hotel-booking.db`

Recommended tools:
- [DB Browser for SQLite](https://sqlitebrowser.org/)
- [SQLiteStudio](https://sqlitestudio.pl/)
- VS Code SQLite extension

### Reset Database
```bash
cd backend
npm run db:reset:local
```

### Backup Database
The database file can be directly copied from `D:\hotel-booking.db` for backup.

## Troubleshooting

### Port Already in Use
If ports 3000 or 3001 are already in use:
1. Change the port in the respective package.json scripts
2. Update `.env.local` with the new backend port

### D: Drive Not Available
If D: drive is not available, the database will be created at `./backend/data/hotel-booking.db`

### Database Lock Errors
If you get database lock errors:
1. Close any SQLite viewer applications
2. Restart the backend server

## Environment Variables

The application uses `.env.local` for local development. All necessary variables are pre-configured for local development with SQLite.

## Development Workflow

1. **Make Changes**: Edit code in your preferred editor
2. **Hot Reload**: Frontend and backend automatically reload on changes
3. **Test APIs**: Use the included test script:
   ```bash
   cd backend
   npm run test:sqlite
   ```
4. **View Logs**: Check terminal windows for server logs

## Production vs Local

This local setup uses:
- **SQLite** instead of PostgreSQL
- **Local file storage** instead of cloud storage
- **Test Stripe keys** instead of production keys
- **Mock external APIs** when needed

The codebase automatically switches between local and production configurations based on the `LOCAL_SQLITE` environment variable.