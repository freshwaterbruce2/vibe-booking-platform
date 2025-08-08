#!/bin/bash

# Vibe Booking - Development Server Startup Script
# This script starts both frontend and backend servers

echo "🚀 Starting Vibe Booking Development Servers..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠ Port $1 is already in use${NC}"
        return 1
    fi
    return 0
}

# Check if ports are available
echo "Checking ports..."
if ! check_port 3000; then
    echo "Please stop the process using port 3000 (Frontend)"
    exit 1
fi

if ! check_port 3001; then
    echo "Please stop the process using port 3001 (Backend)"
    exit 1
fi

echo -e "${GREEN}✓ Ports are available${NC}"
echo ""

# Start backend server
echo -e "${BLUE}Starting Backend Server...${NC}"
cd backend
npm run dev:local &
BACKEND_PID=$!
echo "Backend server PID: $BACKEND_PID"
cd ..

# Wait for backend to start
echo "Waiting for backend to initialize..."
sleep 5

# Start frontend server
echo -e "${BLUE}Starting Frontend Server...${NC}"
npm run dev &
FRONTEND_PID=$!
echo "Frontend server PID: $FRONTEND_PID"

echo ""
echo -e "${GREEN}✨ Vibe Booking is starting up!${NC}"
echo ""
echo "📍 Frontend: http://localhost:3000"
echo "📍 Backend API: http://localhost:3001"
echo "📍 API Docs: http://localhost:3001/api-docs"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Function to handle shutdown
shutdown() {
    echo ""
    echo "Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up trap to catch Ctrl+C
trap shutdown INT

# Wait for processes
wait $BACKEND_PID
wait $FRONTEND_PID