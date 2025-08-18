// Simple Node.js server for initial deployment
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Vibe Booking API is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Basic hotel search endpoint
app.get('/api/hotels/search', (req, res) => {
  res.json({
    success: true,
    hotels: [
      {
        id: '1',
        name: 'Demo Hotel',
        city: 'New York',
        price: 150,
        rating: 4.5,
        description: 'A beautiful demo hotel for testing'
      }
    ],
    total: 1
  });
});

// Payment endpoint placeholder
app.post('/api/payments/create', (req, res) => {
  res.json({
    success: true,
    message: 'Payment endpoint ready - Square integration pending',
    paymentId: 'demo-payment-123'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Vibe Hotels API server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});