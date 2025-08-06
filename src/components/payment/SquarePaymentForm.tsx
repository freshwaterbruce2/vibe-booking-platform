import React, { useState, useEffect } from 'react';
import { PaymentSummary } from './PaymentSummary';
import { Loader2, CreditCard, Shield, Lock } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

// Square Web Payments SDK types
declare global {
  interface Window {
    Square?: any;
  }
}

interface SquarePaymentFormProps {
  bookingId: string;
  amount: number;
  currency?: string;
  onSuccess: (paymentResult: any) => void;
  onError: (error: string) => void;
  bookingDetails?: {
    hotelName: string;
    roomType: string;
    checkIn: Date;
    checkOut: Date;
    guests: number;
    nights: number;
  };
  billingDetails?: {
    name: string;
    email: string;
    phone?: string;
    address?: {
      line1: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
}

export const SquarePaymentForm: React.FC<SquarePaymentFormProps> = ({
  bookingId,
  amount,
  currency = 'USD',
  onSuccess,
  onError,
  bookingDetails,
  billingDetails,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [squareError, setSquareError] = useState<string | null>(null);
  const [card, setCard] = useState<any>(null);
  const [payments, setPayments] = useState<any>(null);
  
  // Billing form state
  const [billingInfo, setBillingInfo] = useState({
    firstName: billingDetails?.name?.split(' ')[0] || '',
    lastName: billingDetails?.name?.split(' ').slice(1).join(' ') || '',
    email: billingDetails?.email || '',
    addressLine1: billingDetails?.address?.line1 || '',
    locality: billingDetails?.address?.city || '',
    administrativeDistrictLevel1: billingDetails?.address?.state || '',
    postalCode: billingDetails?.address?.postal_code || '',
    country: billingDetails?.address?.country || 'US',
  });

  useEffect(() => {
    initializeSquare();
  }, []);

  const initializeSquare = async () => {
    try {
      // Load Square Web Payments SDK
      if (!window.Square) {
        const script = document.createElement('script');
        script.src = 'https://web.squarecdn.com/v1/square.js';
        script.onload = () => {
          initializePayments();
        };
        script.onerror = () => {
          setSquareError('Failed to load Square payment form');
          setIsLoading(false);
        };
        document.head.appendChild(script);
      } else {
        initializePayments();
      }
    } catch (error) {
      console.error('Error initializing Square:', error);
      setSquareError('Failed to initialize payment form');
      setIsLoading(false);
    }
  };

  const initializePayments = async () => {
    if (!window.Square) {
      setSquareError('Square SDK not loaded');
      setIsLoading(false);
      return;
    }

    try {
      const appId = process.env.VITE_SQUARE_APPLICATION_ID;
      const locationId = process.env.VITE_SQUARE_LOCATION_ID || 'main';
      
      if (!appId) {
        setSquareError('Square Application ID not configured');
        setIsLoading(false);
        return;
      }

      const paymentsInstance = window.Square.payments(appId, locationId);
      setPayments(paymentsInstance);

      const cardInstance = await paymentsInstance.card({
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
            color: '#EF4444',
          },
        },
      });

      await cardInstance.attach('#square-card-container');
      setCard(cardInstance);
      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing Square payments:', error);
      setSquareError('Failed to initialize payment form');
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!card || !payments) {
      onError('Payment form not initialized');
      return;
    }

    setIsProcessing(true);
    setSquareError(null);

    try {
      // Tokenize card
      const result = await card.tokenize();
      
      if (result.status === 'OK') {
        // Process payment
        const response = await fetch('/api/payments/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingId,
            sourceId: result.token,
            amount,
            currency,
            billingAddress: billingInfo,
            metadata: {
              email: billingInfo.email,
            },
          }),
        });

        const paymentResult = await response.json();

        if (paymentResult.success) {
          onSuccess({
            paymentId: paymentResult.paymentId,
            receiptUrl: paymentResult.receiptUrl,
            amount,
            currency,
          });
        } else {
          onError(paymentResult.error || 'Payment failed');
        }
      } else {
        onError(result.errors?.[0]?.message || 'Card tokenization failed');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      onError('Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBillingChange = (field: string, value: string) => {
    setBillingInfo(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (isLoading) {
    return (
      <div className=\"flex items-center justify-center p-8\">
        <div className=\"text-center\">
          <Loader2 className=\"h-8 w-8 animate-spin mx-auto mb-4 text-blue-600\" />
          <p className=\"text-gray-600\">Loading secure payment form...</p>
        </div>
      </div>
    );
  }

  if (squareError) {
    return (
      <div className=\"bg-red-50 border border-red-200 rounded-lg p-4\">
        <div className=\"flex items-center\">
          <div className=\"flex-shrink-0\">
            <CreditCard className=\"h-5 w-5 text-red-400\" />
          </div>
          <div className=\"ml-3\">
            <h3 className=\"text-sm font-medium text-red-800\">Payment Form Error</h3>
            <p className=\"text-sm text-red-700 mt-1\">{squareError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className=\"max-w-4xl mx-auto\">
      <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-8\">
        {/* Payment Form */}
        <div className=\"space-y-6\">
          <div className=\"bg-white rounded-lg shadow-sm border p-6\">
            <div className=\"flex items-center mb-4\">
              <CreditCard className=\"h-5 w-5 text-gray-400 mr-2\" />
              <h3 className=\"text-lg font-medium text-gray-900\">Payment Details</h3>
              <div className=\"ml-auto flex items-center text-sm text-gray-500\">
                <Shield className=\"h-4 w-4 mr-1\" />
                <span>Secured by Square</span>
              </div>
            </div>

            {/* Square Card Element */}
            <div className=\"mb-6\">
              <label className=\"block text-sm font-medium text-gray-700 mb-2\">
                Card Information
              </label>
              <div 
                id=\"square-card-container\" 
                className=\"min-h-[120px] border border-gray-300 rounded-lg p-3\"
              />
            </div>

            {/* Billing Information */}
            <div className=\"space-y-4\">
              <h4 className=\"text-md font-medium text-gray-900\">Billing Information</h4>
              
              <div className=\"grid grid-cols-2 gap-4\">
                <Input
                  label=\"First Name\"
                  value={billingInfo.firstName}
                  onChange={(e) => handleBillingChange('firstName', e.target.value)}
                  required
                />
                <Input
                  label=\"Last Name\"
                  value={billingInfo.lastName}
                  onChange={(e) => handleBillingChange('lastName', e.target.value)}
                  required
                />
              </div>

              <Input
                label=\"Email Address\"
                type=\"email\"
                value={billingInfo.email}
                onChange={(e) => handleBillingChange('email', e.target.value)}
                required
              />

              <Input
                label=\"Address\"
                value={billingInfo.addressLine1}
                onChange={(e) => handleBillingChange('addressLine1', e.target.value)}
                required
              />

              <div className=\"grid grid-cols-2 gap-4\">
                <Input
                  label=\"City\"
                  value={billingInfo.locality}
                  onChange={(e) => handleBillingChange('locality', e.target.value)}
                  required
                />
                <Input
                  label=\"State\"
                  value={billingInfo.administrativeDistrictLevel1}
                  onChange={(e) => handleBillingChange('administrativeDistrictLevel1', e.target.value)}
                  required
                />
              </div>

              <div className=\"grid grid-cols-2 gap-4\">
                <Input
                  label=\"ZIP Code\"
                  value={billingInfo.postalCode}
                  onChange={(e) => handleBillingChange('postalCode', e.target.value)}
                  required
                />
                <div>
                  <label className=\"block text-sm font-medium text-gray-700 mb-1\">
                    Country
                  </label>
                  <select
                    value={billingInfo.country}
                    onChange={(e) => handleBillingChange('country', e.target.value)}
                    className=\"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent\"
                  >
                    <option value=\"US\">United States</option>
                    <option value=\"CA\">Canada</option>
                    <option value=\"GB\">United Kingdom</option>
                    <option value=\"AU\">Australia</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className=\"mt-6 flex items-center p-3 bg-gray-50 rounded-lg\">
              <Lock className=\"h-4 w-4 text-gray-400 mr-2\" />
              <p className=\"text-xs text-gray-600\">
                Your payment information is encrypted and secure. We never store your card details.
              </p>
            </div>

            {/* Pay Button */}
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className=\"w-full mt-6\"
              size=\"lg\"
            >
              {isProcessing ? (
                <>
                  <Loader2 className=\"h-4 w-4 animate-spin mr-2\" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard className=\"h-4 w-4 mr-2\" />
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