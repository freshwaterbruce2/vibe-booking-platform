const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check
  if (path === '/api/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'OK',
      message: 'Vibe Booking API is running!',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Hotel search
  if (path === '/api/hotels/search') {
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      hotels: [
        {
          id: '1',
          name: 'Demo Hotel',
          city: 'New York',
          price: 150,
          rating: 4.5,
          description: 'A beautiful demo hotel for testing',
          amenities: ['WiFi', 'Pool', 'Gym'],
          images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop']
        }
      ]
    }));
    return;
  }

  // AI natural language processing
  if (path === '/api/ai/process-query' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          processedQuery: {
            destination: data.query || 'New York',
            intent: 'hotel_search',
            suggestions: ['luxury hotels', 'budget hotels', 'business hotels']
          }
        }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Default response
  res.writeHead(200);
  res.end(JSON.stringify({
    message: 'Vibe Booking API',
    endpoints: ['/api/health', '/api/hotels/search', '/api/ai/process-query']
  }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});