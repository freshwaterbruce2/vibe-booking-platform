import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, AlertCircle, CreditCard, User, Calendar, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '../ui/Input';
import { useBookingStore } from '@/store/bookingStore';
import { useSearchStore } from '@/store/searchStore';
import { useHotelStore } from '@/store/hotelStore';
import type { Room } from '@/types/hotel';
import { cn } from '@/utils/cn';

interface BookingFlowProps {
  selectedRoom?: Room;
  onBookingComplete?: (bookingId: string) => void;
  onCancel?: () => void;
  className?: string;
}

type BookingStep = 'room-selection' | 'guest-details' | 'payment' | 'confirmation';

const BookingFlow: React.FC<BookingFlowProps> = ({
  selectedRoom: propSelectedRoom,
  onBookingComplete,
  onCancel,
  className = '',
}) => {
  const {
    currentStep,
    guestDetails,
    selectedRoom,
    paymentInfo,
    confirmation,
    errors,
    loading,
    setCurrentStep,
    setGuestDetails,
    setSelectedRoom,
    setPaymentInfo,
    nextStep,
    previousStep,
    validateCurrentStep,
    setLoading,
    clearBooking,
  } = useBookingStore();

  const { selectedDateRange, guestCount } = useSearchStore();
  const { selectedHotel } = useHotelStore();

  const [cardNumberFormatted, setCardNumberFormatted] = useState('');
  const [expiryFormatted, setExpiryFormatted] = useState('');

  useEffect(() => {
    if (propSelectedRoom && !selectedRoom) {
      setSelectedRoom(propSelectedRoom);
    }
  }, [propSelectedRoom, selectedRoom, setSelectedRoom]);

  const steps: Array<{ id: BookingStep; title: string; description: string; icon: any }> = [
    { id: 'room-selection', title: 'Room Selection', description: 'Choose your room', icon: Calendar },
    { id: 'guest-details', title: 'Guest Details', description: 'Enter guest information', icon: User },
    { id: 'payment', title: 'Payment', description: 'Payment information', icon: CreditCard },
    { id: 'confirmation', title: 'Confirmation', description: 'Review and confirm booking', icon: ShieldCheck },
  ];

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .substr(0, 5);
  };

  const totalNights = selectedDateRange.checkIn && selectedDateRange.checkOut
    ? Math.ceil((new Date(selectedDateRange.checkOut).getTime() - new Date(selectedDateRange.checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 1;

  const totalAmount = selectedRoom ? selectedRoom.price * totalNights : 0;

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    setCardNumberFormatted(formatted);
    setPaymentInfo({ cardNumber: formatted.replace(/\s/g, '') });
  };

  const handleExpiryChange = (value: string) => {
    const formatted = formatExpiry(value);
    setExpiryFormatted(formatted);
    setPaymentInfo({ expiryDate: formatted });
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      nextStep();
    }
  };

  const handlePreviousStep = () => {
    previousStep();
  };


  const handleCompleteBooking = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    setLoading(true);
    try {
      // Simulate API call to create booking
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const bookingId = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      onBookingComplete && onBookingComplete(bookingId);
    } catch (error) {
      console.error('Booking failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => {
    const currentIndex = steps.findIndex((s) => s.id === currentStep);

    return (
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = currentIndex > index;
          const IconComponent = step.icon;

          return (
            <div key={step.id} className="flex items-center">
              <div className={cn(
                'flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300',
                isActive
                  ? 'border-primary-600 bg-primary-600 text-white shadow-lg scale-110'
                  : isCompleted
                    ? 'border-green-600 bg-green-600 text-white'
                    : 'border-gray-300 bg-white text-gray-400'
              )}>
                {isCompleted ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <IconComponent className="w-6 h-6" />
                )}
              </div>

              <div className="ml-4 hidden sm:block">
                <div className={cn(
                  'text-sm font-medium transition-colors',
                  isActive ? 'text-primary-600' : 'text-gray-900 dark:text-white'
                )}>
                  {step.title}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{step.description}</div>
              </div>

              {index < steps.length - 1 && (
                <div className={cn(
                  'w-12 sm:w-24 h-0.5 mx-6 transition-colors duration-300',
                  isCompleted ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                )} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderRoomSelectionStep = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Room Selection</h3>

      {selectedRoom ? (
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-1/3">
              <img
                src={selectedRoom.images[0] || '/placeholder-room.jpg'}
                alt={selectedRoom.name}
                className="w-full h-48 object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-room.jpg';
                }}
              />
            </div>

            <div className="lg:w-2/3">
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {selectedRoom.name}
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {selectedRoom.description}
              </p>

              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <span>ðŸ‘¥ Up to {selectedRoom.capacity} guests</span>
                <span>ðŸ›ï¸ {selectedRoom.type}</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {selectedRoom.amenities.map((amenity, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300 text-sm rounded-full"
                  >
                    {amenity}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <div className="text-2xl font-bold text-primary-600">
                    {formatPrice(selectedRoom.price, selectedRoom.currency)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">per night</div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    Total: {formatPrice(totalAmount, selectedRoom.currency)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {totalNights} night{totalNights > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">No room selected. Please select a room first.</p>
        </div>
      )}
    </div>
  );

  const renderGuestDetailsStep = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Guest Information</h3>

      <Card className="p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Main Guest</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              First Name *
            </label>
            <Input
              value={guestDetails.firstName}
              onChange={(e) => setGuestDetails({ firstName: e.target.value })}
              className={errors.firstName ? 'border-red-500' : ''}
              placeholder="Enter first name"
            />
            {errors.firstName && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.firstName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Last Name *
            </label>
            <Input
              value={guestDetails.lastName}
              onChange={(e) => setGuestDetails({ lastName: e.target.value })}
              className={errors.lastName ? 'border-red-500' : ''}
              placeholder="Enter last name"
            />
            {errors.lastName && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.lastName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email *
            </label>
            <Input
              type="email"
              value={guestDetails.email}
              onChange={(e) => setGuestDetails({ email: e.target.value })}
              className={errors.email ? 'border-red-500' : ''}
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone *
            </label>
            <Input
              type="tel"
              value={guestDetails.phone}
              onChange={(e) => setGuestDetails({ phone: e.target.value })}
              className={errors.phone ? 'border-red-500' : ''}
              placeholder="Enter phone number"
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.phone}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Special Requests (Optional)
          </label>
          <textarea
            value={guestDetails.specialRequests}
            onChange={(e) => setGuestDetails({ specialRequests: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Any special requests or preferences?"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Special requests are subject to availability and may incur additional charges.
          </p>
        </div>
      </Card>
    </div>
  );


  const renderPaymentStep = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Payment Information</h3>

      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cardholder Name *
            </label>
            <Input
              value={paymentInfo.cardholderName}
              onChange={(e) => setPaymentInfo({ cardholderName: e.target.value })}
              className={errors.cardholderName ? 'border-red-500' : ''}
              placeholder="Name on card"
            />
            {errors.cardholderName && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.cardholderName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Card Number *
            </label>
            <Input
              value={cardNumberFormatted}
              onChange={(e) => handleCardNumberChange(e.target.value)}
              className={errors.cardNumber ? 'border-red-500' : ''}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
            />
            {errors.cardNumber && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.cardNumber}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expiry Date *
              </label>
              <Input
                value={expiryFormatted}
                onChange={(e) => handleExpiryChange(e.target.value)}
                className={errors.expiryDate ? 'border-red-500' : ''}
                placeholder="MM/YY"
                maxLength={5}
              />
              {errors.expiryDate && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.expiryDate}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                CVV *
              </label>
              <Input
                value={paymentInfo.cvv}
                onChange={(e) => setPaymentInfo({ cvv: e.target.value.replace(/\D/g, '').substr(0, 4) })}
                className={errors.cvv ? 'border-red-500' : ''}
                placeholder="123"
                maxLength={4}
              />
              {errors.cvv && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.cvv}
                </p>
              )}
            </div>
          </div>

          {/* Billing Address */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Billing Address</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Street Address
                </label>
                <Input
                  value={paymentInfo.billingAddress.street}
                  onChange={(e) => setPaymentInfo({
                    billingAddress: { ...paymentInfo.billingAddress, street: e.target.value }
                  })}
                  placeholder="123 Main Street"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  City
                </label>
                <Input
                  value={paymentInfo.billingAddress.city}
                  onChange={(e) => setPaymentInfo({
                    billingAddress: { ...paymentInfo.billingAddress, city: e.target.value }
                  })}
                  placeholder="New York"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ZIP Code
                </label>
                <Input
                  value={paymentInfo.billingAddress.zipCode}
                  onChange={(e) => setPaymentInfo({
                    billingAddress: { ...paymentInfo.billingAddress, zipCode: e.target.value }
                  })}
                  placeholder="10001"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Payment Summary */}
      {selectedRoom && (
        <Card className="p-6 bg-primary-50 dark:bg-primary-900/20">
          <h4 className="font-medium text-primary-900 dark:text-primary-300 mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Payment Summary
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-primary-800 dark:text-primary-400">Room Rate ({totalNights} nights)</span>
              <span className="font-medium">{formatPrice(selectedRoom.price * totalNights, selectedRoom.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-800 dark:text-primary-400">Taxes & Fees</span>
              <span className="font-medium">{formatPrice(totalAmount * 0.15, selectedRoom.currency)}</span>
            </div>
            <div className="border-t border-primary-200 dark:border-primary-700 pt-2 mt-2">
              <div className="flex justify-between text-lg font-semibold text-primary-900 dark:text-primary-300">
                <span>Total</span>
                <span>{formatPrice(totalAmount * 1.15, selectedRoom.currency)}</span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Review Your Booking
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Please review all details before confirming your reservation
        </p>
      </div>

      {/* Hotel & Room Details */}
      {selectedHotel && selectedRoom && (
        <Card className="p-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Hotel & Room Details</h4>
          <div className="flex gap-4 mb-4">
            <img
              src={selectedRoom.images[0] || '/placeholder-room.jpg'}
              alt={selectedRoom.name}
              className="w-20 h-20 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h5 className="font-medium text-gray-900 dark:text-white">{selectedHotel.name}</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">{selectedRoom.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {selectedHotel.location.city}, {selectedHotel.location.country}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Check-in:</span>
              <div>{selectedDateRange.checkIn}</div>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Check-out:</span>
              <div>{selectedDateRange.checkOut}</div>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Guests:</span>
              <div>{guestCount.adults} adults{guestCount.children > 0 && `, ${guestCount.children} children`}</div>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Duration:</span>
              <div>{totalNights} night{totalNights > 1 ? 's' : ''}</div>
            </div>
          </div>
        </Card>
      )}

      {/* Guest Information */}
      <Card className="p-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Guest Information</h4>
        <div className="text-sm">
          <div className="mb-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">Name:</span> {guestDetails.firstName} {guestDetails.lastName}
          </div>
          <div className="mb-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span> {guestDetails.email}
          </div>
          <div className="mb-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">Phone:</span> {guestDetails.phone}
          </div>
          {guestDetails.specialRequests && (
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Special Requests:</span>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{guestDetails.specialRequests}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Payment Summary */}
      {selectedRoom && (
        <Card className="p-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Payment Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Room Rate ({totalNights} nights)</span>
              <span>{formatPrice(selectedRoom.price * totalNights, selectedRoom.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Taxes & Fees</span>
              <span>{formatPrice(totalAmount * 0.15, selectedRoom.currency)}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
              <div className="flex justify-between text-lg font-semibold text-gray-900 dark:text-white">
                <span>Total Amount</span>
                <span>{formatPrice(totalAmount * 1.15, selectedRoom.currency)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CreditCard className="w-4 h-4" />
              <span>Payment will be charged to card ending in ****{paymentInfo.cardNumber.slice(-4)}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Terms */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium mb-1">Terms & Conditions</p>
            <p>
              By completing this booking, you agree to our terms and conditions and privacy policy.
              Your booking is protected by our secure payment system.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'room-selection':
        return renderRoomSelectionStep();
      case 'guest-details':
        return renderGuestDetailsStep();
      case 'payment':
        return renderPaymentStep();
      case 'confirmation':
        return renderConfirmationStep();
      default:
        return null;
    }
  };

  return (
    <div className={cn('max-w-4xl mx-auto', className)}>
      <Card className="p-8">
        {renderStepIndicator()}

        <div className="min-h-[500px]">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div>
            {currentStep !== 'room-selection' && (
              <Button
                onClick={handlePreviousStep}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
            )}
          </div>

          <div className="flex gap-3">
            {onCancel && (
              <Button
                onClick={() => {
                  clearBooking();
                  onCancel();
                }}
                variant="outline"
              >
                Cancel
              </Button>
            )}

            {currentStep === 'confirmation' ? (
              <Button
                onClick={handleCompleteBooking}
                disabled={loading}
                loading={loading}
                className="bg-green-600 hover:bg-green-700 px-8"
                size="lg"
              >
                {loading ? 'Processing...' : 'Complete Booking'}
              </Button>
            ) : (
              <Button
                onClick={handleNextStep}
                className="flex items-center gap-2 px-6"
                size="lg"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export { BookingFlow };
export default BookingFlow;
