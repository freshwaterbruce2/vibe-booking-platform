#!/bin/bash

# Hotel Booking 2025 Version - Quick Test Script
# This script tests the core functionality

echo ""
echo "🧪 Testing Hotel Booking Application - 2025 Edition"
echo "================================================="
echo ""

BASE_URL="http://localhost:3001"

# Test 1: Server Health Check
echo "1️⃣  Testing server health..."
HEALTH_RESPONSE=$(curl -s "$BASE_URL/api/health")
if [[ $? -eq 0 ]]; then
    echo "   ✅ Server is responding"
    STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    echo "   📊 Status: $STATUS"
else
    echo "   ❌ Server is not responding"
    echo "   💡 Make sure the server is running: ./start-2025.sh"
    exit 1
fi

echo ""

# Test 2: Main Page Load
echo "2️⃣  Testing main page load..."
MAIN_PAGE=$(curl -s "$BASE_URL/")
if echo "$MAIN_PAGE" | grep -q "HotelFinder - Find Your Perfect Stay"; then
    echo "   ✅ Main page loads with 2025 design"
else
    echo "   ❌ Main page not loading correctly"
fi

if echo "$MAIN_PAGE" | grep -q "styles-2025.css"; then
    echo "   ✅ 2025 styles are loaded"
else
    echo "   ❌ 2025 styles not found"
fi

echo ""

# Test 3: API Endpoints
echo "3️⃣  Testing API endpoints..."
API_RESPONSE=$(curl -s "$BASE_URL/api/search-hotels?q=test")
if [[ $? -eq 0 ]]; then
    echo "   ✅ Search API endpoint is responding"
    if echo "$API_RESPONSE" | grep -q "error"; then
        echo "   ℹ️  AI service not configured (expected for demo)"
    fi
else
    echo "   ❌ Search API endpoint not responding"
fi

echo ""

# Test 4: Static Files
echo "4️⃣  Testing static file serving..."
CSS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/styles-2025.css")
if [[ "$CSS_RESPONSE" == "200" ]]; then
    echo "   ✅ CSS files are being served correctly"
else
    echo "   ❌ CSS files not loading (HTTP $CSS_RESPONSE)"
fi

JS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/app.js")
if [[ "$JS_RESPONSE" == "200" ]]; then
    echo "   ✅ JavaScript files are being served correctly"
else
    echo "   ❌ JavaScript files not loading (HTTP $JS_RESPONSE)"
fi

echo ""
echo "🎉 Testing complete!"
echo ""
echo "🌐 Access your application at: $BASE_URL"
echo "🔧 Health check: $BASE_URL/api/health"
echo ""