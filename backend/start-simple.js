#!/usr/bin/env node

// Simple server startup script for debugging
import { spawn } from 'child_process';
import dotenv from 'dotenv';

// Load .env file
dotenv.config();

// Set environment variables for SQLite
process.env.LOCAL_SQLITE = 'true';
process.env.NODE_ENV = 'development';
process.env.PORT = '3001';

console.log('Starting Vibe Booking Backend Server...');
console.log('Database: SQLite (local)');
console.log('Port: 3001');
console.log('');

// Start the server using tsx
const server = spawn('npx', ['tsx', 'src/server.ts'], {
  stdio: 'inherit',
  env: process.env
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.kill('SIGINT');
});