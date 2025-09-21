/**
 * Edge Payment Processing
 * Calculates commission and validates payments before Square processing
 */

export async function processPayment(request, env) {
  try {
    const body = await request.json();
    const { amount, currency, bookingId, userId, hotelId } = body;

    // Validate payment amount
    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Calculate commission at edge (5%)
    const commission = Math.round(amount * 0.05);
    const netAmount = amount - commission;

    // Check for duplicate payment attempt (idempotency)
    const idempotencyKey = `${userId}-${bookingId}-${amount}`;
    const existingPayment = await env.KV_CACHE.get(`payment:${idempotencyKey}`);

    if (existingPayment) {
      console.log('Duplicate payment attempt detected');
      return new Response(existingPayment, {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'X-Idempotent': 'true' }
      });
    }

    // Validate user has not exceeded payment limits
    const userLimitCheck = await checkPaymentLimits(userId, amount, env);
    if (!userLimitCheck.allowed) {
      return new Response(JSON.stringify({
        error: 'Payment limit exceeded',
        details: userLimitCheck.reason
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Store payment intent for processing
    const paymentIntent = {
      id: crypto.randomUUID(),
      userId,
      bookingId,
      hotelId,
      amount,
      commission,
      netAmount,
      currency,
      status: 'pending',
      createdAt: Date.now(),
      idempotencyKey
    };

    // Store in KV and D1 for processing
    await env.KV_CACHE.put(
      `payment:${idempotencyKey}`,
      JSON.stringify(paymentIntent),
      { expirationTtl: 3600 } // 1 hour
    );

    await env.D1_DB.prepare(`
      INSERT INTO payment_intents (
        id, user_id, booking_id, hotel_id, amount, commission,
        net_amount, currency, status, created_at, idempotency_key
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      paymentIntent.id,
      userId,
      bookingId,
      hotelId,
      amount,
      commission,
      netAmount,
      currency,
      'pending',
      paymentIntent.createdAt,
      idempotencyKey
    ).run();

    // Forward to backend for Square processing
    const squareRequest = {
      ...body,
      paymentIntentId: paymentIntent.id,
      commission,
      netAmount,
      metadata: {
        processedAt: 'edge',
        region: env.CF_ZONE || 'unknown'
      }
    };

    const backendResponse = await fetch(`${env.BACKEND_URL}/api/payments/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Payment-Intent': paymentIntent.id
      },
      body: JSON.stringify(squareRequest)
    });

    const result = await backendResponse.json();

    // Update payment status
    if (result.success) {
      await updatePaymentStatus(paymentIntent.id, 'completed', env);

      // Cache successful payment for quick retrieval
      await env.KV_CACHE.put(
        `payment:success:${paymentIntent.id}`,
        JSON.stringify(result),
        { expirationTtl: 86400 } // 24 hours
      );
    } else {
      await updatePaymentStatus(paymentIntent.id, 'failed', env);
    }

    return new Response(JSON.stringify(result), {
      status: backendResponse.status,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    return new Response(JSON.stringify({ error: 'Payment processing failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function checkPaymentLimits(userId, amount, env) {
  try {
    // Get user's payment history for the last 24 hours
    const since = Date.now() - 86400000; // 24 hours ago

    const payments = await env.D1_DB.prepare(`
      SELECT SUM(amount) as total, COUNT(*) as count
      FROM payment_intents
      WHERE user_id = ? AND created_at > ? AND status = 'completed'
    `).bind(userId, since).first();

    const dailyLimit = 10000; // $10,000 daily limit
    const transactionLimit = 50; // 50 transactions per day

    if (payments.total + amount > dailyLimit) {
      return {
        allowed: false,
        reason: `Daily limit of ${dailyLimit} exceeded`
      };
    }

    if (payments.count >= transactionLimit) {
      return {
        allowed: false,
        reason: `Maximum ${transactionLimit} transactions per day`
      };
    }

    // Check for suspicious patterns
    const recentPayments = await env.D1_DB.prepare(`
      SELECT amount, created_at FROM payment_intents
      WHERE user_id = ? AND created_at > ?
      ORDER BY created_at DESC LIMIT 5
    `).bind(userId, Date.now() - 600000).all(); // Last 10 minutes

    if (recentPayments.results.length >= 3) {
      // Check for rapid repeated amounts (potential fraud)
      const amounts = recentPayments.results.map(p => p.amount);
      const uniqueAmounts = new Set(amounts);

      if (uniqueAmounts.size === 1) {
        return {
          allowed: false,
          reason: 'Suspicious payment pattern detected'
        };
      }
    }

    return { allowed: true };

  } catch (error) {
    console.error('Payment limit check error:', error);
    return { allowed: true }; // Allow on error to avoid blocking legitimate payments
  }
}

async function updatePaymentStatus(paymentIntentId, status, env) {
  try {
    await env.D1_DB.prepare(`
      UPDATE payment_intents
      SET status = ?, updated_at = ?
      WHERE id = ?
    `).bind(status, Date.now(), paymentIntentId).run();

    // Update cache
    const cachedPayment = await env.KV_CACHE.get(`payment:${paymentIntentId}`);
    if (cachedPayment) {
      const payment = JSON.parse(cachedPayment);
      payment.status = status;
      payment.updatedAt = Date.now();

      await env.KV_CACHE.put(
        `payment:${paymentIntentId}`,
        JSON.stringify(payment),
        { expirationTtl: 3600 }
      );
    }

  } catch (error) {
    console.error('Payment status update error:', error);
  }
}

// Webhook handler for Square payment updates
export async function handlePaymentWebhook(request, env) {
  try {
    const signature = request.headers.get('X-Square-Signature');
    const body = await request.text();

    // Verify webhook signature
    const isValid = await verifySquareWebhook(body, signature, env);
    if (!isValid) {
      return new Response('Invalid signature', { status: 401 });
    }

    const event = JSON.parse(body);

    // Process different event types
    switch (event.type) {
      case 'payment.created':
        await handlePaymentCreated(event.data, env);
        break;
      case 'payment.updated':
        await handlePaymentUpdated(event.data, env);
        break;
      case 'refund.created':
        await handleRefundCreated(event.data, env);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response('Processing error', { status: 500 });
  }
}

async function verifySquareWebhook(body, signature, env) {
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(env.SQUARE_WEBHOOK_SIGNATURE_KEY),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBytes = Uint8Array.from(
      atob(signature),
      c => c.charCodeAt(0)
    );

    return await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      new TextEncoder().encode(body)
    );

  } catch (error) {
    console.error('Webhook verification error:', error);
    return false;
  }
}

async function handlePaymentCreated(data, env) {
  // Update payment status in D1
  await env.D1_DB.prepare(`
    UPDATE payment_intents
    SET status = 'completed', square_payment_id = ?, updated_at = ?
    WHERE id = ?
  `).bind(data.payment.id, Date.now(), data.payment.reference_id).run();

  // Invalidate relevant caches
  await env.KV_CACHE.delete(`payment:pending:${data.payment.reference_id}`);
}

async function handlePaymentUpdated(data, env) {
  // Log payment updates for audit
  await env.D1_DB.prepare(`
    INSERT INTO payment_audit_log (
      payment_id, event_type, data, created_at
    ) VALUES (?, ?, ?, ?)
  `).bind(
    data.payment.id,
    'payment_updated',
    JSON.stringify(data),
    Date.now()
  ).run();
}

async function handleRefundCreated(data, env) {
  // Record refund and update booking status
  await env.D1_DB.prepare(`
    INSERT INTO refunds (
      id, payment_id, amount, reason, created_at
    ) VALUES (?, ?, ?, ?, ?)
  `).bind(
    data.refund.id,
    data.refund.payment_id,
    data.refund.amount_money.amount,
    data.refund.reason || 'Not specified',
    Date.now()
  ).run();

  // Update commission records
  const originalPayment = await env.D1_DB.prepare(`
    SELECT commission FROM payment_intents WHERE square_payment_id = ?
  `).bind(data.refund.payment_id).first();

  if (originalPayment) {
    // Reverse commission
    await env.D1_DB.prepare(`
      INSERT INTO commission_adjustments (
        payment_id, amount, type, created_at
      ) VALUES (?, ?, ?, ?)
    `).bind(
      data.refund.payment_id,
      -originalPayment.commission,
      'refund',
      Date.now()
    ).run();
  }
}