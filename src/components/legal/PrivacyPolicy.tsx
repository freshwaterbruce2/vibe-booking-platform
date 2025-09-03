import React, { useState, useEffect } from 'react';
import { X, Shield, Eye, Database, Cookie, Mail, Phone, MapPin } from 'lucide-react';

interface PrivacyPolicyProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: 'modal' | 'page';
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ 
  isOpen, 
  onClose, 
  variant = 'modal' 
}) => {
  const [activeSection, setActiveSection] = useState<string>('overview');

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
    { id: 'overview', title: 'Overview', icon: Eye },
    { id: 'data-collection', title: 'Data Collection', icon: Database },
    { id: 'data-usage', title: 'How We Use Data', icon: Shield },
    { id: 'data-sharing', title: 'Data Sharing', icon: Mail },
    { id: 'cookies', title: 'Cookies & Tracking', icon: Cookie },
    { id: 'rights', title: 'Your Rights', icon: Shield },
    { id: 'contact', title: 'Contact Us', icon: Phone }
  ];

  const lastUpdated = new Date('2025-08-26');

  if (!isOpen && variant === 'modal') return null;

  const content = (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-luxury-navy to-luxury-forest text-luxury-cream p-8 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-luxury-gold">
              Last updated: {lastUpdated.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          {variant === 'modal' && (
            <button
              onClick={onClose}
              className="text-luxury-cream hover:text-luxury-gold transition-colors p-2"
              aria-label="Close Privacy Policy"
            >
              <X size={24} />
            </button>
          )}
        </div>
        <p className="mt-4 text-luxury-cream/90 leading-relaxed">
          At Vibe Booking, we take your privacy seriously. This policy explains how we collect, 
          use, and protect your personal information when you use our luxury hotel booking platform.
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
        <div className="flex-1 p-8 max-h-96 overflow-y-auto">
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-luxury-navy mb-4">Privacy Overview</h2>
              
              <div className="bg-luxury-cream/50 p-6 rounded-lg border-l-4 border-luxury-gold">
                <h3 className="font-semibold text-luxury-navy mb-2">Our Commitment</h3>
                <p className="text-gray-700">
                  Vibe Booking is committed to protecting your privacy and ensuring the security of your personal data. 
                  We comply with GDPR, CCPA, and other applicable privacy laws.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <Shield className="text-luxury-forest mb-3" size={24} />
                  <h3 className="font-semibold text-luxury-navy mb-2">Data Protection</h3>
                  <p className="text-gray-600 text-sm">
                    We use industry-standard encryption and security measures to protect your information.
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <Eye className="text-luxury-forest mb-3" size={24} />
                  <h3 className="font-semibold text-luxury-navy mb-2">Transparency</h3>
                  <p className="text-gray-600 text-sm">
                    We clearly explain what data we collect and how we use it.
                  </p>
                </div>
              </div>

              <div className="bg-luxury-forest/10 p-6 rounded-lg">
                <h3 className="font-semibold text-luxury-navy mb-3">Key Principles</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start space-x-2">
                    <span className="text-luxury-gold font-bold">•</span>
                    <span>We only collect data necessary for providing our services</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-luxury-gold font-bold">•</span>
                    <span>We never sell your personal data to third parties</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-luxury-gold font-bold">•</span>
                    <span>You have full control over your data and privacy settings</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-luxury-gold font-bold">•</span>
                    <span>We comply with all applicable privacy regulations</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'data-collection' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-luxury-navy mb-4">Data We Collect</h2>
              
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <h3 className="font-semibold text-luxury-navy mb-3 flex items-center">
                    <Database className="mr-2 text-luxury-forest" size={20} />
                    Account Information
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Name, email address, and phone number</li>
                    <li>• Secure password (encrypted and hashed)</li>
                    <li>• Profile preferences and booking history</li>
                    <li>• Communication preferences</li>
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <h3 className="font-semibold text-luxury-navy mb-3">Booking Information</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Hotel preferences and search criteria</li>
                    <li>• Booking dates and guest information</li>
                    <li>• Special requests and accessibility needs</li>
                    <li>• Payment information (processed securely via Square)</li>
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <h3 className="font-semibold text-luxury-navy mb-3">Usage Data</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Pages visited and features used</li>
                    <li>• Search queries and filters applied</li>
                    <li>• Device information and browser type</li>
                    <li>• IP address and general location (city/country)</li>
                  </ul>
                </div>
              </div>

              <div className="bg-luxury-gold/10 p-6 rounded-lg border-l-4 border-luxury-gold">
                <p className="font-medium text-luxury-navy mb-2">Important Note:</p>
                <p className="text-gray-700 text-sm">
                  We never store credit card numbers or sensitive payment data on our servers. 
                  All payment processing is handled securely by Square with PCI-DSS compliance.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'data-usage' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-luxury-navy mb-4">How We Use Your Data</h2>
              
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <h3 className="font-semibold text-luxury-navy mb-3 text-luxury-forest">Primary Uses</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Process and manage your hotel bookings</li>
                    <li>• Send booking confirmations and updates</li>
                    <li>• Provide customer support and assistance</li>
                    <li>• Process payments and refunds securely</li>
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <h3 className="font-semibold text-luxury-navy mb-3">Service Improvement</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Personalize your booking experience</li>
                    <li>• Recommend hotels based on your preferences</li>
                    <li>• Improve our website and mobile app</li>
                    <li>• Analyze usage patterns to enhance features</li>
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <h3 className="font-semibold text-luxury-navy mb-3">Communication</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Send important account and booking notifications</li>
                    <li>• Provide customer support via email or phone</li>
                    <li>• Send promotional offers (with your consent)</li>
                    <li>• Notify about policy changes or updates</li>
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <h3 className="font-semibold text-luxury-navy mb-3">Legal Compliance</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Comply with applicable laws and regulations</li>
                    <li>• Prevent fraud and ensure platform security</li>
                    <li>• Respond to legal requests when required</li>
                    <li>• Maintain audit trails for financial transactions</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'data-sharing' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-luxury-navy mb-4">Data Sharing</h2>
              
              <div className="bg-luxury-forest/10 p-6 rounded-lg border-l-4 border-luxury-forest">
                <h3 className="font-semibold text-luxury-navy mb-2">Our Promise</h3>
                <p className="text-gray-700">
                  We never sell your personal data. We only share information when necessary to provide 
                  our services or as required by law.
                </p>
              </div>

              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <h3 className="font-semibold text-luxury-navy mb-3">Service Providers</h3>
                  <p className="text-gray-700 mb-3">We share data with trusted partners who help us operate our platform:</p>
                  <ul className="space-y-2 text-gray-600">
                    <li>• <strong>Hotels:</strong> Booking details for reservation processing</li>
                    <li>• <strong>Payment Processors:</strong> Square for secure payment handling</li>
                    <li>• <strong>Email Service:</strong> SendGrid for transactional emails</li>
                    <li>• <strong>Analytics:</strong> Aggregated, non-personal usage data</li>
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <h3 className="font-semibold text-luxury-navy mb-3">Legal Requirements</h3>
                  <p className="text-gray-700 mb-3">We may disclose information when legally required:</p>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Court orders or legal process</li>
                    <li>• Law enforcement requests with valid warrants</li>
                    <li>• Protection of our legal rights and property</li>
                    <li>• Prevention of fraud or illegal activities</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'cookies' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-luxury-navy mb-4">Cookies & Tracking</h2>
              
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <h3 className="font-semibold text-luxury-navy mb-3 flex items-center">
                    <Cookie className="mr-2 text-luxury-gold" size={20} />
                    Essential Cookies
                  </h3>
                  <p className="text-gray-700 mb-3">Required for basic platform functionality:</p>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Authentication and login status</li>
                    <li>• Shopping cart and booking session</li>
                    <li>• Security and fraud prevention</li>
                    <li>• Language and region preferences</li>
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <h3 className="font-semibold text-luxury-navy mb-3">Analytics Cookies</h3>
                  <p className="text-gray-700 mb-3">Help us understand how you use our platform:</p>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Page views and popular content</li>
                    <li>• User journey and navigation patterns</li>
                    <li>• Performance and error tracking</li>
                    <li>• Feature usage statistics</li>
                  </ul>
                  <p className="text-sm text-gray-500 mt-3">
                    <span className="font-medium">Note:</span> You can opt-out of analytics cookies in your browser settings.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <h3 className="font-semibold text-luxury-navy mb-3">Marketing Cookies</h3>
                  <p className="text-gray-700 mb-3">Used for personalized marketing (with your consent):</p>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Personalized hotel recommendations</li>
                    <li>• Retargeting for abandoned bookings</li>
                    <li>• Email marketing personalization</li>
                    <li>• Social media integration</li>
                  </ul>
                  <p className="text-sm text-gray-500 mt-3">
                    <span className="font-medium">Control:</span> Manage marketing cookies through our cookie consent banner.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'rights' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-luxury-navy mb-4">Your Privacy Rights</h2>
              
              <div className="bg-luxury-navy/10 p-6 rounded-lg mb-6">
                <p className="text-luxury-navy font-medium">
                  Under GDPR, CCPA, and other privacy laws, you have comprehensive rights regarding your personal data.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <h3 className="font-semibold text-luxury-navy mb-3">Access & Portability</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Request a copy of your data</li>
                    <li>• Download your booking history</li>
                    <li>• View data processing activities</li>
                    <li>• Export data in common formats</li>
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <h3 className="font-semibold text-luxury-navy mb-3">Correction & Updates</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Update your profile information</li>
                    <li>• Correct inaccurate data</li>
                    <li>• Modify communication preferences</li>
                    <li>• Change privacy settings</li>
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <h3 className="font-semibold text-luxury-navy mb-3">Deletion & Erasure</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Request account deletion</li>
                    <li>• Remove specific data entries</li>
                    <li>• Clear browsing and search history</li>
                    <li>• Withdraw consent for processing</li>
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <h3 className="font-semibold text-luxury-navy mb-3">Object & Restrict</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Object to marketing communications</li>
                    <li>• Restrict certain data processing</li>
                    <li>• Opt-out of analytics tracking</li>
                    <li>• Limit automated decision-making</li>
                  </ul>
                </div>
              </div>

              <div className="bg-luxury-gold/10 p-6 rounded-lg">
                <h3 className="font-semibold text-luxury-navy mb-3">How to Exercise Your Rights</h3>
                <p className="text-gray-700 mb-3">Contact us to exercise your privacy rights:</p>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  <a href="mailto:privacy@vibebooking.com" 
                     className="bg-luxury-navy text-luxury-cream px-4 py-2 rounded-lg hover:bg-luxury-forest transition-colors text-center">
                    Email Privacy Team
                  </a>
                  <a href="/privacy-request" 
                     className="border border-luxury-navy text-luxury-navy px-4 py-2 rounded-lg hover:bg-luxury-navy hover:text-luxury-cream transition-colors text-center">
                    Submit Privacy Request
                  </a>
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  We will respond to your request within 30 days as required by law.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'contact' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-luxury-navy mb-4">Contact Us</h2>
              
              <div className="bg-luxury-cream/50 p-6 rounded-lg">
                <p className="text-luxury-navy mb-6">
                  Have questions about our privacy policy or your data? We're here to help.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <div className="flex items-center mb-4">
                    <Mail className="text-luxury-gold mr-3" size={24} />
                    <h3 className="font-semibold text-luxury-navy">Privacy Team</h3>
                  </div>
                  <p className="text-gray-700 mb-2">For privacy-related inquiries:</p>
                  <a href="mailto:privacy@vibebooking.com" 
                     className="text-luxury-navy hover:text-luxury-forest underline font-medium">
                    privacy@vibebooking.com
                  </a>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10">
                  <div className="flex items-center mb-4">
                    <Phone className="text-luxury-gold mr-3" size={24} />
                    <h3 className="font-semibold text-luxury-navy">Support Line</h3>
                  </div>
                  <p className="text-gray-700 mb-2">Mon-Fri, 9AM-6PM EST:</p>
                  <a href="tel:+1-555-VIBE-BOOK" 
                     className="text-luxury-navy hover:text-luxury-forest underline font-medium">
                    +1 (555) VIBE-BOOK
                  </a>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-luxury border border-luxury-navy/10 md:col-span-2">
                  <div className="flex items-center mb-4">
                    <MapPin className="text-luxury-gold mr-3" size={24} />
                    <h3 className="font-semibold text-luxury-navy">Mailing Address</h3>
                  </div>
                  <div className="text-gray-700">
                    <p>Vibe Booking Privacy Office</p>
                    <p>123 Luxury Lane, Suite 456</p>
                    <p>San Francisco, CA 94102</p>
                    <p>United States</p>
                  </div>
                </div>
              </div>

              <div className="bg-luxury-forest/10 p-6 rounded-lg">
                <h3 className="font-semibold text-luxury-navy mb-3">Data Protection Officer</h3>
                <p className="text-gray-700 mb-3">
                  For EU residents or GDPR-specific inquiries, you can contact our Data Protection Officer:
                </p>
                <a href="mailto:dpo@vibebooking.com" 
                   className="text-luxury-navy hover:text-luxury-forest underline font-medium">
                  dpo@vibebooking.com
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
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

export default PrivacyPolicy;