/**
 * Edge Rate Limiting
 * Protects API from abuse without hitting backend
 */

export async function checkRateLimit(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const url = new URL(request.url);
  const path = url.pathname;

  // Different limits for different endpoints
  const limits = {
    '/api/hotels/search': { requests: 30, window: 60 }, // 30 per minute
    '/api/payments/create': { requests: 5, window: 300 }, // 5 per 5 minutes
    '/api/bookings': { requests: 10, window: 60 }, // 10 per minute
    'default': { requests: 100, window: 60 } // 100 per minute default
  };

  const limit = limits[path] || limits.default;
  const key = `ratelimit:${ip}:${path}`;
  const now = Date.now();
  const window = limit.window * 1000; // Convert to milliseconds

  try {
    // Get current count from KV
    const data = await env.KV_SESSION.get(key);
    const rateData = data ? JSON.parse(data) : { count: 0, resetAt: now + window };

    // Check if window has expired
    if (now > rateData.resetAt) {
      rateData.count = 0;
      rateData.resetAt = now + window;
    }

    // Increment count
    rateData.count++;

    // Store updated count
    await env.KV_SESSION.put(key, JSON.stringify(rateData), {
      expirationTtl: limit.window
    });

    // Check if limit exceeded
    if (rateData.count > limit.requests) {
      // Log rate limit violation
      await logRateLimitViolation(ip, path, env);

      return {
        allowed: false,
        remaining: 0,
        resetAt: rateData.resetAt,
        retryAfter: Math.ceil((rateData.resetAt - now) / 1000)
      };
    }

    return {
      allowed: true,
      remaining: limit.requests - rateData.count,
      resetAt: rateData.resetAt,
      limit: limit.requests
    };

  } catch (error) {
    console.error('Rate limit check error:', error);
    // Allow request on error to avoid blocking legitimate traffic
    return { allowed: true, remaining: limit.requests };
  }
}

async function logRateLimitViolation(ip, path, env) {
  try {
    await env.D1_DB.prepare(`
      INSERT INTO rate_limit_violations (ip, path, timestamp)
      VALUES (?, ?, ?)
    `).bind(ip, path, Date.now()).run();

    // Check if IP should be temporarily blocked
    const recentViolations = await env.D1_DB.prepare(`
      SELECT COUNT(*) as count FROM rate_limit_violations
      WHERE ip = ? AND timestamp > ?
    `).bind(ip, Date.now() - 3600000).first(); // Last hour

    if (recentViolations.count > 10) {
      // Block IP for 1 hour
      await env.KV_SESSION.put(`blocked:${ip}`, 'true', {
        expirationTtl: 3600
      });
    }
  } catch (error) {
    console.error('Rate limit logging error:', error);
  }
}

// User-specific rate limiting (for authenticated requests)
export async function checkUserRateLimit(userId, action, env) {
  const limits = {
    'booking_create': { requests: 10, window: 3600 }, // 10 bookings per hour
    'payment_attempt': { requests: 5, window: 600 }, // 5 payment attempts per 10 min
    'review_submit': { requests: 5, window: 3600 }, // 5 reviews per hour
    'default': { requests: 100, window: 3600 } // 100 actions per hour
  };

  const limit = limits[action] || limits.default;
  const key = `userratelimit:${userId}:${action}`;
  const now = Date.now();
  const window = limit.window * 1000;

  try {
    const data = await env.KV_SESSION.get(key);
    const rateData = data ? JSON.parse(data) : { count: 0, resetAt: now + window };

    if (now > rateData.resetAt) {
      rateData.count = 0;
      rateData.resetAt = now + window;
    }

    rateData.count++;

    await env.KV_SESSION.put(key, JSON.stringify(rateData), {
      expirationTtl: limit.window
    });

    return {
      allowed: rateData.count <= limit.requests,
      remaining: Math.max(0, limit.requests - rateData.count),
      resetAt: rateData.resetAt
    };

  } catch (error) {
    console.error('User rate limit error:', error);
    return { allowed: true, remaining: limit.requests };
  }
}

// Distributed rate limiting across multiple regions
export async function globalRateLimit(identifier, action, env) {
  const key = `global:${identifier}:${action}`;

  try {
    // Use Durable Objects for consistent global state
    const id = env.RATE_LIMITER.idFromName(key);
    const limiter = env.RATE_LIMITER.get(id);

    const response = await limiter.fetch(new Request('https://rate-limiter/check', {
      method: 'POST',
      body: JSON.stringify({ action, identifier })
    }));

    return await response.json();
  } catch (error) {
    console.error('Global rate limit error:', error);
    return { allowed: true };
  }
}

// Adaptive rate limiting based on system load
export async function adaptiveRateLimit(request, env) {
  try {
    // Check system metrics
    const metrics = await env.D1_DB.prepare(`
      SELECT
        AVG(response_time) as avg_response_time,
        COUNT(*) as request_count
      FROM request_logs
      WHERE timestamp > ?
    `).bind(Date.now() - 60000).first(); // Last minute

    // Adjust limits based on load
    let multiplier = 1.0;

    if (metrics.avg_response_time > 1000) {
      // System under stress, reduce limits
      multiplier = 0.5;
    } else if (metrics.avg_response_time < 200) {
      // System healthy, allow more traffic
      multiplier = 1.5;
    }

    const standardLimit = await checkRateLimit(request, env);

    return {
      ...standardLimit,
      remaining: Math.floor(standardLimit.remaining * multiplier),
      adaptiveMultiplier: multiplier
    };

  } catch (error) {
    console.error('Adaptive rate limit error:', error);
    return checkRateLimit(request, env);
  }
}