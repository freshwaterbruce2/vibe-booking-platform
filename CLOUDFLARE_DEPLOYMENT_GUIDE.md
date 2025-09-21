# Complete Cloudflare Edge Architecture Deployment Guide

[DEPLOYMENT READY - Fresh package-lock.json committed]

## Architecture Overview

This deployment creates a globally distributed, edge-optimized hotel booking platform using Cloudflare's full suite of services.

```
User → Cloudflare Pages (Frontend)
     → Workers (API Gateway)
     → KV (Session Cache)
     → D1 (Read Cache)
     → R2 (Images)
     → Railway (Write Operations)
```

## Step-by-Step Deployment

### Phase 1: Cloudflare Account Setup (10 minutes)

1. **Create Cloudflare Account**
   - Go to [dash.cloudflare.com](https://dash.cloudflare.com)
   - Sign up or sign in

2. **Enable Required Services**
   - Pages: Automatic with account
   - Workers: Free tier includes 100k requests/day
   - KV: Free tier includes 100k reads/day
   - D1: Free tier includes 5GB storage
   - R2: Free tier includes 10GB storage

### Phase 2: Deploy Frontend to Cloudflare Pages (15 minutes)

1. **Connect GitHub Repository**
   ```bash
   # Push your code to GitHub first
   git push origin simple-deploy-recovery
   ```

2. **Create Pages Project**
   - Go to Cloudflare Dashboard → Pages
   - Click "Create a project"
   - Connect to GitHub
   - Select `vibe-booking-platform` repository
   - Choose `simple-deploy-recovery` branch

3. **Configure Build Settings**
   ```
   Framework preset: None
   Build command: npm run build
   Build output directory: dist
   Root directory: /
   ```

4. **Set Environment Variables**
   ```
   VITE_API_URL=https://your-project.workers.dev
   VITE_OPENAI_API_KEY=your_key
   VITE_LITEAPI_KEY=your_key
   SQUARE_APPLICATION_ID=your_id
   SQUARE_LOCATION_ID=your_id
   VITE_TURNSTILE_SITE_KEY=your_key
   ```

5. **Deploy**
   - Click "Save and Deploy"
   - Wait for build (2-3 minutes)
   - Note your Pages URL: `https://vibe-booking.pages.dev`

### Phase 3: Setup Cloudflare Workers (30 minutes)

1. **Install Wrangler CLI**
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. **Create KV Namespaces**
   ```bash
   cd cloudflare
   wrangler kv:namespace create "KV_CACHE"
   wrangler kv:namespace create "KV_SESSION"
   # Note the IDs returned
   ```

3. **Create D1 Database**
   ```bash
   wrangler d1 create vibe-booking
   # Note the database ID

   # Apply schema
   wrangler d1 execute vibe-booking --file=./d1/schema.sql
   ```

4. **Create R2 Bucket**
   ```bash
   wrangler r2 bucket create vibe-hotel-images
   ```

5. **Update wrangler.toml with IDs**
   ```toml
   [[kv_namespaces]]
   binding = "KV_CACHE"
   id = "your-actual-kv-cache-id"

   [[kv_namespaces]]
   binding = "KV_SESSION"
   id = "your-actual-kv-session-id"

   [[d1_databases]]
   binding = "D1_DB"
   database_name = "vibe-booking"
   database_id = "your-actual-d1-id"
   ```

6. **Set Worker Secrets**
   ```bash
   wrangler secret put JWT_SECRET
   wrangler secret put SQUARE_ACCESS_TOKEN
   wrangler secret put SQUARE_WEBHOOK_SIGNATURE_KEY
   wrangler secret put OPENAI_API_KEY
   wrangler secret put LITEAPI_KEY
   ```

7. **Deploy Workers**
   ```bash
   # Deploy main API gateway
   wrangler deploy

   # Deploy R2 image handler
   wrangler deploy --name vibe-images workers/r2-image-handler.js
   ```

8. **Note Worker URL**
   - Your API URL: `https://vibe-booking-api.your-subdomain.workers.dev`

### Phase 4: Setup Turnstile (5 minutes)

1. **Enable Turnstile**
   - Go to Cloudflare Dashboard → Turnstile
   - Click "Add site"
   - Enter your domain
   - Choose "Managed" widget mode

2. **Get Site Key**
   - Copy the Site Key
   - Update Pages environment variable: `VITE_TURNSTILE_SITE_KEY`

3. **Configure Allowed Domains**
   - Add `vibe-booking.pages.dev`
   - Add your custom domain if applicable

### Phase 5: Deploy Backend to Railway (20 minutes)

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign in with GitHub

2. **Create New Project**
   - Click "New Project"
   - Choose "Deploy from GitHub repo"
   - Select `vibe-booking-platform`
   - Set root directory: `/backend`

3. **Configure Environment Variables**
   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=postgresql://...
   JWT_SECRET=same_as_workers
   SQUARE_ACCESS_TOKEN=your_token
   SQUARE_ENVIRONMENT=production
   COMMISSION_RATE=0.05
   ```

4. **Deploy**
   - Railway auto-deploys on push
   - Note your Railway URL: `https://vibe-booking-backend.up.railway.app`

### Phase 6: Connect Everything (10 minutes)

1. **Update Workers Configuration**
   ```bash
   # Edit wrangler.toml
   [vars]
   BACKEND_URL = "https://vibe-booking-backend.up.railway.app"
   FRONTEND_URL = "https://vibe-booking.pages.dev"

   # Redeploy
   wrangler deploy
   ```

2. **Update Pages Environment**
   - Go to Pages project settings
   - Update `VITE_API_URL` to Worker URL
   - Trigger rebuild

3. **Configure CORS**
   - Backend should allow Pages domain
   - Workers handle CORS for frontend

### Phase 7: Testing (15 minutes)

1. **Test Frontend**
   - Visit `https://vibe-booking.pages.dev`
   - Check console for errors
   - Test navigation

2. **Test API Gateway**
   ```bash
   curl https://vibe-booking-api.workers.dev/api/health
   ```

3. **Test Search with Caching**
   - Search for hotels
   - Check response headers for `X-Cache: HIT` on second request

4. **Test Turnstile**
   - Try booking a hotel
   - Verify bot protection appears

5. **Test Image Upload**
   ```bash
   curl -X POST https://vibe-images.workers.dev/upload \
     -F "file=@hotel.jpg" \
     -F "hotelId=123" \
     -H "Authorization: Bearer token"
   ```

## Performance Optimizations

### 1. Enable Argo Smart Routing
- Dashboard → Speed → Optimization
- Enable Argo (30% faster routing)

### 2. Configure Cache Rules
- Dashboard → Rules → Cache Rules
- Cache all `/api/hotels/*` for 1 hour
- Cache all images for 1 year

### 3. Enable Polish
- Dashboard → Speed → Optimization
- Enable Polish for automatic image optimization

### 4. Configure Early Hints
- Dashboard → Speed → Optimization
- Enable Early Hints for faster resource loading

## Monitoring & Analytics

### 1. Workers Analytics
```bash
wrangler tail # Live logs
wrangler analytics # Usage stats
```

### 2. Pages Analytics
- Dashboard → Pages → Project → Analytics
- Monitor Core Web Vitals

### 3. D1 Monitoring
```bash
wrangler d1 execute vibe-booking --command="SELECT COUNT(*) FROM cache"
```

### 4. R2 Usage
- Dashboard → R2 → Bucket → Metrics
- Monitor storage and requests

## Cost Optimization

### Free Tier Limits
- Workers: 100,000 requests/day
- KV: 100,000 reads/day, 1,000 writes/day
- D1: 5GB storage, 5M rows read/day
- R2: 10GB storage, 1M Class A operations
- Pages: Unlimited requests

### When You'll Need Paid Plans
- >100k API requests/day: Workers Paid ($5/month)
- >100k KV reads/day: Workers Paid includes 10M reads
- >10GB images: R2 pricing ($0.015/GB/month)
- >5GB database: D1 pricing ($0.75/GB/month after first 5GB)

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check Workers CORS headers
   - Verify allowed origins

2. **Cache Not Working**
   - Check KV namespace bindings
   - Verify cache keys format

3. **Images Not Loading**
   - Check R2 bucket permissions
   - Verify image paths

4. **Database Errors**
   - Check D1 connection
   - Verify schema migrations

### Debug Commands

```bash
# Check Worker logs
wrangler tail

# Test KV
wrangler kv:key get --binding=KV_CACHE "test-key"

# Query D1
wrangler d1 execute vibe-booking --command="SELECT * FROM cache LIMIT 10"

# List R2 objects
wrangler r2 object list vibe-hotel-images
```

## Production Checklist

- [ ] All environment variables set
- [ ] Secrets configured in Workers
- [ ] Custom domain configured
- [ ] SSL certificates active
- [ ] Turnstile configured
- [ ] Backend deployed to Railway
- [ ] CORS properly configured
- [ ] Rate limiting active
- [ ] Monitoring enabled
- [ ] Backup strategy in place

## Next Steps

1. **Add Custom Domain**
   - Pages → Custom domains
   - Add `vibebooking.com`

2. **Enable Web Analytics**
   - Dashboard → Analytics → Web Analytics
   - Add to your site

3. **Setup Email Routing**
   - Dashboard → Email → Email Routing
   - Configure booking confirmations

4. **Implement Zaraz**
   - Dashboard → Zaraz
   - Add Google Analytics without slowing site

## Support Resources

- [Cloudflare Docs](https://developers.cloudflare.com)
- [Workers Examples](https://developers.cloudflare.com/workers/examples)
- [D1 Documentation](https://developers.cloudflare.com/d1)
- [Pages Documentation](https://developers.cloudflare.com/pages)

## Estimated Monthly Costs

For 100,000 monthly users:
- Cloudflare Workers: $5/month (Paid plan)
- Railway Backend: ~$5-20/month
- Total: **$10-25/month**

Compare to traditional architecture: $200-500/month

## Success Metrics

After deployment, you should see:
- **Page Load**: <1 second globally
- **API Response**: <100ms for cached
- **Image Load**: <50ms from R2
- **Cache Hit Rate**: >80%
- **Error Rate**: <0.1%
- **Uptime**: 99.9%+

The platform is now globally distributed, highly performant, and cost-effective!