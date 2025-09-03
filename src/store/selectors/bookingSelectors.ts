/**
 * Optimized Booking Store Selectors
 * 
 * Memoized selectors for booking flow optimization
 */

import { useMemo } from 'react';
import { useBookingStore } from '../bookingStore';

// Base selectors
export const useCurrentStep = () => useBookingStore(state => state.currentStep);
export const useGuestDetails = () => useBookingStore(state => state.guestDetails);
export const useSelectedRoom = () => useBookingStore(state => state.selectedRoom);
export const usePaymentInfo = () => useBookingStore(state => state.paymentInfo);
export const useBookingConfirmation = () => useBookingStore(state => state.confirmation);
export const useBookingErrors = () => useBookingStore(state => state.errors);
export const useBookingLoading = () => useBookingStore(state => state.loading);

// Computed selectors
export const useBookingProgress = () => {
  const currentStep = useCurrentStep();
  
  return useMemo(() => {
    const steps = ['room-selection', 'guest-details', 'payment', 'confirmation'];
    const currentIndex = steps.indexOf(currentStep);
    const progress = ((currentIndex + 1) / steps.length) * 100;
    
    return {
      currentIndex,
      totalSteps: steps.length,
      progress: Math.round(progress),
      isFirstStep: currentIndex === 0,
      isLastStep: currentIndex === steps.length - 1,
      nextStep: currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null,
      previousStep: currentIndex > 0 ? steps[currentIndex - 1] : null
    };
  }, [currentStep]);
};

// Form validation selectors
export const useGuestDetailsValidation = () => {
  const guestDetails = useGuestDetails();
  
  return useMemo(() => {
    const errors: Record<string, string> = {};
    
    if (!guestDetails.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!guestDetails.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!guestDetails.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestDetails.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!guestDetails.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(guestDetails.phone.replace(/\s|-/g, ''))) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    if (guestDetails.adults < 1) {
      errors.adults = 'At least one adult is required';
    }
    
    if (guestDetails.children < 0) {
      errors.children = 'Children count cannot be negative';
    }
    
    const isValid = Object.keys(errors).length === 0;
    
    return {
      isValid,
      errors,
      requiredFields: ['firstName', 'lastName', 'email', 'phone'],
      completedFields: Object.keys(guestDetails).filter(key => 
        guestDetails[key as keyof typeof guestDetails]
      ).length
    };
  }, [guestDetails]);
};

export const usePaymentValidation = () => {
  const paymentInfo = usePaymentInfo();
  
  return useMemo(() => {
    const errors: Record<string, string> = {};
    
    if (!paymentInfo.cardNumber.trim()) {
      errors.cardNumber = 'Card number is required';
    } else if (!/^\d{13,19}$/.test(paymentInfo.cardNumber.replace(/\s/g, ''))) {
      errors.cardNumber = 'Please enter a valid card number';
    }
    
    if (!paymentInfo.expiryDate.trim()) {
      errors.expiryDate = 'Expiry date is required';
    } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(paymentInfo.expiryDate)) {
      errors.expiryDate = 'Please enter a valid expiry date (MM/YY)';
    }
    
    if (!paymentInfo.cvv.trim()) {
      errors.cvv = 'CVV is required';
    } else if (!/^\d{3,4}$/.test(paymentInfo.cvv)) {
      errors.cvv = 'Please enter a valid CVV';
    }
    
    if (!paymentInfo.cardholderName.trim()) {
      errors.cardholderName = 'Cardholder name is required';
    }
    
    // Billing address validation
    const billing = paymentInfo.billingAddress;
    if (!billing.street.trim()) {
      errors.billingStreet = 'Billing address is required';
    }
    
    if (!billing.city.trim()) {
      errors.billingCity = 'City is required';
    }
    
    if (!billing.state.trim()) {
      errors.billingState = 'State is required';
    }
    
    if (!billing.zipCode.trim()) {
      errors.billingZipCode = 'ZIP code is required';
    }
    
    if (!billing.country.trim()) {
      errors.billingCountry = 'Country is required';
    }
    
    const isValid = Object.keys(errors).length === 0;
    
    return {
      isValid,
      errors,
      completionPercentage: Math.round(
        (Object.values(paymentInfo).filter(Boolean).length / 6) * 100
      )
    };
  }, [paymentInfo]);
};

// Booking summary selector
export const useBookingSummary = () => {
  const selectedRoom = useSelectedRoom();
  const guestDetails = useGuestDetails();
  const confirmation = useBookingConfirmation();
  
  return useMemo(() => {
    if (!selectedRoom) return null;
    
    const basePrice = selectedRoom.price.amount;
    const nights = selectedRoom.nights || 1;
    const subtotal = basePrice * nights;
    
    // Calculate taxes and fees
    const taxRate = 0.12; // 12% tax
    const serviceFee = 25; // Fixed service fee
    const taxes = subtotal * taxRate;
    const total = subtotal + taxes + serviceFee;
    
    return {
      room: {
        name: selectedRoom.name,
        type: selectedRoom.type,
        pricePerNight: basePrice,
        nights,
        subtotal
      },
      guests: {
        adults: guestDetails.adults,
        children: guestDetails.children,
        total: guestDetails.adults + guestDetails.children
      },
      pricing: {
        subtotal,
        taxes,
        serviceFee,
        total,
        currency: selectedRoom.price.currency || 'USD'
      },
      dates: selectedRoom.dates,
      confirmation: confirmation ? {
        id: confirmation.id,
        status: confirmation.status,
        createdAt: confirmation.createdAt
      } : null
    };
  }, [selectedRoom, guestDetails, confirmation]);
};

// Step validation selector
export const useStepValidation = (step?: string) => {
  const currentStep = step || useCurrentStep();
  const guestValidation = useGuestDetailsValidation();
  const paymentValidation = usePaymentValidation();
  const selectedRoom = useSelectedRoom();
  
  return useMemo(() => {
    switch (currentStep) {
      case 'room-selection':
        return {
          isValid: !!selectedRoom,
          canProceed: !!selectedRoom,
          errors: selectedRoom ? {} : { room: 'Please select a room' }
        };
        
      case 'guest-details':
        return {
          isValid: guestValidation.isValid,
          canProceed: guestValidation.isValid,
          errors: guestValidation.errors
        };
        
      case 'payment':
        return {
          isValid: paymentValidation.isValid,
          canProceed: paymentValidation.isValid,
          errors: paymentValidation.errors
        };
        
      case 'confirmation':
        return {
          isValid: true,
          canProceed: false,
          errors: {}
        };
        
      default:
        return {
          isValid: false,
          canProceed: false,
          errors: { step: 'Invalid step' }
        };
    }
  }, [currentStep, selectedRoom, guestValidation, paymentValidation]);
};

// Error handling selectors
export const useBookingErrorsForStep = (step?: string) => {
  const allErrors = useBookingErrors();
  const currentStep = step || useCurrentStep();
  
  return useMemo(() => {
    return allErrors[currentStep] || {};
  }, [allErrors, currentStep]);
};

export const useHasBookingErrors = () => {
  const errors = useBookingErrors();
  
  return useMemo(() => {
    return Object.values(errors).some(stepErrors => 
      Object.keys(stepErrors).length > 0
    );
  }, [errors]);
};

// Loading state selectors
export const useIsStepLoading = (step?: string) => {
  const loading = useBookingLoading();
  const currentStep = step || useCurrentStep();
  
  return useMemo(() => {
    return loading[currentStep] || false;
  }, [loading, currentStep]);
};

// Booking completion selector
export const useBookingCompletion = () => {
  const guestValidation = useGuestDetailsValidation();
  const paymentValidation = usePaymentValidation();
  const selectedRoom = useSelectedRoom();
  const confirmation = useBookingConfirmation();
  
  return useMemo(() => {
    const steps = {
      roomSelection: !!selectedRoom,
      guestDetails: guestValidation.isValid,
      payment: paymentValidation.isValid,
      confirmation: !!confirmation
    };
    
    const completedSteps = Object.values(steps).filter(Boolean).length;
    const totalSteps = Object.keys(steps).length;
    
    return {
      steps,
      completedSteps,
      totalSteps,
      completionPercentage: Math.round((completedSteps / totalSteps) * 100),
      isComplete: completedSteps === totalSteps
    };
  }, [selectedRoom, guestValidation.isValid, paymentValidation.isValid, confirmation]);
};