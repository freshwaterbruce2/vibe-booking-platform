# Vibe Booking Backend

Clean, optimized backend API for the Vibe Hotel Booking platform.

## Features

- Express.js with TypeScript
- CORS enabled for frontend integration
- Mock hotel data endpoints
- Health check endpoint
- Rate limiting and security middleware
- Comprehensive logging with Winston

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Hotels
- `GET /api/hotels/search` - Search hotels with optional filters
- `GET /api/hotels/:id` - Get hotel details by ID

### AI Search
- `POST /api/ai/search` - Process natural language search queries

### Bookings
- `POST /api/bookings` - Create a new booking
- `GET /api/bookings/:id` - Get booking details

### Payments
- `POST /api/payments/create` - Process payment

## Quick Start

```bash
# Install dependencies
npm install

# Development
npm run dev

# Production build
npm run build
npm start
```

## Environment Variables

```env
PORT=3001
NODE_ENV=production
```

## Deployment

This backend is optimized for Railway deployment:
- Automatic build on deploy
- Health check endpoint for monitoring
- Clean git history for fast snapshots
- Minimal dependencies for quick builds

## Architecture

- **TypeScript** for type safety
- **Express.js** for API server
- **Winston** for logging
- **Helmet** for security headers
- **Rate limiting** for API protection
- **CORS** configured for frontend domains