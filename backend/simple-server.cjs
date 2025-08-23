const express = require('express');
const cors = require('cors');

const app = express();
const port = 3002;

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:3009', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Mock hotel data
const mockHotels = [
  {
    id: '1',
    name: 'Luxury Las Vegas Resort',
    address: '3655 Las Vegas Blvd S, Las Vegas, NV 89109',
    city: 'Las Vegas',
    state: 'Nevada',
    country: 'United States',
    rating: 4.5,
    reviewCount: 2840,
    pricePerNight: 299,
    currency: 'USD',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600',
        isPrimary: true,
        alt: 'Luxury Las Vegas Resort exterior'
      }
    ],
    amenities: ['Pool', 'Casino', 'Spa', 'Restaurant', 'Fitness Center', 'WiFi'],
    description: 'Experience the ultimate in luxury at our premier Las Vegas resort.',
    rooms: [
      {
        id: 'room-1',
        name: 'Deluxe King Room',
        type: 'king',
        capacity: 2,
        price: 299,
        currency: 'USD',
        description: 'Spacious room with king bed and city views',
        amenities: ['King Bed', 'City View', 'Mini Bar', 'WiFi'],
        images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400'],
        availability: true
      },
      {
        id: 'room-2',
        name: 'Executive Suite',
        type: 'suite',
        capacity: 4,
        price: 499,
        currency: 'USD',
        description: 'Luxurious suite with separate living area and premium amenities',
        amenities: ['King Bed', 'Living Area', 'City View', 'Premium WiFi', 'Mini Bar'],
        images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&h=400'],
        availability: true
      }
    ]
  },
  {
    id: '2',
    name: 'Desert Oasis Hotel',
    address: '4455 Paradise Rd, Las Vegas, NV 89169',
    city: 'Las Vegas',
    state: 'Nevada',
    country: 'United States',
    rating: 4.2,
    reviewCount: 1950,
    pricePerNight: 189,
    currency: 'USD',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600',
        isPrimary: true,
        alt: 'Desert Oasis Hotel exterior'
      }
    ],
    amenities: ['Pool', 'Restaurant', 'Business Center', 'WiFi', 'Parking'],
    description: 'A comfortable stay in the heart of Las Vegas with modern amenities.',
    rooms: [
      {
        id: 'room-3',
        name: 'Standard Queen Room',
        type: 'queen',
        capacity: 2,
        price: 189,
        currency: 'USD',
        description: 'Comfortable room with queen bed and modern amenities',
        amenities: ['Queen Bed', 'WiFi', 'Coffee Maker', 'Air Conditioning'],
        images: ['https://images.unsplash.com/photo-1586611292717-f828b167408c?w=600&h=400'],
        availability: true
      },
      {
        id: 'room-4',
        name: 'Family Suite',
        type: 'suite',
        capacity: 6,
        price: 329,
        currency: 'USD',
        description: 'Perfect for families with separate bedroom and living space',
        amenities: ['King Bed', 'Sofa Bed', 'Kitchenette', 'WiFi', 'Family Friendly'],
        images: ['https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=600&h=400'],
        availability: true
      }
    ]
  }
];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'vibe-hotels-backend'
  });
});

// Hotel search endpoint
app.post('/api/hotels/search', (req, res) => {
  console.log('Hotel search request:', req.body);
  
  // Simulate search delay
  setTimeout(() => {
    res.json({
      success: true,
      hotels: mockHotels,
      total: mockHotels.length,
      searchParams: req.body
    });
  }, 500);
});

// Get hotel by ID
app.get('/api/hotels/:id', (req, res) => {
  const hotelId = req.params.id;
  const hotel = mockHotels.find(h => h.id === hotelId);
  
  if (!hotel) {
    return res.status(404).json({ success: false, error: 'Hotel not found' });
  }
  
  res.json({ success: true, hotel });
});

// Payment endpoint (demo mode)
app.post('/api/payments/create', (req, res) => {
  console.log('Payment request:', req.body);
  
  // Simulate payment processing
  setTimeout(() => {
    const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const receiptUrl = `https://demo.vibe-hotels.com/receipt/${paymentId}`;
    
    res.json({
      success: true,
      paymentId,
      receiptUrl,
      message: 'Demo payment processed successfully'
    });
  }, 2000);
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Vibe Hotels Backend running on http://localhost:${port}`);
  console.log(`📍 Environment: development`);
  console.log(`💳 Payment Mode: demo`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Server shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Server shutting down...');
  process.exit(0);
});