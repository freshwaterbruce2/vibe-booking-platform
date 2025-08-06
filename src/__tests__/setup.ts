import '@testing-library/jest-dom';
import 'jest-axe/extend-expect';
import { vi, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Auto cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.resetAllMocks();
});

// Reset all modules between tests
beforeEach(() => {
  vi.resetModules();
});

// Mock intersection observer
;(globalThis as any).IntersectionObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock resize observer
;(globalThis as any).ResizeObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock match media
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  },
  writable: true,
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  },
  writable: true,
});

// Mock fetch
global.fetch = vi.fn();

// Mock Stripe
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({
    elements: vi.fn(() => ({
      create: vi.fn(() => ({
        mount: vi.fn(),
        unmount: vi.fn(),
        destroy: vi.fn(),
        update: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      })),
      getElement: vi.fn(),
    })),
    confirmPayment: vi.fn(),
    confirmSetup: vi.fn(),
    createPaymentMethod: vi.fn(),
    retrievePaymentIntent: vi.fn(),
  })),
}));

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
    useParams: () => ({}),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    section: 'section',
    article: 'article',
    button: 'button',
    form: 'form',
    input: 'input',
    textarea: 'textarea',
    select: 'select',
    span: 'span',
    p: 'p',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
  },
  AnimatePresence: ({ children }: any) => children,
  useAnimation: () => ({
    start: vi.fn(),
    stop: vi.fn(),
    set: vi.fn(),
  }),
}));

// Mock react-intersection-observer
vi.mock('react-intersection-observer', () => ({
  useInView: () => ({ ref: vi.fn(), inView: true }),
}));

// Global test utilities
const mockSearchResults = [
  {
    id: 'hotel-1',
    name: 'Test Hotel 1',
    description: 'A wonderful test hotel with great amenities',
    location: {
      city: 'Test City',
      country: 'TC',
      neighborhood: 'Downtown',
    },
    rating: 4.5,
    reviewCount: 1250,
    priceRange: {
      avgNightly: 150,
      currency: 'USD',
    },
    images: [
      {
        url: 'test-image-1.jpg',
        alt: 'Test Hotel 1',
        isPrimary: true,
      }
    ],
    amenities: [
      { id: 'wifi', name: 'WiFi', icon: '📶' },
      { id: 'pool', name: 'Pool', icon: '🏊' },
      { id: 'gym', name: 'Gym', icon: '💪' },
    ],
    availability: {
      available: true,
      lowAvailability: false,
      priceChange: null,
    },
    passionScore: {
      'luxury-indulgence': 0.8,
    },
    sustainabilityScore: 0.75,
    virtualTourUrl: 'https://example.com/tour1',
  },
  {
    id: 'hotel-2',
    name: 'Test Hotel 2',
    description: 'Another excellent test hotel',
    location: {
      city: 'Test City',
      country: 'TC',
      neighborhood: 'Uptown',
    },
    rating: 4.8,
    reviewCount: 856,
    priceRange: {
      avgNightly: 200,
      currency: 'USD',
    },
    images: [
      {
        url: 'test-image-2.jpg',
        alt: 'Test Hotel 2',
        isPrimary: true,
      }
    ],
    amenities: [
      { id: 'wifi', name: 'WiFi', icon: '📶' },
      { id: 'spa', name: 'Spa', icon: '🧖' },
      { id: 'restaurant', name: 'Restaurant', icon: '🍽️' },
    ],
    availability: {
      available: true,
      lowAvailability: true,
      priceChange: -15,
    },
    passionScore: {
      'wellness-retreat': 0.9,
    },
    sustainabilityScore: 0.85,
  },
];

const mockBookingData = {
  id: 'booking-123',
  hotelId: 'hotel-1',
  checkIn: '2024-12-01',
  checkOut: '2024-12-03',
  guests: { adults: 2, children: 0, rooms: 1 },
  totalAmount: 300,
  status: 'confirmed',
};

const mockPaymentIntent = {
  id: 'pi_test_123',
  status: 'succeeded',
  amount: 30000,
  currency: 'usd',
  client_secret: 'pi_test_123_secret',
};

// Export test utilities for use in tests
export const testUtils = {
  mockSearchResults,
  mockBookingData,
  mockPaymentIntent,
  
  // Helper to create mock fetch responses
  createMockResponse: (data: any, status = 200) => {
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
    } as Response);
  },
  
  // Helper to wait for async updates
  waitForNextTick: () => new Promise(resolve => setTimeout(resolve, 0)),
  
  // Helper to mock API responses
  mockApiCall: (endpoint: string, response: any, status = 200) => {
    const mockFetch = global.fetch as any;
    mockFetch.mockImplementation((url: string) => {
      if (url.includes(endpoint)) {
        return testUtils.createMockResponse(response, status);
      }
      return Promise.reject(new Error(`Unexpected API call to ${url}`));
    });
  },
};

// Set default fetch mock
(global.fetch as any).mockImplementation(() => 
  Promise.reject(new Error('Unmocked fetch call'))
);