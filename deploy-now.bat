@echo off
echo.
echo ==================================================
echo    VIBE HOTELS - INSTANT DEPLOYMENT SCRIPT
echo ==================================================
echo.
echo This script will deploy Vibe Hotels to Vercel
echo and help you start making money TODAY!
echo.
echo --------------------------------------------------
echo STEP 1: Login to Vercel
echo --------------------------------------------------
echo.
echo You'll be prompted to login. Choose one:
echo   - Continue with GitHub (recommended)
echo   - Continue with Email
echo.
npx vercel login
echo.
echo --------------------------------------------------
echo STEP 2: Deploy to Production
echo --------------------------------------------------
echo.
echo Deploying your site...
echo.
npx vercel --prod
echo.
echo ==================================================
echo    DEPLOYMENT COMPLETE!
echo ==================================================
echo.
echo Your site is now LIVE on the internet!
echo.
echo NEXT STEPS:
echo 1. Copy your Vercel URL from above
echo 2. Share it with friends and family
echo 3. Start getting bookings!
echo.
echo TO SET UP PAYMENTS:
echo 1. Go to https://squareup.com/signup
echo 2. Create your Square account
echo 3. Get your API keys
echo 4. Add them to Vercel environment variables
echo.
echo ==================================================
echo.
pause