const express = require('express');
const cors = require('cors');

const app = express();
const port = 3333;

app.use(
  cors({
    origin: 'http://localhost:3011',
    credentials: true,
  }),
);
app.use(express.json());

// Hotel search endpoint
app.post('/api/hotels/search', (req, res) => {
  const { destination } = req.body;

  console.log('Hotel search request:', req.body);

  // Return mock data in the format expected by frontend
  const hotels = [
    {
      id: '1',
      name: `Grand Hotel ${destination || 'Plaza'}`,
      description: 'Luxury downtown hotel with premium amenities',
      address: '123 Main Street',
      city: destination || 'New York',
      country: 'USA',
      coordinates: { lat: 40.7128, lng: -74.006 },
      rating: 4.8,
      reviewCount: 1250,
      pricePerNight: 280,
      currency: 'USD',
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
      ],
      amenities: ['Free WiFi', 'Swimming Pool', 'Spa & Wellness', 'Fitness Center', 'Restaurant'],
      sustainabilityCertified: true,
      passions: ['Luxury', 'Business', 'Wellness'],
    },
    {
      id: '2',
      name: `Boutique Hotel ${destination || 'Downtown'}`,
      description: 'Charming boutique hotel with personalized service',
      address: '456 Oak Avenue',
      city: destination || 'New York',
      country: 'USA',
      coordinates: { lat: 40.7589, lng: -73.9851 },
      rating: 4.3,
      reviewCount: 650,
      pricePerNight: 180,
      currency: 'USD',
      images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800'],
      amenities: ['Free WiFi', 'Restaurant', 'Bar', 'Business Center'],
      passions: ['Culture', 'Food', 'Business'],
    },
    {
      id: '3',
      name: `Seaside Resort ${destination || 'Beach'}`,
      description: 'Beachfront resort with stunning ocean views',
      address: '789 Beach Boulevard',
      city: destination || 'Miami',
      country: 'USA',
      coordinates: { lat: 25.7617, lng: -80.1918 },
      rating: 4.6,
      reviewCount: 890,
      pricePerNight: 350,
      currency: 'USD',
      images: ['https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800'],
      amenities: ['Beach Access', 'Outdoor Pool', 'Full Spa', 'Water Sports', 'Kids Club'],
      sustainabilityCertified: false,
      passions: ['Romance', 'Wellness', 'Family'],
    },
  ];

  res.json({
    success: true,
    hotels: hotels,
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'hotel-booking-api' });
});

app.listen(port, () => {
  console.log(`Hotel booking backend running on port ${port}`);
  console.log(`CORS enabled for: http://localhost:3011`);
});
