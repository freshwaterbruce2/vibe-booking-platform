import React, { useState, useEffect } from 'react';
import { X, FileText, Users, CreditCard, Shield, AlertTriangle, Phone } from 'lucide-react';

interface TermsOfServiceProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: (accepted: boolean) => void;
  variant?: 'modal' | 'page';
  requireAcceptance?: boolean;
}

export const TermsOfService: React.FC<TermsOfServiceProps> = ({ 
  isOpen, 
  onClose, 
  onAccept,
  variant = 'modal',
  requireAcceptance = false
}) => {
  const [activeSection, setActiveSection] = useState<string>('agreement');
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (isOpen && variant === 'modal') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, variant]);

  const sections = [
    { id: 'agreement', title: 'Agreement to Terms', icon: FileText },
    { id: 'services', title: 'Our Services', icon: Users },
    { id: 'accounts', title: 'User Accounts', icon: Users },
    { id: 'booking', title: 'Booking Terms', icon: CreditCard },
    { id: 'payments', title: 'Payment Terms', icon: CreditCard },
    { id: 'cancellation', title: 'Cancellation Policy', icon: AlertTriangle },
    { id: 'liability', title: 'Liability', icon: Shield },
    { id: 'contact', title: 'Contact', icon: Phone }
  ];

  const lastUpdated = new Date('2025-08-26');

  const handleAcceptance = () => {
    setAccepted(true);
    onAccept?.(true);
    
    // Track acceptance
    const acceptanceData = {
      document: 'terms-of-service',
      version: '2.0',
      timestamp: new Date().toISOString(),
      userId: localStorage.getItem('userId') || null
    };
    
    // Send to backend for tracking
    fetch('/api/legal/accept/terms-of-service', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(acceptanceData)
    }).catch(console.error);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
    if (isAtBottom && !hasScrolledToEnd) {
      setHasScrolledToEnd(true);
    }
  };

  if (!isOpen && variant === 'modal') return null;

  const content = (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-luxury-navy to-luxury-forest text-luxury-cream p-8 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
            <p className="text-luxury-gold">
              Last updated: {lastUpdated.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          {variant === 'modal' && !requireAcceptance && (
            <button
              onClick={onClose}
              className="text-luxury-cream hover:text-luxury-gold transition-colors p-2"
              aria-label="Close Terms of Service"
            >
              <X size={24} />
            </button>
          )}
        </div>
        <p className="mt-4 text-luxury-cream/90 leading-relaxed">
          By using Vibe Booking, you agree to these terms. Please read them carefully as they 
          contain important information about your rights and obligations.
        </p>
      </div>

      <div className="flex bg-white rounded-b-2xl shadow-luxury-xl overflow-hidden">
        {/* Navigation Sidebar */}
        <div className="w-64 bg-luxury-cream border-r border-luxury-navy/10 p-6">
          <nav className="space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                    activeSection === section.id
                      ? 'bg-luxury-navy text-luxury-cream shadow-luxury-md'
                      : 'text-luxury-navy hover:bg-luxury-navy/10'
                  }`}
                >
                  <Icon size={18} />
                  <span className="font-medium">{section.title}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div 
          className="flex-1 p-8 max-h-96 overflow-y-auto" 
          onScroll={requireAcceptance ? handleScroll : undefined}
        >
          {activeSection === 'agreement' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-luxury-navy mb-4">Agreement to Terms</h2>
              
              <div className="bg-luxury-cream/50 p-6 rounded-lg border-l-4 border-luxury-gold">
                <h3 className="font-semibold text-luxury-navy mb-2">Binding Agreement</h3>
                <p className="text-gray-700">
                  By accessing and using the Vibe Booking platform, you agree to be bound by these 
                  Terms of Service and all applicable laws and regulations.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-luxury-navy">What This Means:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start space-x-2">
                    <span className="text-luxury-gold font-bold">•</span>
                    <span>You must be at least 18 years old to use our services</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-luxury-gold font-bold">•</span>
                    <span>You agree to use the platform lawfully and responsibly</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-luxury-gold font-bold">•</span>
                    <span>These terms govern your relationship with Vibe Booking</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-luxury-gold font-bold">•</span>
                    <span>If you disagree with any terms, you should not use our services</span>
                  </li>
                </ul>
              </div>

              <div className="bg-luxury-forest/10 p-6 rounded-lg">
                <h3 className="font-semibold text-luxury-navy mb-3">Updates to Terms</h3>
                <p className="text-gray-700">
                  We may update these terms periodically. Material changes will be communicated 
                  at least 30 days before taking effect. Continued use after changes constitutes 
                  acceptance of the updated terms.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'services' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-luxury-navy mb-4">Our Services</h2>
              
              <div className="bg-luxury-cream/50 p-6 rounded-lg">
                <p className="text-luxury-navy font-medium mb-3">
                  Vibe Booking provides a luxury hotel booking platform that connects travelers 
                  with premium accommodations worldwide.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <h3 className="font-semibold text-luxury-navy mb-3">Platform Features</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Hotel search and comparison</li>
                    <li>• Secure online booking</li>
                    <li>• Payment processing</li>
                    <li>• Customer support</li>
                    <li>• Personalized recommendations</li>
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <h3 className="font-semibold text-luxury-navy mb-3">Service Quality</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Curated luxury accommodations</li>
                    <li>• 24/7 customer support</li>
                    <li>• Secure payment processing</li>
                    <li>• Best price guarantee</li>
                    <li>• Instant booking confirmation</li>
                  </ul>
                </div>
              </div>

              <div className="bg-luxury-gold/10 p-6 rounded-lg border-l-4 border-luxury-gold">
                <h3 className="font-semibold text-luxury-navy mb-2">Service Availability</h3>
                <p className="text-gray-700">
                  We strive to maintain 99.9% uptime, but services may occasionally be unavailable 
                  due to maintenance, updates, or unforeseen circumstances. We are not liable for 
                  temporary service interruptions.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'accounts' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-luxury-navy mb-4">User Accounts</h2>
              
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <h3 className="font-semibold text-luxury-navy mb-3">Account Registration</h3>
                  <p className="text-gray-700 mb-3">
                    You must provide accurate information when creating an account and maintain 
                    the security of your login credentials.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Provide accurate and current information</li>
                    <li>• Maintain the security of your account</li>
                    <li>• Comply with all applicable laws</li>
                    <li>• Report security breaches immediately</li>
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <h3 className="font-semibold text-luxury-navy mb-3">Prohibited Activities</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>❌ Creating fake or fraudulent accounts</li>
                    <li>❌ Sharing account credentials with others</li>
                    <li>❌ Using automated systems to access the platform</li>
                    <li>❌ Attempting to circumvent security measures</li>
                    <li>❌ Violating any applicable laws or regulations</li>
                  </ul>
                </div>

                <div className="bg-luxury-forest/10 p-6 rounded-lg">
                  <h3 className="font-semibold text-luxury-navy mb-3">Account Termination</h3>
                  <p className="text-gray-700">
                    You may terminate your account at any time. We reserve the right to terminate 
                    accounts that violate these terms or engage in prohibited activities.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'booking' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-luxury-navy mb-4">Booking Terms</h2>
              
              <div className="space-y-6">
                <div className="bg-luxury-cream/50 p-6 rounded-lg border-l-4 border-luxury-gold">
                  <h3 className="font-semibold text-luxury-navy mb-2">Booking Process</h3>
                  <p className="text-gray-700">
                    All bookings are subject to hotel availability and confirmation. Rates and 
                    availability may change until booking confirmation is received.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                    <h3 className="font-semibold text-luxury-navy mb-3">Confirmation</h3>
                    <p className="text-gray-700 text-sm mb-3">
                      Booking confirmations are sent via email and should be presented at hotel check-in.
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Instant email confirmation</li>
                      <li>• Unique booking reference</li>
                      <li>• Hotel contact information</li>
                      <li>• Check-in/check-out details</li>
                    </ul>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                    <h3 className="font-semibold text-luxury-navy mb-3">Modifications</h3>
                    <p className="text-gray-700 text-sm mb-3">
                      Booking modifications are subject to hotel policies and may incur additional fees.
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Date changes (subject to availability)</li>
                      <li>• Room type modifications</li>
                      <li>• Guest information updates</li>
                      <li>• Special requests</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-luxury-gold/10 p-6 rounded-lg">
                  <h3 className="font-semibold text-luxury-navy mb-3">Important Notes</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Hotel policies supersede our platform terms for property-specific matters</li>
                    <li>• Age restrictions and identification requirements vary by hotel</li>
                    <li>• Special requests are not guaranteed and depend on hotel availability</li>
                    <li>• Group bookings (5+ rooms) may have different terms and conditions</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'payments' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-luxury-navy mb-4">Payment Terms</h2>
              
              <div className="bg-luxury-forest/10 p-6 rounded-lg border-l-4 border-luxury-forest mb-6">
                <h3 className="font-semibold text-luxury-navy mb-2">Secure Processing</h3>
                <p className="text-gray-700">
                  All payments are processed securely through Square with PCI-DSS compliance. 
                  We never store your payment information on our servers.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <h3 className="font-semibold text-luxury-navy mb-3">Accepted Payment Methods</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>💳 Credit Cards (Visa, Mastercard, Amex, Discover)</li>
                    <li>💳 Debit Cards</li>
                    <li>📱 Apple Pay</li>
                    <li>📱 Google Pay</li>
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <h3 className="font-semibold text-luxury-navy mb-3">Commission Structure</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>📊 5% platform commission</li>
                    <li>💰 Included in total price</li>
                    <li>🔒 Transparent pricing</li>
                    <li>📧 Detailed receipts provided</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <h3 className="font-semibold text-luxury-navy mb-3">Refund Policy</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Refunds processed according to hotel cancellation policies</li>
                    <li>• Processing time: 5-10 business days to original payment method</li>
                    <li>• Platform commission may be non-refundable for cancelled bookings</li>
                    <li>• Exceptional circumstances may qualify for special consideration</li>
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <h3 className="font-semibold text-luxury-navy mb-3">Payment Disputes</h3>
                  <p className="text-gray-700 mb-3">
                    Payment disputes should be reported within 60 days of the transaction date.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Contact our support team first</li>
                    <li>• Provide transaction details and evidence</li>
                    <li>• We work with Square to resolve disputes</li>
                    <li>• Chargeback protection for valid transactions</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'cancellation' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-luxury-navy mb-4">Cancellation Policy</h2>
              
              <div className="bg-luxury-cream/50 p-6 rounded-lg border-l-4 border-luxury-gold mb-6">
                <h3 className="font-semibold text-luxury-navy mb-2">Policy Overview</h3>
                <p className="text-gray-700">
                  Cancellation policies are determined by individual hotels and vary by rate type 
                  and booking date. Please review carefully before booking.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <h3 className="font-semibold text-luxury-navy mb-3 text-green-700">Refundable Rates</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>✅ Free cancellation until deadline</li>
                    <li>✅ Full refund if cancelled in time</li>
                    <li>✅ Flexibility for plan changes</li>
                    <li>📅 Typical deadline: 24-48 hours before check-in</li>
                  </ul>
                  <p className="text-sm text-gray-500 mt-3">
                    Higher rates but maximum flexibility
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <h3 className="font-semibold text-luxury-navy mb-3 text-red-700">Non-Refundable Rates</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>❌ No cancellations allowed</li>
                    <li>❌ No refunds under normal circumstances</li>
                    <li>💰 Lower prices for committed bookings</li>
                    <li>⚡ Best value for certain travel dates</li>
                  </ul>
                  <p className="text-sm text-gray-500 mt-3">
                    Lower rates but no flexibility
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <h3 className="font-semibold text-luxury-navy mb-3">Special Circumstances</h3>
                  <p className="text-gray-700 mb-3">
                    We may provide additional flexibility for exceptional situations:
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li>🌪️ Natural disasters affecting travel</li>
                    <li>🚫 Government travel restrictions</li>
                    <li>🏥 Medical emergencies (documentation required)</li>
                    <li>✈️ Airline schedule changes or cancellations</li>
                  </ul>
                </div>

                <div className="bg-luxury-gold/10 p-6 rounded-lg">
                  <h3 className="font-semibold text-luxury-navy mb-3">Processing Timeline</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Eligible refunds processed within 5-10 business days</li>
                    <li>• Refunds return to original payment method</li>
                    <li>• Email confirmation sent when refund is processed</li>
                    <li>• Bank processing may take additional 1-3 business days</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'liability' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-luxury-navy mb-4">Limitation of Liability</h2>
              
              <div className="bg-luxury-cream/50 p-6 rounded-lg border-l-4 border-luxury-gold mb-6">
                <h3 className="font-semibold text-luxury-navy mb-2">Platform Role</h3>
                <p className="text-gray-700">
                  Vibe Booking acts as an intermediary between travelers and hotels. We are not 
                  responsible for hotel services, accommodations, or experiences.
                </p>
              </div>

              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <h3 className="font-semibold text-luxury-navy mb-3">Our Limitations</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• We do not guarantee hotel availability or service quality</li>
                    <li>• Hotel ratings and descriptions are provided by third parties</li>
                    <li>• We are not liable for indirect, incidental, or consequential damages</li>
                    <li>• Our liability is limited to the amount paid for booking services</li>
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <h3 className="font-semibold text-luxury-navy mb-3">User Responsibility</h3>
                  <p className="text-gray-700 mb-3">
                    Users are responsible for verifying hotel information and understanding booking 
                    terms before completing reservations.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Verify travel document requirements</li>
                    <li>• Check hotel policies and restrictions</li>
                    <li>• Understand cancellation terms</li>
                    <li>• Report issues directly to hotels during stay</li>
                  </ul>
                </div>

                <div className="bg-luxury-forest/10 p-6 rounded-lg">
                  <h3 className="font-semibold text-luxury-navy mb-3">Legal Framework</h3>
                  <p className="text-gray-700">
                    These limitations are governed by California law and do not affect your statutory 
                    rights as a consumer where applicable. For disputes under $10,000, binding 
                    arbitration may be required.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'contact' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-luxury-navy mb-4">Contact Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <div className="flex items-center mb-4">
                    <Phone className="text-luxury-gold mr-3" size={24} />
                    <h3 className="font-semibold text-luxury-navy">Customer Support</h3>
                  </div>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>Phone:</strong> +1 (555) VIBE-BOOK</p>
                    <p><strong>Email:</strong> support@vibebooking.com</p>
                    <p><strong>Hours:</strong> 24/7 availability</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <div className="flex items-center mb-4">
                    <FileText className="text-luxury-gold mr-3" size={24} />
                    <h3 className="font-semibold text-luxury-navy">Legal Department</h3>
                  </div>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>Email:</strong> legal@vibebooking.com</p>
                    <p><strong>Response:</strong> 5-7 business days</p>
                    <p><strong>Issues:</strong> Terms, disputes, compliance</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                <h3 className="font-semibold text-luxury-navy mb-4">Mailing Address</h3>
                <div className="text-gray-700">
                  <p>Vibe Booking Legal Department</p>
                  <p>123 Luxury Lane, Suite 456</p>
                  <p>San Francisco, CA 94102</p>
                  <p>United States</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Acceptance Section for Modal */}
      {requireAcceptance && variant === 'modal' && (
        <div className="bg-luxury-cream p-6 rounded-b-2xl border-t border-luxury-navy/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="accept-terms"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="w-5 h-5 text-luxury-navy border-2 border-luxury-navy/30 rounded focus:ring-luxury-navy"
              />
              <label htmlFor="accept-terms" className="text-luxury-navy font-medium">
                I have read and agree to the Terms of Service
              </label>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-3 border-2 border-luxury-navy text-luxury-navy rounded-lg hover:bg-luxury-navy hover:text-luxury-cream transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptance}
                disabled={!accepted || !hasScrolledToEnd}
                className={`px-6 py-3 rounded-lg transition-colors ${
                  accepted && hasScrolledToEnd
                    ? 'bg-luxury-navy text-luxury-cream hover:bg-luxury-forest'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Accept Terms
              </button>
            </div>
          </div>
          {!hasScrolledToEnd && (
            <p className="text-sm text-gray-500 mt-2">
              Please scroll through all sections to enable acceptance
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (variant === 'page') {
    return <div className="min-h-screen bg-luxury-cream/30 py-8 px-4">{content}</div>;
  }

  // Modal variant
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {content}
      </div>
    </div>
  );
};

export default TermsOfService;