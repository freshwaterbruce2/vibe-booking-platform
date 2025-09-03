// Hotel Booking API - Simple Node.js Backend for IONOS
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['https://vibehotelbookings.com', 'http://vibehotelbookings.com', 'http://localhost:3009'],
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// Mock Hotels Database
const mockHotels = [
  {
    id: '1',
    name: 'Grand Luxury Resort & Spa',
    description: 'Experience ultimate luxury with breathtaking ocean views and world-class amenities.',
    rating: 4.8,
    reviewCount: 2847,
    priceRange: { min: 350, max: 650, currency: 'USD', avgNightly: 450, originalPrice: 650 },
    images: [
      { id: '1-1', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop', alt: 'Grand Luxury Resort exterior', category: 'exterior', isPrimary: true },
      { id: '1-2', url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop', alt: 'Luxury room interior', category: 'room', isPrimary: false },
      { id: '1-3', url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', alt: 'Deluxe King Room', category: 'room' },
      { id: '1-4', url: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=800', alt: 'Fine Dining Restaurant', category: 'amenity' }
    ],
    amenities: [
      { id: 'pool', name: 'Pool', category: 'Recreation' },
      { id: 'spa', name: 'Spa', category: 'Wellness' },
      { id: 'gym', name: 'Gym', category: 'Fitness' },
      { id: 'restaurant', name: 'Restaurant', category: 'Dining' },
      { id: 'wifi', name: 'WiFi', category: 'Technology' }
    ],
    location: {
      address: '123 Ocean Drive, Miami Beach, FL',
      city: 'Miami Beach',
      country: 'USA',
      coordinates: { lat: 25.7617, lng: -80.1918 }
    },
    passionScore: { luxury: 0.92, beach: 0.95, wellness: 0.88 },
    availability: { available: true, lastChecked: new Date().toISOString() }
  },
  {
    id: '2',
    name: 'Urban Boutique Hotel',
    description: 'Modern sophistication in the heart of downtown with stunning city skyline views.',
    rating: 4.6,
    reviewCount: 1234,
    priceRange: { min: 200, max: 350, currency: 'USD', avgNightly: 280, originalPrice: 350 },
    images: [
      { id: '2-1', url: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop', alt: 'Urban boutique hotel lobby', category: 'interior', isPrimary: true },
      { id: '2-2', url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop', alt: 'Modern city room', category: 'room', isPrimary: false }
    ],
    amenities: [
      { id: 'wifi', name: 'WiFi', category: 'Technology' },
      { id: 'gym', name: 'Gym', category: 'Fitness' },
      { id: 'restaurant', name: 'Restaurant', category: 'Dining' },
      { id: 'bar', name: 'Bar', category: 'Dining' }
    ],
    location: {
      address: '456 City Center, New York, NY',
      city: 'New York',
      country: 'USA',
      coordinates: { lat: 40.7128, lng: -74.0060 }
    },
    passionScore: { urban: 0.85, business: 0.90, culture: 0.82 },
    availability: { available: true, lastChecked: new Date().toISOString() }
  }
];

// Hotel Search API
app.get('/api/hotels/search', (req, res) => {
  console.log('Hotel search request:', req.query);
  
  const { destination, checkIn, checkOut, guests, rooms } = req.query;
  
  // Filter hotels based on search criteria
  let filteredHotels = mockHotels;
  
  if (destination) {
    const searchTerm = destination.toLowerCase();
    filteredHotels = mockHotels.filter(hotel => 
      hotel.name.toLowerCase().includes(searchTerm) ||
      hotel.location.city.toLowerCase().includes(searchTerm) ||
      hotel.location.country.toLowerCase().includes(searchTerm) ||
      hotel.description.toLowerCase().includes(searchTerm)
    );
  }
  
  res.json({
    hotels: filteredHotels,
    total: filteredHotels.length,
    page: 1,
    limit: 10,
    searchCriteria: { destination, checkIn, checkOut, guests, rooms }
  });
});

// Hotel Details API
app.get('/api/hotels/:id', (req, res) => {
  const hotel = mockHotels.find(h => h.id === req.params.id);
  if (!hotel) {
    return res.status(404).json({ error: 'Hotel not found' });
  }
  res.json({ hotel });
});

// Booking API
app.post('/api/bookings', (req, res) => {
  console.log('Booking request:', req.body);
  
  const bookingId = 'VB' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();
  const confirmationNumber = 'CNF' + Math.random().toString(36).substr(2, 8).toUpperCase();
  
  res.json({
    success: true,
    bookingId,
    confirmationNumber,
    status: 'confirmed',
    message: 'Booking confirmed successfully!',
    booking: {
      ...req.body,
      bookingId,
      confirmationNumber,
      createdAt: new Date().toISOString(),
      status: 'confirmed'
    }
  });
});

// Payment API
app.post('/api/payments/create', (req, res) => {
  console.log('Payment request:', req.body);
  
  const paymentId = 'PAY' + Date.now();
  
  res.json({
    success: true,
    paymentId,
    status: 'completed',
    amount: req.body.amount || 0,
    currency: req.body.currency || 'USD',
    message: 'Payment processed successfully'
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Vibe Hotels Booking API is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Default route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Vibe Hotels Booking API',
    version: '2.0.0',
    endpoints: [
      'GET /api/hotels/search',
      'GET /api/hotels/:id',
      'POST /api/bookings',
      'POST /api/payments/create',
      'GET /api/health'
    ]
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  console.log(`🏨 Vibe Hotels Booking API running on port ${port}`);
  console.log(`📍 API endpoints available at http://localhost:${port}/api`);
});