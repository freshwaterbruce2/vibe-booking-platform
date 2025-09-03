/**
 * Optimized Payment Form Component
 * 
 * High-performance payment form with dynamic imports, lazy loading,
 * and optimized Square payment integration
 */

import React, { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { CreditCard, Shield, Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { usePerformanceMonitor, loadChunk } from '@/utils/frontendOptimization';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { cn } from '@/utils/cn';

// Dynamic imports for payment components
const SquarePaymentComponent = lazy(() => 
  loadChunk(
    () => import('./SquarePaymentComponent'),
    { default: () => <div>Payment component unavailable</div> }
  )
);

const PaymentSummary = lazy(() => import('./PaymentSummary'));
const BillingForm = lazy(() => import('./BillingForm'));

interface OptimizedPaymentFormProps {
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

interface PaymentStep {
  id: string;
  label: string;
  component: React.ComponentType<any>;
  isRequired: boolean;
  isCompleted: boolean;
}

const OptimizedPaymentForm: React.FC<OptimizedPaymentFormProps> = ({
  bookingId,
  amount,
  currency = 'USD',
  onSuccess,
  onError,
  bookingDetails,
  billingDetails
}) => {
  usePerformanceMonitor('OptimizedPaymentForm');

  // Payment state
  const [currentStep, setCurrentStep] = useState<'billing' | 'payment' | 'confirmation'>('billing');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'square' | 'paypal'>('square');
  const [billingData, setBillingData] = useState(billingDetails);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  
  // Performance tracking
  const [componentLoadTimes] = useState(new Map<string, number>());

  // Memoized formatters
  const formattedAmount = useMemo(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  }, [amount, currency]);

  // Memoized payment steps
  const paymentSteps: PaymentStep[] = useMemo(() => [
    {
      id: 'billing',
      label: 'Billing Information',
      component: BillingForm,
      isRequired: true,
      isCompleted: !!billingData?.name && !!billingData?.email
    },
    {
      id: 'payment',
      label: 'Payment Details',
      component: SquarePaymentComponent,
      isRequired: true,
      isCompleted: !!paymentResult
    },
    {
      id: 'confirmation',
      label: 'Confirmation',
      component: () => <div>Confirmation</div>,
      isRequired: false,
      isCompleted: false
    }
  ], [billingData, paymentResult]);

  // Payment processing handler
  const handlePaymentSubmit = useCallback(async (paymentData: any) => {
    setIsProcessing(true);
    
    try {
      const startTime = performance.now();
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const processingTime = performance.now() - startTime;
      console.log(`[Performance] Payment processed in ${processingTime.toFixed(2)}ms`);

      const result = {
        id: `payment_${Date.now()}`,
        amount,
        currency,
        status: 'succeeded',
        bookingId,
        ...paymentData
      };

      setPaymentResult(result);
      setCurrentStep('confirmation');
      onSuccess(result);

    } catch (error) {
      console.error('Payment processing failed:', error);
      onError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  }, [amount, currency, bookingId, onSuccess, onError]);

  // Billing form handler
  const handleBillingSubmit = useCallback((data: any) => {
    setBillingData(data);
    setCurrentStep('payment');
  }, []);

  // Step navigation
  const goToStep = useCallback((step: typeof currentStep) => {
    if (step === 'payment' && !billingData) {
      onError('Please complete billing information first');
      return;
    }
    setCurrentStep(step);
  }, [billingData, onError]);

  // Component loading wrapper with performance tracking
  const LoadingWrapper: React.FC<{ 
    children: React.ReactNode; 
    fallback?: React.ReactNode;
    componentName?: string;
  }> = ({ children, fallback, componentName }) => {
    const defaultFallback = (
      <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
        <Loader2 className="w-6 h-6 animate-spin text-luxury-navy mr-2" />
        <span className="text-gray-600">
          {componentName ? `Loading ${componentName}...` : 'Loading...'}
        </span>
      </div>
    );

    return (
      <Suspense fallback={fallback || defaultFallback}>
        {children}
      </Suspense>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress indicator */}
      <div className="bg-white rounded-xl shadow-luxury-sm p-6">
        <div className="flex items-center justify-between mb-6">
          {paymentSteps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => goToStep(step.id as any)}
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                  currentStep === step.id
                    ? 'border-luxury-navy bg-luxury-navy text-white'
                    : step.isCompleted
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 bg-gray-100 text-gray-500'
                )}
                disabled={isProcessing}
              >
                {step.isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </button>
              
              <div className="ml-3">
                <p className={cn(
                  'text-sm font-medium',
                  currentStep === step.id
                    ? 'text-luxury-navy'
                    : step.isCompleted
                    ? 'text-green-600'
                    : 'text-gray-500'
                )}>
                  {step.label}
                </p>
              </div>

              {index < paymentSteps.length - 1 && (
                <div className={cn(
                  'w-12 h-0.5 mx-4',
                  step.isCompleted ? 'bg-green-500' : 'bg-gray-300'
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main payment form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Security notice */}
          <Card className="bg-blue-50 border-blue-200 p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Secure Payment Processing
                </p>
                <p className="text-xs text-blue-600">
                  Your payment is protected by 256-bit SSL encryption
                </p>
              </div>
              <Lock className="w-4 h-4 text-blue-600 ml-auto" />
            </div>
          </Card>

          {/* Dynamic step content */}
          <Card className="p-6">
            {currentStep === 'billing' && (
              <LoadingWrapper componentName="Billing Form">
                <BillingForm
                  initialData={billingData}
                  onSubmit={handleBillingSubmit}
                  isLoading={isProcessing}
                />
              </LoadingWrapper>
            )}

            {currentStep === 'payment' && (
              <div className="space-y-6">
                {/* Payment method selector */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Choose Payment Method
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      onClick={() => setPaymentMethod('square')}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-lg border-2 transition-colors',
                        paymentMethod === 'square'
                          ? 'border-luxury-navy bg-luxury-navy/5'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <CreditCard className="w-5 h-5 text-luxury-navy" />
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Credit/Debit Card</p>
                        <p className="text-sm text-gray-600">Via Square</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setPaymentMethod('paypal')}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-lg border-2 transition-colors',
                        paymentMethod === 'paypal'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className="w-5 h-5 bg-blue-600 rounded" />
                      <div className="text-left">
                        <p className="font-medium text-gray-900">PayPal</p>
                        <p className="text-sm text-gray-600">Secure payment</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Payment component */}
                {paymentMethod === 'square' && (
                  <LoadingWrapper componentName="Square Payment">
                    <SquarePaymentComponent
                      amount={amount}
                      currency={currency}
                      billingData={billingData}
                      onSubmit={handlePaymentSubmit}
                      isLoading={isProcessing}
                    />
                  </LoadingWrapper>
                )}

                {paymentMethod === 'paypal' && (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">PayPal integration coming soon</p>
                    <Button
                      onClick={() => handlePaymentSubmit({ method: 'paypal' })}
                      disabled={isProcessing}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Simulate PayPal Payment'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {currentStep === 'confirmation' && paymentResult && (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Payment Successful!
                </h3>
                <p className="text-gray-600 mb-4">
                  Your booking has been confirmed. Payment ID: {paymentResult.id}
                </p>
                <p className="text-sm text-gray-500">
                  A confirmation email has been sent to {billingData?.email}
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Payment summary sidebar */}
        <div className="space-y-6">
          <LoadingWrapper componentName="Payment Summary">
            <PaymentSummary
              amount={amount}
              currency={currency}
              bookingDetails={bookingDetails}
              className="sticky top-6"
            />
          </LoadingWrapper>

          {/* Trust indicators */}
          <Card className="p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Why choose us?</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="w-4 h-4 text-green-500" />
                <span>SSL Encrypted</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Instant Confirmation</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CreditCard className="w-4 h-4 text-green-500" />
                <span>No Hidden Fees</span>
              </div>
            </div>
          </Card>

          {/* Performance metrics (development only) */}
          {process.env.NODE_ENV === 'development' && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">
                Performance Metrics
              </h4>
              <div className="text-xs text-blue-700 space-y-1">
                <div>Current Step: {currentStep}</div>
                <div>Components Loaded: {componentLoadTimes.size}</div>
                <div>Payment Method: {paymentMethod}</div>
                <div>Processing: {isProcessing ? 'Yes' : 'No'}</div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export { OptimizedPaymentForm };
export default OptimizedPaymentForm;