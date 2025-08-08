#!/bin/bash

# Hotel Booking 2025 Version - Quick Start Script
# This script starts the server and optionally opens the browser

echo ""
echo "🏨 Starting Hotel Booking Application - 2025 Edition"
echo "=================================================="
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your API keys."
    echo "Copy from .env.example if available."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Kill any existing node processes for this project
echo "🔄 Stopping any existing server..."
pkill -f "node server/server.js" 2>/dev/null || true
pkill -f "nodemon server/server.js" 2>/dev/null || true

# Wait a moment for processes to stop
sleep 2

echo "🚀 Starting Hotel Booking Server (2025 version)..."
echo "   - API Server: http://localhost:3001"
echo "   - Frontend: http://localhost:3001/"
echo "   - Health Check: http://localhost:3001/api/health"
echo ""

# Start the server
if command -v nodemon >/dev/null 2>&1; then
    echo "🔧 Using nodemon for auto-reload..."
    nodemon server/server.js
else
    echo "📝 Using node (install nodemon for auto-reload)..."
    node server/server.js
fi