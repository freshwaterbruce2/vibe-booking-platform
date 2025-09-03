const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Basic API routes
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Backend is working!',
    timestamp: new Date().toISOString()
  });
});

// Hotels endpoint (mock data for now)
app.get('/api/hotels/search', (req, res) => {
  res.json({
    hotels: [
      {
        id: '1',
        name: 'Luxury Resort',
        location: 'Miami Beach',
        price: 299,
        rating: 4.5,
        image: 'https://via.placeholder.com/400x300',
        amenities: ['Pool', 'Spa', 'WiFi']
      }
    ],
    total: 1
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;