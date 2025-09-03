// Production CSP Fix Upload Package for IONOS
// This script creates the essential files needed for production deployment

import fs from 'fs';
import path from 'path';

console.log('📦 CREATING PRODUCTION CSP FIX UPLOAD PACKAGE');
console.log('===============================================');

// Phase 1: Verify frontend build exists
const distExists = fs.existsSync('./dist');
console.log(`✅ Frontend Build: ${distExists ? 'Ready' : '❌ Missing'}`);

let distFiles = [];
if (distExists) {
  distFiles = fs.readdirSync('./dist');
  console.log(`📁 Frontend Files (${distFiles.length}):`, distFiles.slice(0, 5));
}

// Phase 2: Create backend security middleware file for upload
const securityMiddleware = `import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

/**
 * CRITICAL CSP FIX - Security middleware for Square payments
 * Updated: ${new Date().toISOString()}
 */
export const securityMiddleware = [
  // Helmet WITHOUT CSP (to prevent meta tag injection)
  helmet({
    contentSecurityPolicy: false, // Disabled to prevent meta tag injection
    crossOriginEmbedderPolicy: false,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }),

  // Custom CSP middleware (HTTP headers only)
  (req: Request, res: Response, next: NextFunction) => {
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://js.squareup.com https://connect.squareup.com https://web.squarecdn.com https://sandbox.web.squarecdn.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: https://images.unsplash.com",
      "connect-src 'self' https://api.liteapi.travel https://connect.squareup.com wss://localhost:*",
      "frame-src 'self' https://js.squareup.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
      "block-all-mixed-content"
    ];
    
    res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  },
];`;

// Save the security middleware file
fs.writeFileSync('./production-security-middleware.js', securityMiddleware);

console.log('📄 Created production-security-middleware.js');

// Phase 3: Create upload instructions
const uploadInstructions = `
🚀 IONOS PRODUCTION DEPLOYMENT - CSP FIXES
=========================================

CRITICAL: These files contain the CSP fixes that resolve Square payment blocking

📁 STEP 1: FRONTEND FILES (5 minutes)
1. Navigate to your IONOS File Manager
2. Upload ALL files from the dist/ folder:
   ${distExists ? distFiles.map((f) => `   - ${f}`).join('\n') : '   ❌ Run npm run build first'}
3. Replace existing files (this updates the frontend with CSP fixes)

🔧 STEP 2: BACKEND SECURITY (3 minutes)  
1. Upload production-security-middleware.js to your server
2. Update your server.js to import and use this middleware:
   
   const { securityMiddleware } = require('./production-security-middleware.js');
   app.use(securityMiddleware);

3. Restart your server/application

🧪 STEP 3: VERIFICATION (2 minutes)
1. Visit vibehotelbookings.com
2. Open browser console (F12)
3. Navigate to booking page
4. Verify: NO errors like "Refused to load https://web.squarecdn.com"
5. Confirm: Square payment form loads without CSP violations

📊 EXPECTED RESULTS:
✅ Square SDK loads successfully
✅ Payment forms display properly  
✅ No CSP blocking errors in console
✅ Live payment processing active

⚠️  NOTES:
- You may still see "report-only" CSP warnings - these are harmless
- Meta tag warnings don't affect functionality - only blocking errors matter
- Square SDK should show as available in browser console

🎯 SUCCESS INDICATOR: 
Square payment form loads and functions without console errors blocking external resources.
`;

fs.writeFileSync('./IONOS-CSP-UPLOAD-INSTRUCTIONS.md', uploadInstructions);

console.log('✅ Created IONOS-CSP-UPLOAD-INSTRUCTIONS.md');
console.log('');
console.log('🎯 NEXT STEPS:');
console.log('1. Follow instructions in IONOS-CSP-UPLOAD-INSTRUCTIONS.md');
console.log('2. Upload dist/ folder contents to IONOS');
console.log('3. Upload production-security-middleware.js');
console.log('4. Test live Square payments at vibehotelbookings.com');
console.log('');
console.log('🚀 CSP fixes ready for production deployment!');
