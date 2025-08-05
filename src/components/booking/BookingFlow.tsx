import { useState } from 'react';

interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isMainGuest: boolean;
}

interface BookingData {
  hotelId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: Guest[];
  specialRequests: string;
  totalAmount: number;
  paymentMethod: 'credit_card' | 'debit_card' | 'paypal';
  cardDetails?: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardholderName: string;
  };
}

interface BookingFlowProps {
  initialData?: Partial<BookingData>;
  onBookingComplete?: (bookingData: BookingData) => void;
  onCancel?: () => void;
  className?: string;
}

type BookingStep = 'guest-details' | 'preferences' | 'payment' | 'confirmation';

const BookingFlow: React.FC<BookingFlowProps> = ({
  initialData = {},
  onBookingComplete,
  onCancel,
  className = '',
}) => {
  const [currentStep, setCurrentStep] = useState<BookingStep>('guest-details');
  const [bookingData, setBookingData] = useState<Partial<BookingData>>({
    hotelId: 'sample-hotel-id',
    roomId: 'sample-room-id',
    checkIn: '2024-08-10',
    checkOut: '2024-08-15',
    totalAmount: 1495,
    guests: [
      {
        id: '1',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        isMainGuest: true,
      },
    ],
    specialRequests: '',
    paymentMethod: 'credit_card',
    ...initialData,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps: Array<{ id: BookingStep; title: string; description: string }> = [
    { id: 'guest-details', title: 'Guest Details', description: 'Enter guest information' },
    { id: 'preferences', title: 'Preferences', description: 'Special requests and preferences' },
    { id: 'payment', title: 'Payment', description: 'Payment information' },
    { id: 'confirmation', title: 'Confirmation', description: 'Review and confirm booking' },
  ];

  const updateBookingData = (updates: Partial<BookingData>) => {
    setBookingData((prev) => ({ ...prev, ...updates }));
  };

  const updateGuest = (guestId: string, updates: Partial<Guest>) => {
    const updatedGuests = bookingData.guests?.map((guest) =>
      guest.id === guestId ? { ...guest, ...updates } : guest,
    ) || [];
    updateBookingData({ guests: updatedGuests });
  };

  const addGuest = () => {
    const newGuest: Guest = {
      id: Date.now().toString(),
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      isMainGuest: false,
    };
    updateBookingData({ guests: [...(bookingData.guests || []), newGuest] });
  };

  const removeGuest = (guestId: string) => {
    const updatedGuests = bookingData.guests?.filter((guest) => guest.id !== guestId) || [];
    updateBookingData({ guests: updatedGuests });
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 'guest-details') {
      bookingData.guests?.forEach((guest, index) => {
        if (!guest.firstName) {
newErrors[`guest-${index}-firstName`] = 'First name is required';
}
        if (!guest.lastName) {
newErrors[`guest-${index}-lastName`] = 'Last name is required';
}
        if (guest.isMainGuest) {
          if (!guest.email) {
newErrors[`guest-${index}-email`] = 'Email is required';
}
          if (!guest.phone) {
newErrors[`guest-${index}-phone`] = 'Phone is required';
}
        }
      });
    }

    if (currentStep === 'payment') {
      if (!bookingData.paymentMethod) {
newErrors.paymentMethod = 'Payment method is required';
}
      if (bookingData.paymentMethod === 'credit_card' || bookingData.paymentMethod === 'debit_card') {
        if (!bookingData.cardDetails?.cardNumber) {
newErrors.cardNumber = 'Card number is required';
}
        if (!bookingData.cardDetails?.expiryDate) {
newErrors.expiryDate = 'Expiry date is required';
}
        if (!bookingData.cardDetails?.cvv) {
newErrors.cvv = 'CVV is required';
}
        if (!bookingData.cardDetails?.cardholderName) {
newErrors.cardholderName = 'Cardholder name is required';
}
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      const currentIndex = steps.findIndex((step) => step.id === currentStep);
      if (currentIndex < steps.length - 1) {
        setCurrentStep(steps[currentIndex + 1].id);
      }
    }
  };

  const prevStep = () => {
    const currentIndex = steps.findIndex((step) => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const handleCompleteBooking = async () => {
    if (!validateCurrentStep()) {
return;
}

    setIsProcessing(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      onBookingComplete && onBookingComplete(bookingData as BookingData);
    } catch (error) {
      console.error('Booking failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = steps.findIndex((s) => s.id === currentStep) > index;

        return (
          <div key={step.id} className="flex items-center">
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
              ${isActive ? 'border-blue-600 bg-blue-600 text-white' :
                isCompleted ? 'border-green-600 bg-green-600 text-white' :
                'border-gray-300 bg-white text-gray-400'}
            `}>
              {isCompleted ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>

            <div className="ml-3 hidden sm:block">
              <div className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-900'}`}>
                {step.title}
              </div>
              <div className="text-xs text-gray-500">{step.description}</div>
            </div>

            {index < steps.length - 1 && (
              <div className={`
                w-12 sm:w-24 h-0.5 mx-4 transition-colors
                ${isCompleted ? 'bg-green-600' : 'bg-gray-300'}
              `} />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderGuestDetailsStep = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold mb-4">Guest Information</h3>

      {bookingData.guests?.map((guest, index) => (
        <div key={guest.id} className="border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium">
              {guest.isMainGuest ? 'Main Guest' : `Guest ${index + 1}`}
            </h4>
            {!guest.isMainGuest && (
              <button
                onClick={() => removeGuest(guest.id)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={guest.firstName}
                onChange={(e) => updateGuest(guest.id, { firstName: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors[`guest-${index}-firstName`] ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter first name"
              />
              {errors[`guest-${index}-firstName`] && (
                <p className="text-red-500 text-xs mt-1">{errors[`guest-${index}-firstName`]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                value={guest.lastName}
                onChange={(e) => updateGuest(guest.id, { lastName: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors[`guest-${index}-lastName`] ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter last name"
              />
              {errors[`guest-${index}-lastName`] && (
                <p className="text-red-500 text-xs mt-1">{errors[`guest-${index}-lastName`]}</p>
              )}
            </div>

            {guest.isMainGuest && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={guest.email}
                    onChange={(e) => updateGuest(guest.id, { email: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors[`guest-${index}-email`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter email address"
                  />
                  {errors[`guest-${index}-email`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`guest-${index}-email`]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={guest.phone}
                    onChange={(e) => updateGuest(guest.id, { phone: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors[`guest-${index}-phone`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter phone number"
                  />
                  {errors[`guest-${index}-phone`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`guest-${index}-phone`]}</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      ))}

      <button
        onClick={addGuest}
        className="flex items-center px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Another Guest
      </button>
    </div>
  );

  const renderPreferencesStep = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold mb-4">Special Requests & Preferences</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Special Requests (Optional)
        </label>
        <textarea
          value={bookingData.specialRequests || ''}
          onChange={(e) => updateBookingData({ specialRequests: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Any special requests or preferences? (e.g., high floor, quiet room, early check-in)"
        />
        <p className="text-xs text-gray-500 mt-1">
          Special requests are subject to availability and may incur additional charges.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Booking Summary</h4>
        <div className="space-y-1 text-sm text-blue-800">
          <div>Check-in: {bookingData.checkIn}</div>
          <div>Check-out: {bookingData.checkOut}</div>
          <div>Guests: {bookingData.guests?.length || 0}</div>
          <div className="font-semibold">Total: ${bookingData.totalAmount}</div>
        </div>
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold mb-4">Payment Information</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Payment Method *
        </label>
        <div className="space-y-2">
          {[
            { id: 'credit_card', label: 'Credit Card', icon: '💳' },
            { id: 'debit_card', label: 'Debit Card', icon: '💳' },
            { id: 'paypal', label: 'PayPal', icon: '💰' },
          ].map((method) => (
            <label key={method.id} className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="paymentMethod"
                value={method.id}
                checked={bookingData.paymentMethod === method.id}
                onChange={(e) => updateBookingData({ paymentMethod: e.target.value as any })}
                className="mr-3"
              />
              <span className="mr-2">{method.icon}</span>
              <span>{method.label}</span>
            </label>
          ))}
        </div>
      </div>

      {(bookingData.paymentMethod === 'credit_card' || bookingData.paymentMethod === 'debit_card') && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cardholder Name *
            </label>
            <input
              type="text"
              value={bookingData.cardDetails?.cardholderName || ''}
              onChange={(e) => updateBookingData({
                cardDetails: {
                  cardNumber: bookingData.cardDetails?.cardNumber || '',
                  expiryDate: bookingData.cardDetails?.expiryDate || '',
                  cvv: bookingData.cardDetails?.cvv || '',
                  cardholderName: e.target.value,
                },
              })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.cardholderName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Name on card"
            />
            {errors.cardholderName && (
              <p className="text-red-500 text-xs mt-1">{errors.cardholderName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Card Number *
            </label>
            <input
              type="text"
              value={bookingData.cardDetails?.cardNumber || ''}
              onChange={(e) => updateBookingData({
                cardDetails: {
                  cardNumber: e.target.value,
                  expiryDate: bookingData.cardDetails?.expiryDate || '',
                  cvv: bookingData.cardDetails?.cvv || '',
                  cardholderName: bookingData.cardDetails?.cardholderName || '',
                },
              })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.cardNumber ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="1234 5678 9012 3456"
            />
            {errors.cardNumber && (
              <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date *
              </label>
              <input
                type="text"
                value={bookingData.cardDetails?.expiryDate || ''}
                onChange={(e) => updateBookingData({
                  cardDetails: {
                    cardNumber: bookingData.cardDetails?.cardNumber || '',
                    expiryDate: e.target.value,
                    cvv: bookingData.cardDetails?.cvv || '',
                    cardholderName: bookingData.cardDetails?.cardholderName || '',
                  },
                })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.expiryDate ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="MM/YY"
              />
              {errors.expiryDate && (
                <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVV *
              </label>
              <input
                type="text"
                value={bookingData.cardDetails?.cvv || ''}
                onChange={(e) => updateBookingData({
                  cardDetails: {
                    cardNumber: bookingData.cardDetails?.cardNumber || '',
                    expiryDate: bookingData.cardDetails?.expiryDate || '',
                    cvv: e.target.value,
                    cardholderName: bookingData.cardDetails?.cardholderName || '',
                  },
                })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.cvv ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="123"
              />
              {errors.cvv && (
                <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold mb-4">Booking Confirmation</h3>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold mb-4">Booking Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Check-in:</span> {bookingData.checkIn}
          </div>
          <div>
            <span className="font-medium">Check-out:</span> {bookingData.checkOut}
          </div>
          <div>
            <span className="font-medium">Guests:</span> {bookingData.guests?.length || 0}
          </div>
          <div>
            <span className="font-medium">Total Amount:</span> ${bookingData.totalAmount}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold mb-4">Guest Information</h4>
        {bookingData.guests?.map((guest) => (
          <div key={guest.id} className="mb-2 text-sm">
            {guest.firstName} {guest.lastName}
            {guest.isMainGuest && (
              <span className="ml-2 text-blue-600">(Main Guest)</span>
            )}
          </div>
        ))}
      </div>

      {bookingData.specialRequests && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold mb-2">Special Requests</h4>
          <p className="text-sm text-gray-700">{bookingData.specialRequests}</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          By completing this booking, you agree to our terms and conditions and privacy policy.
        </p>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'guest-details':
        return renderGuestDetailsStep();
      case 'preferences':
        return renderPreferencesStep();
      case 'payment':
        return renderPaymentStep();
      case 'confirmation':
        return renderConfirmationStep();
      default:
        return null;
    }
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <div className="bg-white rounded-lg shadow-lg p-6">
        {renderStepIndicator()}

        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
          <div>
            {currentStep !== 'guest-details' && (
              <button
                onClick={prevStep}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
            )}
          </div>

          <div className="flex gap-3">
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}

            {currentStep === 'confirmation' ? (
              <button
                onClick={handleCompleteBooking}
                disabled={isProcessing}
                className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isProcessing ? 'Processing...' : 'Complete Booking'}
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingFlow;