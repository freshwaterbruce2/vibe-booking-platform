#!/bin/bash

# Vibe Hotels Quick Deploy Script
# This script will deploy your app to Vercel (frontend) and Railway (backend)

echo "🚀 Vibe Hotels - Quick Deployment Script"
echo "========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Prerequisites checked"
echo ""

# Step 1: Install Vercel CLI if not already installed
echo "📦 Step 1: Setting up Vercel CLI..."
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
else
    echo "Vercel CLI already installed"
fi

# Step 2: Build the production version
echo ""
echo "🔨 Step 2: Building production version..."
npm run build

# Step 3: Deploy to Vercel
echo ""
echo "☁️ Step 3: Deploying frontend to Vercel..."
echo "Note: You'll need to log in to Vercel if this is your first time"
vercel --prod

# Get the deployment URL
echo ""
echo "✅ Frontend deployed successfully!"
echo ""
echo "📝 Next Steps:"
echo "1. Note your Vercel URL (shown above)"
echo "2. Go to https://vercel.com/dashboard to manage your deployment"
echo "3. Add custom domain in Vercel dashboard"
echo ""

# Step 4: Prepare backend deployment
echo "🔧 Step 4: Preparing backend deployment..."
echo ""
echo "For backend deployment to Railway:"
echo "1. Go to https://railway.app"
echo "2. Sign up/Login with GitHub"
echo "3. Create new project from GitHub repo"
echo "4. Set these environment variables in Railway:"
echo ""
echo "DATABASE_URL=<your_database_url>"
echo "SQUARE_ACCESS_TOKEN=<your_square_token>"
echo "SQUARE_ENVIRONMENT=production"
echo "JWT_SECRET=<generate_random_64_chars>"
echo "COMMISSION_RATE=0.05"
echo ""

# Step 5: Create quick Square setup guide
echo "💳 Step 5: Square Payment Setup"
echo "================================"
echo "1. Go to https://squareup.com/signup"
echo "2. Create business account for 'Vibe Hotels'"
echo "3. Go to Square Dashboard → Apps → OAuth"
echo "4. Create new application called 'Vibe Hotels'"
echo "5. Get your Production Access Token"
echo "6. Get your Application ID"
echo ""

# Step 6: Create environment file template
cat > .env.production.template << EOF
# Frontend Environment Variables (Vercel)
VITE_APP_NAME="Vibe Hotels"
VITE_API_URL="https://api.vibehotels.com"
VITE_SQUARE_APPLICATION_ID="your_square_app_id"
VITE_SQUARE_LOCATION_ID="your_square_location_id"

# Backend Environment Variables (Railway)
NODE_ENV=production
PORT=3001
DATABASE_URL="your_database_url"
SQUARE_ACCESS_TOKEN="your_square_production_token"
SQUARE_ENVIRONMENT=production
JWT_SECRET="generate_random_64_character_string"
COMMISSION_RATE=0.05
REWARDS_PERCENTAGE=100
EOF

echo "✅ Created .env.production.template file"
echo ""

# Step 7: Show estimated costs
echo "💰 Estimated Monthly Costs:"
echo "==========================="
echo "Vercel (Frontend): $0-20/month (Free tier available)"
echo "Railway (Backend): $5-20/month"
echo "Database (Supabase): $0-25/month (Free tier available)"
echo "Domain Name: $12/year (~$1/month)"
echo "Total: ~$6-66/month starting costs"
echo ""

# Step 8: Revenue projection
echo "📈 Revenue Projections (5% commission):"
echo "========================================"
echo "10 bookings/month × $500 avg = $250 revenue"
echo "50 bookings/month × $500 avg = $1,250 revenue"
echo "100 bookings/month × $500 avg = $2,500 revenue"
echo "500 bookings/month × $500 avg = $12,500 revenue"
echo ""

echo "🎉 Deployment script complete!"
echo ""
echo "📋 Quick Action Items:"
echo "1. ✅ Frontend deployed to Vercel"
echo "2. ⏳ Set up Square account (10 minutes)"
echo "3. ⏳ Deploy backend to Railway (5 minutes)"
echo "4. ⏳ Buy domain name (5 minutes)"
echo "5. ⏳ Share with first 10 friends to test"
echo ""
echo "🚀 You can be live and making money TODAY!"