/**
 * Cloudflare Workers API Gateway
 * Main entry point for all API requests with intelligent caching and routing
 */

import { validateJWT } from './auth-validator';
import { getCachedResponse, setCachedResponse } from './cache-handler';
import { checkRateLimit } from './rate-limiter';
import { processPayment } from './payment-processor';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for Cloudflare Pages
    const corsHeaders = {
      'Access-Control-Allow-Origin': env.FRONTEND_URL || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Rate limiting check
      const rateLimitResult = await checkRateLimit(request, env);
      if (!rateLimitResult.allowed) {
        return new Response('Rate limit exceeded', {
          status: 429,
          headers: { ...corsHeaders, 'Retry-After': '60' }
        });
      }

      // Authentication for protected routes
      if (path.startsWith('/api/bookings') || path.startsWith('/api/admin')) {
        const authResult = await validateJWT(request, env);
        if (!authResult.valid) {
          return new Response('Unauthorized', {
            status: 401,
            headers: corsHeaders
          });
        }
        // Add user context to request
        request.user = authResult.user;
      }

      // Check cache for GET requests
      if (request.method === 'GET') {
        const cacheKey = `${path}:${url.search}`;
        const cachedResponse = await getCachedResponse(cacheKey, env);
        if (cachedResponse) {
          return new Response(cachedResponse, {
            headers: { ...corsHeaders, 'X-Cache': 'HIT' }
          });
        }
      }

      // Route handling
      let response;

      // Hotel search with caching
      if (path === '/api/hotels/search') {
        response = await handleHotelSearch(request, env);
      }
      // Payment processing with commission calculation
      else if (path === '/api/payments/create') {
        response = await processPayment(request, env);
      }
      // Health check endpoint
      else if (path === '/api/health') {
        response = new Response(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          edge: env.CF_ZONE,
          cache: 'active'
        }), { headers: { 'Content-Type': 'application/json' } });
      }
      // Forward to Railway backend for write operations
      else {
        response = await forwardToBackend(request, env);
      }

      // Add CORS headers to response
      const newHeaders = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });

      // Cache successful GET responses
      if (request.method === 'GET' && response.status === 200) {
        const cacheKey = `${path}:${url.search}`;
        ctx.waitUntil(
          setCachedResponse(cacheKey, await response.text(), env, 3600)
        );
      }

      return new Response(response.body, {
        status: response.status,
        headers: newHeaders
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', {
        status: 500,
        headers: corsHeaders
      });
    }
  }
};

async function handleHotelSearch(request, env) {
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams);

  // Check D1 for cached results
  const cacheKey = JSON.stringify(params);
  const cached = await env.D1_DB.prepare(
    'SELECT results FROM hotel_search_cache WHERE query_hash = ? AND expires_at > ?'
  ).bind(cacheKey, Date.now()).first();

  if (cached) {
    return new Response(cached.results, {
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'D1-HIT'
      }
    });
  }

  // Forward to backend if not cached
  const response = await forwardToBackend(request, env);

  // Cache successful responses in D1
  if (response.status === 200) {
    const results = await response.text();
    await env.D1_DB.prepare(
      'INSERT OR REPLACE INTO hotel_search_cache (query_hash, results, expires_at) VALUES (?, ?, ?)'
    ).bind(cacheKey, results, Date.now() + 3600000).run();

    return new Response(results, {
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'MISS'
      }
    });
  }

  return response;
}

async function forwardToBackend(request, env) {
  const backendUrl = env.BACKEND_URL || 'https://vibe-booking-backend.up.railway.app';
  const url = new URL(request.url);

  const backendRequest = new Request(
    `${backendUrl}${url.pathname}${url.search}`,
    {
      method: request.method,
      headers: request.headers,
      body: request.body
    }
  );

  return await fetch(backendRequest);
}