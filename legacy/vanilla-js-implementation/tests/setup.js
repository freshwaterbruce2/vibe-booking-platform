// Test setup file
require('dotenv').config({ path: '.env.test' });

// Mock console methods in test environment to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
};

// Global test timeout
jest.setTimeout(10000);

// Mock external services
global.mockLiteApi = {
  getHotels: jest.fn(),
  getFullRates: jest.fn(),
  getHotelDetails: jest.fn(),
  preBook: jest.fn(),
  book: jest.fn(),
};

global.mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn(),
    },
  },
};