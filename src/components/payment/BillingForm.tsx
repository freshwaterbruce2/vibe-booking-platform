/**
 * Optimized Billing Form Component
 * 
 * High-performance billing form with validation,
 * auto-completion, and optimized rendering
 */

import React, { useState, useCallback, useMemo } from 'react';
import { User, Mail, Phone, MapPin, Check, AlertCircle } from 'lucide-react';
import { usePerformanceMonitor, useDebounce } from '@/utils/frontendOptimization';
import { Button } from '../ui/Button';
import { cn } from '@/utils/cn';

interface BillingFormProps {
  initialData?: {
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
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

interface FormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
  validation?: (value: string) => string | null;
}

interface ValidationErrors {
  [key: string]: string | null;
}

const BillingForm: React.FC<BillingFormProps> = ({
  initialData,
  onSubmit,
  isLoading = false
}) => {
  usePerformanceMonitor('BillingForm');

  // Form state
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: {
      line1: initialData?.address?.line1 || '',
      city: initialData?.address?.city || '',
      state: initialData?.address?.state || '',
      postal_code: initialData?.address?.postal_code || '',
      country: initialData?.address?.country || 'US'
    }
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Debounced form data for validation
  const debouncedFormData = useDebounce(formData, 300);

  // Form field definitions
  const formFields: FormField[] = useMemo(() => [
    {
      name: 'name',
      label: 'Full Name',
      type: 'text',
      required: true,
      placeholder: 'Enter your full name',
      icon: User,
      validation: (value) => {
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return null;
      }
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
      placeholder: 'Enter your email address',
      icon: Mail,
      validation: (value) => {
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return null;
      }
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'tel',
      required: false,
      placeholder: 'Enter your phone number',
      icon: Phone,
      validation: (value) => {
        if (!value.trim()) return null; // Optional field
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(value.replace(/\s|-/g, ''))) {
          return 'Please enter a valid phone number';
        }
        return null;
      }
    }
  ], []);

  const addressFields: FormField[] = useMemo(() => [
    {
      name: 'address.line1',
      label: 'Street Address',
      type: 'text',
      required: true,
      placeholder: 'Enter your street address',
      icon: MapPin,
      validation: (value) => {
        if (!value.trim()) return 'Street address is required';
        return null;
      }
    },
    {
      name: 'address.city',
      label: 'City',
      type: 'text',
      required: true,
      placeholder: 'Enter your city',
      icon: MapPin,
      validation: (value) => {
        if (!value.trim()) return 'City is required';
        return null;
      }
    },
    {
      name: 'address.state',
      label: 'State',
      type: 'text',
      required: true,
      placeholder: 'Enter your state',
      icon: MapPin,
      validation: (value) => {
        if (!value.trim()) return 'State is required';
        return null;
      }
    },
    {
      name: 'address.postal_code',
      label: 'ZIP/Postal Code',
      type: 'text',
      required: true,
      placeholder: 'Enter your ZIP code',
      icon: MapPin,
      validation: (value) => {
        if (!value.trim()) return 'ZIP code is required';
        // US ZIP code validation
        const zipRegex = /^\d{5}(-\d{4})?$/;
        if (!zipRegex.test(value)) return 'Please enter a valid ZIP code';
        return null;
      }
    }
  ], []);

  // Validation function
  const validateField = useCallback((fieldName: string, value: string) => {
    const field = [...formFields, ...addressFields].find(f => f.name === fieldName);
    if (field?.validation) {
      return field.validation(value);
    }
    return null;
  }, [formFields, addressFields]);

  // Get nested value from object
  const getNestedValue = useCallback((obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }, []);

  // Set nested value in object
  const setNestedValue = useCallback((obj: any, path: string, value: string) => {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
    return { ...obj };
  }, []);

  // Validate entire form
  const validateForm = useCallback(() => {
    const errors: ValidationErrors = {};
    
    [...formFields, ...addressFields].forEach(field => {
      const value = getNestedValue(formData, field.name);
      const error = validateField(field.name, value || '');
      if (error) errors[field.name] = error;
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, formFields, addressFields, validateField, getNestedValue]);

  // Handle input changes
  const handleInputChange = useCallback((fieldName: string, value: string) => {
    setFormData(prev => setNestedValue(prev, fieldName, value));
    setTouchedFields(prev => new Set(prev).add(fieldName));
    
    // Clear validation error when user starts typing
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => ({
        ...prev,
        [fieldName]: null
      }));
    }
  }, [validationErrors, setNestedValue]);

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  }, [formData, validateForm, onSubmit]);

  // Real-time validation for touched fields
  React.useEffect(() => {
    touchedFields.forEach(fieldName => {
      const value = getNestedValue(debouncedFormData, fieldName);
      const error = validateField(fieldName, value || '');
      if (error !== validationErrors[fieldName]) {
        setValidationErrors(prev => ({
          ...prev,
          [fieldName]: error
        }));
      }
    });
  }, [debouncedFormData, touchedFields, validateField, validationErrors, getNestedValue]);

  // Form completion percentage
  const completionPercentage = useMemo(() => {
    const totalFields = formFields.length + addressFields.length;
    const filledFields = [...formFields, ...addressFields].filter(field => {
      const value = getNestedValue(formData, field.name);
      return value && value.trim().length > 0;
    }).length;
    
    return Math.round((filledFields / totalFields) * 100);
  }, [formData, formFields, addressFields, getNestedValue]);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return Object.keys(validationErrors).every(key => 
      validationErrors[key] === null
    ) && completionPercentage >= 70; // Require at least 70% completion
  }, [validationErrors, completionPercentage]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Progress indicator */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Billing Information
          </span>
          <span className="text-sm text-gray-600">
            {completionPercentage}% complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              completionPercentage >= 70 ? 'bg-green-500' : 'bg-blue-500'
            )}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Personal Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Personal Information
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {formFields.map(field => {
            const IconComponent = field.icon;
            const value = getNestedValue(formData, field.name) || '';
            const error = validationErrors[field.name];
            const isTouched = touchedFields.has(field.name);

            return (
              <div key={field.name} className={field.name === 'email' ? 'sm:col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IconComponent className={cn(
                      'h-4 w-4',
                      error && isTouched ? 'text-red-400' : 'text-gray-400'
                    )} />
                  </div>
                  <input
                    type={field.type}
                    value={value}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className={cn(
                      'w-full pl-10 pr-10 py-3 border rounded-lg transition-colors',
                      'focus:ring-2 focus:ring-luxury-navy focus:border-luxury-navy',
                      error && isTouched
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300 hover:border-gray-400'
                    )}
                    disabled={isLoading}
                  />
                  {value && !error && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <Check className="h-4 w-4 text-green-500" />
                    </div>
                  )}
                  {error && isTouched && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    </div>
                  )}
                </div>
                {error && isTouched && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {error}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing Address */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Billing Address
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {addressFields.map(field => {
            const IconComponent = field.icon;
            const value = getNestedValue(formData, field.name) || '';
            const error = validationErrors[field.name];
            const isTouched = touchedFields.has(field.name);

            return (
              <div key={field.name} className={field.name === 'address.line1' ? 'sm:col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IconComponent className={cn(
                      'h-4 w-4',
                      error && isTouched ? 'text-red-400' : 'text-gray-400'
                    )} />
                  </div>
                  <input
                    type={field.type}
                    value={value}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className={cn(
                      'w-full pl-10 pr-10 py-3 border rounded-lg transition-colors',
                      'focus:ring-2 focus:ring-luxury-navy focus:border-luxury-navy',
                      error && isTouched
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300 hover:border-gray-400'
                    )}
                    disabled={isLoading}
                  />
                  {value && !error && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <Check className="h-4 w-4 text-green-500" />
                    </div>
                  )}
                  {error && isTouched && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    </div>
                  )}
                </div>
                {error && isTouched && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {error}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Country selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Country
          <span className="text-red-500 ml-1">*</span>
        </label>
        <select
          value={formData.address.country}
          onChange={(e) => handleInputChange('address.country', e.target.value)}
          className="w-full py-3 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-navy focus:border-luxury-navy"
          disabled={isLoading}
        >
          <option value="US">United States</option>
          <option value="CA">Canada</option>
          <option value="UK">United Kingdom</option>
          <option value="AU">Australia</option>
        </select>
      </div>

      {/* Submit button */}
      <div className="pt-4 border-t">
        <Button
          type="submit"
          disabled={!isFormValid || isLoading}
          className="w-full bg-luxury-navy hover:bg-luxury-navy/90 text-white h-12 text-lg font-semibold"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Processing...
            </>
          ) : (
            'Continue to Payment'
          )}
        </Button>
        
        {!isFormValid && (
          <p className="mt-2 text-sm text-gray-600 text-center">
            Please fill in all required fields to continue
          </p>
        )}
      </div>

      {/* Development metrics */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
          Form Valid: {isFormValid ? 'Yes' : 'No'} | 
          Completion: {completionPercentage}% | 
          Errors: {Object.keys(validationErrors).filter(k => validationErrors[k]).length}
        </div>
      )}
    </form>
  );
};

export { BillingForm };
export default BillingForm;