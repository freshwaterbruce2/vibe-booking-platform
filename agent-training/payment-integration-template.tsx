// Payment Integration Template for React + TypeScript
// Agent Training: Complete payment form with Stripe and PayPal

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { PayPalButtons } from '@paypal/react-paypal-js';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Payment method types
type PaymentMethod = 'stripe' | 'paypal';

interface PaymentFormProps {
  amount: number;
  currency?: string;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
}

// Stripe payment component
const StripePaymentForm: React.FC<{
  amount: number;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
}> = ({ amount, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    try {
      // Create payment intent on backend
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const { clientSecret } = await response.json();

      // Confirm payment with Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (result.error) {
        onError(result.error.message || 'Payment failed');
      } else if (result.paymentIntent) {
        onSuccess(result.paymentIntent.id);
      }
    } catch (error) {
      onError('Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg disabled:opacity-50"
      >
        {processing ? 'Processing...' : `Pay $${(amount / 100).toFixed(2)}`}
      </button>
    </form>
  );
};

// Main payment form with method selection
export const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  currency = 'USD',
  onSuccess,
  onError,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');

  return (
    <div className="max-w-md mx-auto p-6">
      {/* Payment method selection */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setPaymentMethod('stripe')}
          className={`flex-1 py-2 px-4 rounded-lg border ${
            paymentMethod === 'stripe'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-300'
          }`}
        >
          Credit/Debit Card
        </button>
        <button
          onClick={() => setPaymentMethod('paypal')}
          className={`flex-1 py-2 px-4 rounded-lg border ${
            paymentMethod === 'paypal'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-300'
          }`}
        >
          PayPal
        </button>
      </div>

      {/* Payment forms */}
      {paymentMethod === 'stripe' ? (
        <Elements stripe={stripePromise}>
          <StripePaymentForm
            amount={amount}
            onSuccess={onSuccess}
            onError={onError}
          />
        </Elements>
      ) : (
        <PayPalButtons
          createOrder={async () => {
            const response = await fetch('/api/payments/create-paypal-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ amount }),
            });
            const order = await response.json();
            return order.id;
          }}
          onApprove={async (data) => {
            const response = await fetch('/api/payments/capture-paypal-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: data.orderID }),
            });
            const result = await response.json();
            if (result.success) {
              onSuccess(data.orderID);
            } else {
              onError('PayPal payment failed');
            }
          }}
          onError={() => onError('PayPal payment failed')}
        />
      )}
    </div>
  );
};

// Backend API endpoints template (Express.js)
/*
// Stripe payment intent creation
app.post('/api/payments/create-intent', async (req, res) => {
  const { amount } = req.body;
  
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PayPal order creation
app.post('/api/payments/create-paypal-order', async (req, res) => {
  const { amount } = req.body;
  
  try {
    const order = await paypal.orders.create({
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: (amount / 100).toFixed(2),
        },
      }],
    });
    
    res.json({ id: order.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PayPal order capture
app.post('/api/payments/capture-paypal-order', async (req, res) => {
  const { orderId } = req.body;
  
  try {
    const capture = await paypal.orders.capture(orderId);
    res.json({ success: true, capture });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook handling
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Handle successful payment
        await updatePaymentStatus(event.data.object.id, 'completed');
        break;
      case 'payment_intent.payment_failed':
        // Handle failed payment
        await updatePaymentStatus(event.data.object.id, 'failed');
        break;
    }
    
    res.json({ received: true });
  } catch (error) {
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});
*/