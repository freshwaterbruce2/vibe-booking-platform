import React, { useEffect, useState, useCallback } from 'react';
import { z } from 'zod';
import type { Card } from '@square/web-sdk';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CreditCard, Lock, Shield, Loader2 } from 'lucide-react';

// Define the payment request schema locally
const CreatePaymentRequestSchema = z.object({
  sourceId: z.string(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  bookingId: z.string(),
  billingDetails: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    addressLine1: z.string(),
    addressLine2: z.string().optional(),
    locality: z.string(),
    administrativeDistrictLevel1: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }).optional(),
});

interface SquarePaymentFormProps {
  bookingId: string;
  amount: number;
  currency?: string;
  onSuccess: (paymentResult: { paymentId: string; receiptUrl?: string }) => void;
  onError: (error: Error) => void;
  bookingDetails?: {
    hotelName: string;
    checkIn: string;
    checkOut: string;
    guestName: string;
    roomType: string;
  };
}

interface BillingInfo {
  firstName: string;
  lastName: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  locality: string; // city
  administrativeDistrictLevel1: string; // state
  postalCode: string;
  country: string;
}

interface BookingSummaryDetails {
  hotelName: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  guestName: string;
}

type PaymentSummaryProps = {
  amount: number;
  currency: string;
  bookingDetails?: BookingSummaryDetails;
};
const PaymentSummary: React.FC<PaymentSummaryProps> = ({ amount, currency, bookingDetails }) => {
  const commission = amount * 0.05;
  const rewards = commission; // 100% of commission as rewards
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Summary</h3>
      
      {bookingDetails && (
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Hotel:</span>
            <span className="font-medium">{bookingDetails.hotelName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Check-in:</span>
            <span>{bookingDetails.checkIn}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Check-out:</span>
            <span>{bookingDetails.checkOut}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Room Type:</span>
            <span>{bookingDetails.roomType}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Guest:</span>
            <span>{bookingDetails.guestName}</span>
          </div>
        </div>
      )}
      
      <div className="border-t pt-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Room Rate:</span>
          <span>${amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Taxes & Fees:</span>
          <span>Included</span>
        </div>
        <div className="flex justify-between text-sm text-green-600">
          <span>Vibe Rewards (5%):</span>
          <span>+${rewards.toFixed(2)}</span>
        </div>
        <div className="border-t pt-3 flex justify-between">
          <span className="text-lg font-semibold">Total Due:</span>
          <span className="text-lg font-semibold">${amount.toFixed(2)} {currency}</span>
        </div>
      </div>
      
      <div className="mt-6 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800" aria-live="polite">
          <strong>Earn ${rewards.toFixed(2)} in Vibe Rewards!</strong> Rewards added after checkout.
        </p>
      </div>
    </div>
  );
};

export const SquarePaymentForm: React.FC<SquarePaymentFormProps> = ({
  bookingId,
  amount,
  currency = 'USD',
  onSuccess,
  onError,
  bookingDetails,
}) => {
  const [card, setCard] = useState<Card | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [squareError, setSquareError] = useState<string | null>(null);
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    firstName: '',
    lastName: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    locality: '',
    administrativeDistrictLevel1: '',
    postalCode: '',
    country: 'US',
  });

  const initializeSquare = useCallback(async () => {
    try {
      if (!window.Square) {
        throw new Error('Square.js failed to load');
      }

      const squareAppId = import.meta.env.VITE_SQUARE_APPLICATION_ID;
      const squareLocationId = import.meta.env.VITE_SQUARE_LOCATION_ID;
      
      if (!squareAppId || !squareLocationId) {
        throw new Error('Square configuration missing');
      }

      const payments = await window.Square.payments(squareAppId, squareLocationId);
      
      const cardOptions = {
        style: {
          '.input-container': {
            borderColor: '#E5E7EB',
            borderRadius: '8px',
          },
          '.input-container.is-focus': {
            borderColor: '#3B82F6',
          },
          '.input-container.is-error': {
            borderColor: '#EF4444',
          },
          '.message-text': {
            color: '#6B7280',
          },
          '.message-icon': {
            color: '#6B7280',
          },
          '.message-text.is-error': {
            color: '#EF4444',
          },
          '.message-icon.is-error': {
            color: '#EF4444',
          },
          input: {
            fontSize: '16px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          },
          'input::placeholder': {
            color: '#9CA3AF',
          },
          'input.is-error': {
            color: '#EF4444',
          },
        },
      };

      const card = await payments.card(cardOptions);
      await card.attach('#square-card-container');
      
      setCard(card);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize Square:', error);
      setSquareError(error instanceof Error ? error.message : 'Failed to load payment form');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeSquare();
  }, [initializeSquare]);

  const handlePayment = async () => {
    if (!card) {
      onError(new Error('Payment form not initialized'));
      return;
    }

    setIsProcessing(true);

    try {
  const result = await card.tokenize();
      
      if (result.status === 'OK' && result.token) {
        // Build payload and validate against shared schema prior to sending
        const candidate = {
          bookingId,
          sourceId: result.token,
          amount,
          currency,
          provider: 'square' as const,
        };
        const parsed = CreatePaymentRequestSchema.safeParse(candidate);
        if (!parsed.success) {
          throw new Error(parsed.error.issues.map((i) => i.message).join(', '));
        }
        // Send token (sourceId) to backend to create Square payment
        const response = await window.fetch('/api/payments/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Authorization header set by higher-level fetch wrapper if implemented
          },
          body: JSON.stringify({
            ...parsed.data,
            billingAddress: {
              firstName: billingInfo.firstName,
              lastName: billingInfo.lastName,
              addressLine1: billingInfo.addressLine1,
              addressLine2: billingInfo.addressLine2,
              locality: billingInfo.locality,
              administrativeDistrictLevel1: billingInfo.administrativeDistrictLevel1,
              postalCode: billingInfo.postalCode,
              country: billingInfo.country,
            },
          }),
        });

        const data = await response.json();
        if (response.ok && data.success) {
          onSuccess({ paymentId: data.paymentId, receiptUrl: data.receiptUrl });
        } else {
          throw new Error(data.error || 'Payment failed');
        }
      } else {
        throw new Error(result.errors?.[0]?.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      onError(error instanceof Error ? error : new Error('Payment processing failed'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBillingChange = (field: string, value: string) => {
    setBillingInfo((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading secure payment form...</p>
        </div>
      </div>
    );
  }

  if (squareError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <CreditCard className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Payment Form Error</h3>
            <p className="text-sm text-red-700 mt-1">{squareError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Form */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-4">
              <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Payment Details</h3>
              <div className="ml-auto flex items-center text-sm text-gray-500">
                <Shield className="h-4 w-4 mr-1" />
                <span>Secured by Square</span>
              </div>
            </div>

            {/* Square Card Element */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Information
              </label>
              <div
                id="square-card-container"
                className="min-h-[120px] border border-gray-300 rounded-lg p-3"
              />
            </div>

            {/* Billing Information */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Billing Information</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={billingInfo.firstName}
                  onChange={(e) => handleBillingChange('firstName', e.target.value)}
                  required
                />
                <Input
                  label="Last Name"
                  value={billingInfo.lastName}
                  onChange={(e) => handleBillingChange('lastName', e.target.value)}
                  required
                />
              </div>

              <Input
                label="Email Address"
                type="email"
                value={billingInfo.email}
                onChange={(e) => handleBillingChange('email', e.target.value)}
                required
              />

              <Input
                label="Address"
                value={billingInfo.addressLine1}
                onChange={(e) => handleBillingChange('addressLine1', e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  value={billingInfo.locality}
                  onChange={(e) => handleBillingChange('locality', e.target.value)}
                  required
                />
                <Input
                  label="State"
                  value={billingInfo.administrativeDistrictLevel1}
                  onChange={(e) => handleBillingChange('administrativeDistrictLevel1', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="ZIP Code"
                  value={billingInfo.postalCode}
                  onChange={(e) => handleBillingChange('postalCode', e.target.value)}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <select
                    value={billingInfo.country}
                    onChange={(e) => handleBillingChange('country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-label="Country"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="mt-6 flex items-center p-3 bg-gray-50 rounded-lg">
              <Lock className="h-4 w-4 text-gray-400 mr-2" />
              <p className="text-xs text-gray-600">
                Your payment information is encrypted and secure. We never store your card details.
              </p>
            </div>

            {/* Pay Button */}
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full mt-6"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay ${amount.toFixed(2)} {currency}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Payment Summary */}
        <div>
          {bookingDetails && (
            <PaymentSummary
              amount={amount}
              currency={currency}
              bookingDetails={bookingDetails}
            />
          )}
        </div>
      </div>
    </div>
  );
};