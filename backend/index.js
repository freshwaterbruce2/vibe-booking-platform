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
          rating: 4.5
        }
      ]
    }));
    return;
  }

  // Default response
  res.writeHead(200);
  res.end(JSON.stringify({
    message: 'Vibe Booking API',
    endpoints: ['/api/health', '/api/hotels/search']
  }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});