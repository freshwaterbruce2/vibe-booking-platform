/**
 * Edge JWT Validation
 * Validates JWTs at the edge without hitting the backend
 */

export async function validateJWT(request, env) {
  const authorization = request.headers.get('Authorization');

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return { valid: false, reason: 'No token provided' };
  }

  const token = authorization.substring(7);

  try {
    // Import the secret key from environment
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(env.JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Parse the JWT
    const [headerB64, payloadB64, signatureB64] = token.split('.');

    if (!headerB64 || !payloadB64 || !signatureB64) {
      return { valid: false, reason: 'Invalid token format' };
    }

    // Decode payload
    const payload = JSON.parse(atob(payloadB64));

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, reason: 'Token expired' };
    }

    // Verify signature
    const data = `${headerB64}.${payloadB64}`;
    const signature = Uint8Array.from(atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      new TextEncoder().encode(data)
    );

    if (!valid) {
      return { valid: false, reason: 'Invalid signature' };
    }

    // Check if token is blacklisted (revoked)
    const blacklisted = await env.KV_SESSION.get(`blacklist:${token}`);
    if (blacklisted) {
      return { valid: false, reason: 'Token revoked' };
    }

    // Store session info in KV for quick access
    await env.KV_SESSION.put(
      `session:${payload.userId}`,
      JSON.stringify({
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        lastAccess: Date.now()
      }),
      { expirationTtl: 3600 } // 1 hour TTL
    );

    return {
      valid: true,
      user: {
        id: payload.userId,
        email: payload.email,
        role: payload.role
      }
    };

  } catch (error) {
    console.error('JWT validation error:', error);
    return { valid: false, reason: 'Validation error' };
  }
}

export async function refreshToken(request, env) {
  const refreshToken = request.headers.get('X-Refresh-Token');

  if (!refreshToken) {
    return { success: false, reason: 'No refresh token' };
  }

  try {
    // Validate refresh token
    const stored = await env.KV_SESSION.get(`refresh:${refreshToken}`);
    if (!stored) {
      return { success: false, reason: 'Invalid refresh token' };
    }

    const userData = JSON.parse(stored);

    // Generate new access token
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const payload = {
      userId: userData.userId,
      email: userData.email,
      role: userData.role,
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      iat: Math.floor(Date.now() / 1000)
    };

    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    const data = `${encodedHeader}.${encodedPayload}`;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(env.JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(data)
    );

    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const newToken = `${encodedHeader}.${encodedPayload}.${encodedSignature}`;

    return {
      success: true,
      token: newToken,
      expiresIn: 3600
    };

  } catch (error) {
    console.error('Token refresh error:', error);
    return { success: false, reason: 'Refresh failed' };
  }
}