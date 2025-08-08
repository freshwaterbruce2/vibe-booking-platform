// Simple local server for testing
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', mode: 'local-sqlite' });
});

// Mock API endpoints
app.get('/api/hotels/search', (req, res) => {
  res.json({
    success: true,
    data: {
      hotels: [
        {
          id: '1',
          name: 'Grand Plaza Hotel',
          description: 'Luxury hotel in the heart of the city',
          city: 'New York',
          country: 'USA',
          price: 250,
          rating: 4.5,
          image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
          amenities: ['wifi', 'pool', 'spa', 'gym'],
          availableRooms: 5
        },
        {
          id: '2',
          name: 'Seaside Resort',
          description: 'Beautiful beachfront property',
          city: 'Miami',
          country: 'USA',
          price: 180,
          rating: 4.2,
          image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4',
          amenities: ['wifi', 'pool', 'restaurant', 'beach'],
          availableRooms: 8
        },
        {
          id: '3',
          name: 'Mountain Lodge',
          description: 'Cozy retreat in the mountains',
          city: 'Denver',
          country: 'USA',
          price: 150,
          rating: 4.7,
          image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa',
          amenities: ['wifi', 'fireplace', 'hiking', 'ski'],
          availableRooms: 3
        }
      ],
      total: 3
    }
  });
});

// Mock auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'admin@hotelbooking.com' && password === 'admin123') {
    res.json({
      success: true,
      data: {
        user: {
          id: '1',
          email: email,
          name: 'Admin User',
          role: 'admin'
        },
        token: 'mock-jwt-token-admin'
      }
    });
  } else if (email === 'john.doe@example.com' && password === 'password123') {
    res.json({
      success: true,
      data: {
        user: {
          id: '2',
          email: email,
          name: 'John Doe',
          role: 'user'
        },
        token: 'mock-jwt-token-user'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: '3',
        email: req.body.email,
        name: req.body.name,
        role: 'user'
      },
      token: 'mock-jwt-token-new'
    }
  });
});

// Mock booking endpoints
app.post('/api/bookings/create', (req, res) => {
  res.json({
    success: true,
    data: {
      bookingId: 'bk_' + Date.now(),
      confirmationNumber: 'CNF' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      ...req.body,
      status: 'pending',
      totalAmount: req.body.nights * 200 // Mock price
    }
  });
});

// Mock payment endpoints with 5% commission for Square
app.post('/api/payments/create-intent', (req, res) => {
  const amount = req.body.amount || 1000;
  const commission = amount * 0.05; // 5% commission for Square
  
  res.json({
    success: true,
    data: {
      clientSecret: 'pi_test_' + Date.now() + '_secret',
      paymentIntentId: 'pi_test_' + Date.now(),
      amount: amount,
      commissionAmount: commission,
      platformFee: commission,
      currency: 'USD'
    }
  });
});

app.post('/api/payments/confirm', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'succeeded',
      paymentId: 'pay_' + Date.now(),
      receiptUrl: 'http://localhost:3001/receipts/mock'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
    ========================================
    Hotel Booking Backend (Local Mode)
    ========================================
    
    Server running at: http://localhost:${PORT}
    Health check: http://localhost:${PORT}/health
    Database: SQLite (Local)
    Payment: Square Mock (5% commission)
    
    Test Accounts:
    - Admin: admin@hotelbooking.com / admin123
    - User: john.doe@example.com / password123
    
    ========================================
  `);
});