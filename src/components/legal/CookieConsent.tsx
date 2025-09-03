import React, { useState, useEffect } from 'react';
import { Cookie, Settings, Check, X, Info, Shield } from 'lucide-react';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

interface CookieConsentProps {
  onPreferencesChange?: (preferences: CookiePreferences) => void;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({ onPreferencesChange }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    personalization: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const hasConsent = localStorage.getItem('vibe-booking-cookie-consent');
    const savedPreferences = localStorage.getItem('vibe-booking-cookie-preferences');
    
    if (!hasConsent) {
      // Show banner after 1 second delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    } else if (savedPreferences) {
      // Load saved preferences
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences(parsed);
        onPreferencesChange?.(parsed);
      } catch (error) {
        console.error('Failed to parse cookie preferences:', error);
      }
    }
  }, [onPreferencesChange]);

  const savePreferences = (prefs: CookiePreferences, consentType: 'accept-all' | 'accept-selected' | 'reject-all' = 'accept-selected') => {
    localStorage.setItem('vibe-booking-cookie-consent', new Date().toISOString());
    localStorage.setItem('vibe-booking-cookie-preferences', JSON.stringify(prefs));
    localStorage.setItem('vibe-booking-consent-type', consentType);
    
    setPreferences(prefs);
    onPreferencesChange?.(prefs);
    setIsVisible(false);

    // Track consent decision
    try {
      fetch('/api/analytics/cookie-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consentType,
          preferences: prefs,
          timestamp: new Date().toISOString(),
        }),
      }).catch(console.error);
    } catch (error) {
      console.error('Failed to track cookie consent:', error);
    }
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      analytics: true,
      marketing: true,
      personalization: true,
    };
    savePreferences(allAccepted, 'accept-all');
  };

  const handleRejectAll = () => {
    const onlyEssential: CookiePreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      personalization: false,
    };
    savePreferences(onlyEssential, 'reject-all');
  };

  const handleSaveSelected = () => {
    savePreferences(preferences, 'accept-selected');
  };

  const updatePreference = (type: keyof CookiePreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [type]: type === 'essential' ? true : value // Essential cookies cannot be disabled
    }));
  };

  const cookieTypes = [
    {
      id: 'essential',
      title: 'Essential Cookies',
      description: 'Required for the website to function properly. These cannot be disabled.',
      examples: 'Authentication, security, shopping cart, language preferences',
      required: true,
      icon: Shield,
      color: 'text-green-600',
    },
    {
      id: 'analytics',
      title: 'Analytics Cookies',
      description: 'Help us understand how visitors interact with our website to improve user experience.',
      examples: 'Google Analytics, page views, user journeys, performance metrics',
      required: false,
      icon: Info,
      color: 'text-blue-600',
    },
    {
      id: 'marketing',
      title: 'Marketing Cookies',
      description: 'Used to deliver personalized advertisements and measure campaign effectiveness.',
      examples: 'Facebook Pixel, retargeting ads, conversion tracking',
      required: false,
      icon: Cookie,
      color: 'text-purple-600',
    },
    {
      id: 'personalization',
      title: 'Personalization Cookies',
      description: 'Remember your preferences to provide a customized experience.',
      examples: 'Preferred hotels, search filters, personalized recommendations',
      required: false,
      icon: Settings,
      color: 'text-orange-600',
    },
  ];

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />
      
      {/* Cookie Consent Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-luxury-xl border border-luxury-navy/10 overflow-hidden">
            {!showDetails ? (
              /* Simple Banner */
              <div className="p-6 md:p-8">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-luxury-gold/10 rounded-full flex items-center justify-center">
                      <Cookie className="w-6 h-6 text-luxury-gold" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-luxury-navy mb-2">
                      We use cookies to enhance your experience
                    </h3>
                    <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-4">
                      We use essential cookies to make our site work. We'd also like to set optional cookies 
                      to help us improve our website and provide personalized recommendations. By clicking 
                      "Accept All", you consent to all cookies. You can customize your preferences by 
                      clicking "Manage Preferences".
                    </p>
                    
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                      <button
                        onClick={handleAcceptAll}
                        className="flex items-center justify-center px-6 py-3 bg-luxury-navy text-luxury-cream rounded-lg hover:bg-luxury-forest transition-colors font-medium"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Accept All
                      </button>
                      
                      <button
                        onClick={handleRejectAll}
                        className="flex items-center justify-center px-6 py-3 border-2 border-luxury-navy text-luxury-navy rounded-lg hover:bg-luxury-navy hover:text-luxury-cream transition-colors font-medium"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject All
                      </button>
                      
                      <button
                        onClick={() => setShowDetails(true)}
                        className="flex items-center justify-center px-6 py-3 text-luxury-navy hover:bg-luxury-navy/5 rounded-lg transition-colors font-medium"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Manage Preferences
                      </button>
                    </div>

                    <div className="mt-4 text-xs text-gray-500">
                      By continuing to use our website, you agree to our{' '}
                      <a href="/privacy-policy" className="text-luxury-navy underline hover:text-luxury-forest">
                        Privacy Policy
                      </a>
                      {' '}and{' '}
                      <a href="/terms-of-service" className="text-luxury-navy underline hover:text-luxury-forest">
                        Terms of Service
                      </a>.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Detailed Preferences */
              <div className="p-6 md:p-8 max-h-[70vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-luxury-gold/10 rounded-full flex items-center justify-center">
                      <Cookie className="w-5 h-5 text-luxury-gold" />
                    </div>
                    <h3 className="text-xl font-semibold text-luxury-navy">
                      Cookie Preferences
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    aria-label="Close preferences"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-gray-600 mb-6 leading-relaxed">
                  We use different types of cookies to provide you with the best possible experience. 
                  You can choose which cookies you're comfortable with, but essential cookies are 
                  required for the website to function properly.
                </p>

                <div className="space-y-6">
                  {cookieTypes.map((type) => {
                    const Icon = type.icon;
                    const isEnabled = preferences[type.id as keyof CookiePreferences];
                    
                    return (
                      <div key={type.id} className="bg-luxury-cream/30 rounded-lg p-6 border border-luxury-navy/5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-luxury-sm`}>
                              <Icon className={`w-5 h-5 ${type.color}`} />
                            </div>
                            <div>
                              <h4 className="font-semibold text-luxury-navy">{type.title}</h4>
                              {type.required && (
                                <span className="text-xs text-green-600 font-medium">Required</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex-shrink-0">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isEnabled}
                                onChange={(e) => updatePreference(type.id as keyof CookiePreferences, e.target.checked)}
                                disabled={type.required}
                                className="sr-only peer"
                              />
                              <div className={`relative w-11 h-6 rounded-full peer transition-colors duration-200 ease-in-out ${
                                isEnabled 
                                  ? type.required ? 'bg-green-500' : 'bg-luxury-navy' 
                                  : 'bg-gray-200'
                              } ${type.required ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                <div className={`absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform duration-200 ease-in-out ${
                                  isEnabled ? 'translate-x-full border-white' : 'translate-x-0'
                                }`}></div>
                              </div>
                            </label>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                          {type.description}
                        </p>
                        
                        <div className="bg-white/50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">
                            <strong>Examples:</strong> {type.examples}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-6 border-t border-luxury-navy/10 space-y-3 sm:space-y-0">
                  <div className="text-sm text-gray-500">
                    You can change these preferences at any time in your account settings.
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleRejectAll}
                      className="px-6 py-3 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Reject All
                    </button>
                    
                    <button
                      onClick={handleAcceptAll}
                      className="px-6 py-3 bg-luxury-gold text-white rounded-lg hover:bg-luxury-gold/90 transition-colors font-medium"
                    >
                      Accept All
                    </button>
                    
                    <button
                      onClick={handleSaveSelected}
                      className="px-6 py-3 bg-luxury-navy text-luxury-cream rounded-lg hover:bg-luxury-forest transition-colors font-medium"
                    >
                      Save Preferences
                    </button>
                  </div>
                </div>

                {/* Privacy Links */}
                <div className="mt-6 pt-4 border-t border-luxury-navy/5 text-center">
                  <p className="text-xs text-gray-500">
                    Learn more about how we use cookies in our{' '}
                    <a href="/privacy-policy" className="text-luxury-navy underline hover:text-luxury-forest">
                      Privacy Policy
                    </a>
                    {' '}or contact us at{' '}
                    <a href="mailto:privacy@vibebooking.com" className="text-luxury-navy underline hover:text-luxury-forest">
                      privacy@vibebooking.com
                    </a>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CookieConsent;