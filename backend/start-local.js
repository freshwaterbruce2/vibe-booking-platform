#!/usr/bin/env node

/**
 * Local SQLite Development Startup Script
 * 
 * This script sets up and starts the hotel booking backend with SQLite database.
 * It automatically handles database setup, seeding, and server startup.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = colors.white) {
  console.log(`${color}[LOCAL-SETUP]${colors.reset} ${message}`);
}

function error(message) {
  console.error(`${colors.red}[ERROR]${colors.reset} ${message}`);
}

function success(message) {
  log(message, colors.green);
}

function info(message) {
  log(message, colors.blue);
}

function warn(message) {
  log(message, colors.yellow);
}

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        LOCAL_SQLITE: 'true',
        NODE_ENV: 'development'
      },
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

async function checkDependencies() {
  info('Checking dependencies...');
  
  // Check if node_modules exists
  if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
    warn('Dependencies not found. Installing...');
    await runCommand('npm', ['install']);
    success('Dependencies installed');
  } else {
    success('Dependencies OK');
  }
}

async function checkDatabase() {
  const databasePath = 'D:/hotel-booking.db';
  const fallbackPath = path.join(__dirname, 'data', 'hotel-booking.db');
  
  // Check if D: drive exists, otherwise use fallback
  let dbPath = databasePath;
  if (!fs.existsSync('D:/') && !fs.existsSync('/mnt/d/')) {
    dbPath = fallbackPath;
    warn('D: drive not accessible, using local data directory');
    
    // Ensure data directory exists
    const dataDir = path.dirname(fallbackPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }
  
  if (!fs.existsSync(dbPath)) {
    info('Database not found. Setting up SQLite database...');
    await runCommand('npm', ['run', 'db:setup:local']);
    success('Database setup completed');
    
    info('Seeding database with sample data...');
    await runCommand('npm', ['run', 'db:seed:local']);
    success('Database seeding completed');
  } else {
    success('Database already exists');
  }
}

async function startServer() {
  info('Starting development server with SQLite...');
  
  // Set environment variables and start the server
  process.env.LOCAL_SQLITE = 'true';
  process.env.NODE_ENV = 'development';
  
  // Start the development server (this will not return)
  await runCommand('npm', ['run', 'dev:local']);
}

async function main() {
  try {
    console.log(`${colors.cyan}
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           Hotel Booking Backend - Local SQLite Setup        ║
║                                                              ║
║  This script will set up a local SQLite database and        ║
║  start the development server for local testing.            ║
║                                                              ║
║  Database Location:                                          ║
║    • Primary: D:/hotel-booking.db                           ║
║    • Fallback: ./data/hotel-booking.db                      ║
║                                                              ║
║  Features:                                                   ║
║    • Full SQLite database with sample data                  ║
║    • Stripe payment integration (test mode)                 ║
║    • LiteAPI hotel search (sandbox)                         ║
║    • OpenAI-powered search (requires API key)               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);

    info('Starting local development setup...');
    
    // Step 1: Check and install dependencies
    await checkDependencies();
    
    // Step 2: Check database and set it up if needed
    await checkDatabase();
    
    // Step 3: Start the development server
    success('Setup completed! Starting server...');
    await startServer();
    
  } catch (err) {
    error('Setup failed:');
    console.error(err);
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  info('Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  info('Shutting down...');
  process.exit(0);
});

// Start the setup
main();