# Hotel Booking - Modern React Application

A modern hotel booking application built with React, TypeScript, and AI-powered search capabilities.

## Features

- 🤖 **AI-Powered Search**: Natural language hotel search using OpenAI
- 💝 **Passion-Based Matching**: 7 travel passions for personalized recommendations
- 🎨 **Modern UI**: Responsive design with Tailwind CSS and Framer Motion
- 🏨 **Comprehensive Booking**: Multi-step booking flow with payment integration
- 🌍 **Global Hotels**: Integration with LiteAPI for real hotel data
- 📱 **PWA Ready**: Progressive Web App capabilities
- 🌙 **Dark Mode**: System-aware theme switching
- ♿ **Accessible**: WCAG 2.1 AA compliant

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion
- **State Management**: Zustand with persistence
- **Routing**: React Router v6
- **API**: Axios, React Query
- **Testing**: Vitest, React Testing Library, Playwright
- **Backend**: Express.js (legacy integration)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start backend server (for API integration)
cd build-website-example
npm start
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run unit tests
npm run test:e2e     # Run E2E tests
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checks
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (Button, Input, Card)
│   ├── layout/         # Layout components (Header, Footer)
│   ├── search/         # Search-related components
│   ├── hotels/         # Hotel display components
│   ├── booking/        # Booking flow components
│   └── passion/        # Passion-based features
├── pages/              # Page components
├── store/              # Zustand stores
├── services/           # API services
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3001
VITE_OPENAI_API_KEY=your_openai_key
VITE_LITEAPI_KEY=your_liteapi_key
```

## API Integration

The frontend connects to the existing Express.js backend in `build-website-example/` which provides:

- Hotel search via LiteAPI
- OpenAI natural language processing
- Booking management
- Payment processing

## Passion-Based Matching

The application includes a sophisticated passion-based recommendation system with 7 travel types:

1. 🍷 **Gourmet Foodie** - Culinary experiences and fine dining
2. 🏔️ **Adventure Seeker** - Outdoor activities and extreme sports
3. 🏛️ **Cultural Explorer** - Museums, history, and cultural sites
4. 🧘 **Wellness Retreat** - Spa, meditation, and health-focused
5. 💼 **Business Traveler** - Work-friendly amenities and locations
6. 👨‍👩‍👧‍👦 **Family Fun** - Kid-friendly activities and facilities
7. 💎 **Luxury Indulgence** - Premium experiences and high-end amenities

## Development

### Code Style

- Use TypeScript for all new code
- Follow React best practices with functional components and hooks
- Use Tailwind CSS for styling
- Implement proper error boundaries
- Write tests for critical functionality

### Git Workflow

```bash
git checkout -b feature/your-feature
# Make changes
npm run lint && npm run typecheck && npm test
git commit -m "feat: add your feature"
git push origin feature/your-feature
```

## Production Deployment

The application can be deployed to any static hosting platform:

```bash
npm run build
# Deploy the dist/ folder to your hosting platform
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Ensure all checks pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details
