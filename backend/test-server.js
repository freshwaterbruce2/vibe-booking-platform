#!/usr/bin/env node

// Test script to start the backend server
console.log('Starting Vibe Booking Backend Server...');
console.log('Environment:', process.env.NODE_ENV);
console.log('SQLite Mode:', process.env.LOCAL_SQLITE);

// Set environment
process.env.LOCAL_SQLITE = 'true';
process.env.NODE_ENV = 'development';

// Import and start server
import('./src/server.ts').then(module => {
  console.log('Server module loaded');
}).catch(error => {
  console.error('Failed to load server:', error);
  process.exit(1);
});