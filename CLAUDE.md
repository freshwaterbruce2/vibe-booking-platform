# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a hotel booking web application built with vanilla JavaScript, Express.js, and the LiteAPI travel booking service. The application features an AI-powered search interface using OpenAI GPT-3.5-turbo to parse natural language queries and a sophisticated "passion-based" hotel matching system.

## Architecture

### Backend (Node.js/Express)

- **Entry Point**: `build-website-example/server/server.js`
- **Framework**: Express.js with CORS enabled
- **APIs Integrated**:
  - LiteAPI (hotel search and booking)
  - OpenAI (natural language query processing)
- **Environment**: Supports both sandbox and production LiteAPI environments

### Frontend (Vanilla JavaScript)

- **Main Page**: `build-website-example/client/index.html`
- **Core Scripts**:
  - `app.js` - Main application logic
  - `passion-data.js` - Travel passion matching system
  - `passion-ui.js` - Passion-based UI components
  - `payment-utils.js` - Payment integration utilities
- **Styling**: Modern CSS with dual theme system (sky blue/lavender purple)

### Key Features

- Natural language hotel search powered by OpenAI
- Passion-based hotel matching (gourmet foodie, outdoor adventure, etc.)
- Dual theme system with glass morphism design
- LiteAPI integration for real hotel booking
- Payment processing with LiteAPI Payment SDK

## Common Development Commands

### Project Setup

```bash
cd build-website-example
npm install
```

### Environment Configuration

```bash
cp .env.example .env
# Edit .env with your API keys:
# - PROD_API_KEY (LiteAPI production)
# - SAND_API_KEY (LiteAPI sandbox)
# - OPEN_API_KEY (OpenAI API key)
```

### Development

```bash
npm start                # Start server with nodemon (default port 3001)
```

### API Testing

The server provides these endpoints:

- `GET /api/search-hotels` - Natural language hotel search
- `GET /search-rates` - Get specific hotel rates
- `POST /prebook` - Pre-book a hotel reservation
- `GET /book` - Complete hotel booking

## Code Architecture Details

### Server Structure (`server/server.js`)

- **API Key Management**: Dual environment support (sandbox/production)
- **OpenAI Integration**: Natural language parsing for search queries
- **LiteAPI Integration**: Hotel search, rates, prebooking, and booking
- **Error Handling**: Comprehensive error responses with user-friendly messages
- **Static File Serving**: Serves the client application

### Client Architecture

- **Modular Design**: Separate files for core logic, passion system, and UI
- **Passion Matching System**:
  - 7 predefined travel passions (gourmet foodie, outdoor adventure, etc.)
  - Algorithmic scoring based on hotel amenities, descriptions, and location
  - Persistent user preferences via localStorage
- **Theme System**: CSS variable-based dual theme switching
- **Progressive Enhancement**: Works without JavaScript for basic functionality

### Passion System Details

The passion matching system (`passion-data.js`) includes:

- **PassionMatcher Class**: Calculates compatibility scores between hotels and user interests
- **PassionProfile Class**: Manages user's selected travel passions
- **Scoring Algorithm**: Matches keywords in hotel descriptions, amenities, and location data
- **7 Passion Categories**: Each with specific keywords, amenity matches, and location indicators

### Payment Integration

- Uses LiteAPI Payment SDK (`liteAPIPayment.js`)
- Supports voucher codes and transaction tracking
- Integrated with hotel booking workflow

## Environment Variables

Required in `.env` file:

```bash
PROD_API_KEY=<LiteAPI production key>
SAND_API_KEY=<LiteAPI sandbox key>
OPEN_API_KEY=<OpenAI API key>
PORT=3001                    # Optional, defaults to 3001
```

## Key Technical Patterns

### Natural Language Processing

The application uses OpenAI to parse user queries like "hotels in Paris for a romantic getaway next weekend for 2 people" into structured search parameters including city, dates, and guest count.

### API Response Handling

- Graceful degradation when APIs are unavailable
- User-friendly error messages with technical details logged
- Fallback responses when OpenAI or LiteAPI calls fail

### Client-Server Communication

- RESTful API design with query parameters for GET requests
- JSON request/response format
- Environment switching for testing vs production

### State Management

- Client-side state managed through vanilla JavaScript
- Persistent user preferences in localStorage
- Form state preservation during searches

## Design System

The application implements a modern 2025 design aesthetic with:

- **Dual Themes**: "Serene Escape" (sky blue) and "Tranquil Haven" (lavender purple)
- **Glass Morphism**: Frosted glass effects on search forms
- **Typography**: Inter font family with consistent hierarchy
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Accessibility**: WCAG 2.1 AA compliance considerations

## Testing the Application

1. Ensure all environment variables are set
2. Start the server: `npm start`
3. Navigate to `http://localhost:3001`
4. Test search with natural language queries
5. Verify theme switching functionality
6. Test booking flow in sandbox environment

## Security Considerations

- API keys stored in environment variables (never committed)
- CORS configured for cross-origin requests
- Input validation on search parameters
- Error responses avoid exposing sensitive system details

## Known Dependencies

- **express**: Web server framework
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management
- **body-parser**: Request body parsing
- **liteapi-node-sdk**: Hotel booking API integration
- **openai**: AI-powered query processing
- **nodemon**: Development server with auto-reload
