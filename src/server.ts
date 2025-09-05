import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import winston from 'winston';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://vibe-booking.netlify.app',
    /.*\.netlify\.app$/,
    /.*\.vercel\.app$/
  ],
  credentials: true
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0'
  });
});

// Basic API test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Vibe Booking Backend is working!',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Mock hotels search endpoint
app.get('/api/hotels/search', (req, res) => {
  const mockHotels = [
    {
      id: 'hotel-1',
      name: 'Luxury Beach Resort',
      location: 'Miami Beach, FL',
      description: 'A stunning beachfront resort with world-class amenities',
      starRating: 5,
      price: {
        amount: 299,
        currency: 'USD'
      },
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800'
      ],
      amenities: ['Pool', 'Spa', 'WiFi', 'Restaurant', 'Beach Access'],
      rooms: [
        {
          id: 'room-1',
          type: 'Ocean View Suite',
          price: 299,
          available: true
        }
      ]
    },
    {
      id: 'hotel-2',
      name: 'Mountain Lodge Retreat',
      location: 'Aspen, CO',
      description: 'Cozy mountain lodge perfect for winter getaways',
      starRating: 4,
      price: {
        amount: 199,
        currency: 'USD'
      },
      images: [
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800'
      ],
      amenities: ['Fireplace', 'WiFi', 'Ski Access', 'Restaurant'],
      rooms: [
        {
          id: 'room-2',
          type: 'Mountain View Room',
          price: 199,
          available: true
        }
      ]
    },
    {
      id: 'hotel-3',
      name: 'Urban Boutique Hotel',
      location: 'New York, NY',
      description: 'Modern boutique hotel in the heart of Manhattan',
      starRating: 4,
      price: {
        amount: 259,
        currency: 'USD'
      },
      images: [
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800'
      ],
      amenities: ['WiFi', 'Gym', 'Business Center', 'Rooftop Bar'],
      rooms: [
        {
          id: 'room-3',
          type: 'City View Room',
          price: 259,
          available: true
        }
      ]
    }
  ];

  // Simple filtering based on query params
  const { location, minPrice, maxPrice, guests } = req.query;
  let filteredHotels = mockHotels;

  if (location) {
    filteredHotels = filteredHotels.filter(hotel => 
      hotel.location.toLowerCase().includes((location as string).toLowerCase())
    );
  }

  if (minPrice) {
    filteredHotels = filteredHotels.filter(hotel => 
      hotel.price.amount >= parseInt(minPrice as string)
    );
  }

  if (maxPrice) {
    filteredHotels = filteredHotels.filter(hotel => 
      hotel.price.amount <= parseInt(maxPrice as string)
    );
  }

  res.json({
    hotels: filteredHotels,
    total: filteredHotels.length,
    page: 1,
    totalPages: 1
  });
});

// Mock hotel details endpoint
app.get('/api/hotels/:id', (req, res) => {
  const { id } = req.params;
  const mockHotels = [
    {
      id: 'hotel-1',
      name: 'Luxury Beach Resort',
      location: 'Miami Beach, FL',
      description: 'A stunning beachfront resort with world-class amenities and breathtaking ocean views.',
      fullDescription: 'Experience the ultimate in luxury at our beachfront resort. With pristine white sand beaches, crystal-clear waters, and world-class amenities, this is the perfect destination for your next vacation.',
      starRating: 5,
      price: { amount: 299, currency: 'USD' },
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800'
      ],
      amenities: ['Pool', 'Spa', 'WiFi', 'Restaurant', 'Beach Access', 'Fitness Center'],
      rooms: [
        {
          id: 'room-1',
          type: 'Ocean View Suite',
          price: 299,
          available: true,
          description: 'Spacious suite with panoramic ocean views'
        },
        {
          id: 'room-1b',
          type: 'Deluxe Ocean Room',
          price: 249,
          available: true,
          description: 'Comfortable room with ocean views'
        }
      ],
      address: '123 Ocean Drive, Miami Beach, FL 33139',
      phone: '+1 (305) 555-0123',
      email: 'reservations@luxurybeachresort.com'
    }
  ];

  const hotel = mockHotels.find(h => h.id === id);
  if (!hotel) {
    return res.status(404).json({ error: 'Hotel not found' });
  }

  res.json(hotel);
});

// Mock AI search endpoint
app.post('/api/ai/search', (req, res) => {
  const { query } = req.body;
  
  res.json({
    processedQuery: query,
    intent: 'hotel_search',
    extractedFilters: {
      location: 'Miami Beach',
      dateRange: null,
      priceRange: null,
      amenities: []
    },
    suggestions: [
      'Luxury Beach Resort',
      'Ocean View Hotels',
      'Miami Beach Accommodations'
    ]
  });
});

// Mock booking endpoints
app.post('/api/bookings', (req, res) => {
  const { hotelId, roomId, guestInfo, dates, totalAmount } = req.body;
  
  const bookingId = 'booking-' + Date.now();
  
  res.json({
    bookingId,
    status: 'confirmed',
    hotelId,
    roomId,
    guestInfo,
    dates,
    totalAmount,
    confirmationNumber: 'VB' + Math.random().toString(36).substr(2, 8).toUpperCase(),
    createdAt: new Date().toISOString()
  });
});

app.get('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  
  res.json({
    bookingId: id,
    status: 'confirmed',
    hotelName: 'Luxury Beach Resort',
    roomType: 'Ocean View Suite',
    dates: {
      checkIn: '2025-09-15',
      checkOut: '2025-09-18'
    },
    totalAmount: 897,
    confirmationNumber: 'VB12345ABC'
  });
});

// Mock payment endpoints
app.post('/api/payments/create', (req, res) => {
  const { amount, bookingId, paymentMethod } = req.body;
  
  // Simulate payment processing
  const paymentId = 'payment-' + Date.now();
  
  res.json({
    paymentId,
    status: 'completed',
    amount,
    bookingId,
    transactionId: 'txn_' + Math.random().toString(36).substr(2, 10),
    processedAt: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl
  });
});

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Vibe Booking Backend running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
  });
}

export default app;