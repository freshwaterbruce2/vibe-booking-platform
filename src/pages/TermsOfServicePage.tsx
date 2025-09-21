import { Scale, UserCheck, CreditCard, Calendar } from 'lucide-react';

export function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-luxury-cream to-white">
      {/* Hero Section */}
      <section className="relative py-20 bg-luxury-gradient">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-md rounded-full mb-6">
              <Scale className="h-10 w-10 text-gold-400" />
            </div>
            <h1 className="text-5xl md:text-6xl font-light text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
              Terms of Service
              <span className="block text-3xl md:text-4xl mt-2 bg-luxury-gold-gradient bg-clip-text text-transparent">
                Clear & Fair
              </span>
            </h1>
            <p className="text-xl text-white/80 mb-8 leading-relaxed">
              These terms govern your use of Vibe Hotels' services. We believe in transparency
              and fairness, ensuring you understand your rights and responsibilities.
            </p>
            <div className="text-white/60 text-sm">
              Last updated: January 15, 2025
            </div>
          </div>
        </div>
      </section>

      {/* Key Terms Overview */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-slate-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Key Terms Overview
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              The essential terms you need to know
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="p-8 bg-white rounded-xl shadow-luxury">
              <CreditCard className="h-12 w-12 text-luxury-gold mb-6" />
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Payment Terms</h3>
              <p className="text-slate-600">
                Secure payment processing with clear pricing. No hidden fees or surprise charges.
              </p>
            </div>

            <div className="p-8 bg-white rounded-xl shadow-luxury">
              <Calendar className="h-12 w-12 text-luxury-gold mb-6" />
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Cancellation Policy</h3>
              <p className="text-slate-600">
                Flexible cancellation options that vary by hotel and rate type. Check details before booking.
              </p>
            </div>

            <div className="p-8 bg-white rounded-xl shadow-luxury">
              <UserCheck className="h-12 w-12 text-luxury-gold mb-6" />
              <h3 className="text-xl font-semibold mb-4 text-slate-800">User Responsibilities</h3>
              <p className="text-slate-600">
                Use our platform respectfully and provide accurate information for bookings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Terms */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-luxury p-8 md:p-12 space-y-12">

              <div>
                <h2 className="text-3xl font-light text-slate-800 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                  1. Acceptance of Terms
                </h2>
                <div className="space-y-6 text-slate-600 leading-relaxed">
                  <p>
                    By accessing or using Vibe Hotels' website, mobile applications, or services, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our services.
                  </p>
                  <p>
                    We may modify these terms at any time, and such modifications will be effective immediately upon posting. Your continued use of our services constitutes acceptance of the modified terms.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-light text-slate-800 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                  2. Booking and Reservations
                </h2>
                <div className="space-y-6 text-slate-600 leading-relaxed">
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">Booking Process</h4>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-luxury-gold rounded-full mt-2 flex-shrink-0"></div>
                        <span>All bookings are subject to availability and confirmation</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-luxury-gold rounded-full mt-2 flex-shrink-0"></div>
                        <span>Prices are quoted in USD and include applicable taxes unless otherwise stated</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-luxury-gold rounded-full mt-2 flex-shrink-0"></div>
                        <span>Special requests are subject to availability and additional charges may apply</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">Pricing and Payment</h4>
                    <p>
                      Room rates may vary based on occupancy, seasonal demand, and special events. Payment is required at the time of booking unless otherwise specified. We accept major credit cards and PayPal.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-light text-slate-800 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                  3. Cancellation and Modification
                </h2>
                <div className="space-y-6 text-slate-600 leading-relaxed">
                  <div className="bg-slate-50 p-6 rounded-lg">
                    <h4 className="font-semibold text-slate-800 mb-3">Standard Cancellation Policy</h4>
                    <ul className="space-y-2">
                      <li><strong>Free Cancellation:</strong> Up to 24 hours before check-in</li>
                      <li><strong>Partial Refund:</strong> 24 hours to 7 days before check-in (50% refund)</li>
                      <li><strong>No Refund:</strong> Within 24 hours of check-in or no-show</li>
                    </ul>
                    <p className="mt-4 text-sm text-slate-500">
                      * Policies may vary by hotel and rate type. Check specific terms before booking.
                    </p>
                  </div>
                  <p>
                    Modifications to existing bookings are subject to availability and may incur additional charges. Contact our support team for assistance with changes.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-light text-slate-800 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                  4. User Conduct
                </h2>
                <div className="space-y-6 text-slate-600 leading-relaxed">
                  <p>When using our services, you agree to:</p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <UserCheck className="h-5 w-5 text-luxury-gold mt-0.5 flex-shrink-0" />
                      <span>Provide accurate and complete information</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <UserCheck className="h-5 w-5 text-luxury-gold mt-0.5 flex-shrink-0" />
                      <span>Use the platform only for lawful purposes</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <UserCheck className="h-5 w-5 text-luxury-gold mt-0.5 flex-shrink-0" />
                      <span>Respect other users and hotel properties</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <UserCheck className="h-5 w-5 text-luxury-gold mt-0.5 flex-shrink-0" />
                      <span>Comply with hotel-specific terms and policies</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-light text-slate-800 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                  5. Rewards Program
                </h2>
                <div className="space-y-6 text-slate-600 leading-relaxed">
                  <p>
                    Our rewards program allows you to earn points on eligible bookings. Points have no cash value and cannot be transferred. The program is subject to separate terms and conditions, which may be modified at our discretion.
                  </p>
                  <div className="bg-luxury-gold/10 p-6 rounded-lg border border-luxury-gold/20">
                    <h4 className="font-semibold text-slate-800 mb-3">Rewards Benefits</h4>
                    <ul className="space-y-2">
                      <li>• Earn 5% in rewards on every booking</li>
                      <li>• Redeem points for future stays and upgrades</li>
                      <li>• Exclusive member rates and early access to deals</li>
                      <li>• Priority customer support</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-light text-slate-800 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                  6. Limitation of Liability
                </h2>
                <div className="space-y-6 text-slate-600 leading-relaxed">
                  <p>
                    Vibe Hotels acts as an intermediary between you and hotel partners. We are not responsible for the quality of accommodations, services, or any issues that arise during your stay. Our liability is limited to the amount you paid for your booking.
                  </p>
                  <p>
                    We make every effort to ensure accuracy of information on our platform, but we cannot guarantee that all details are completely accurate or up-to-date.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-light text-slate-800 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                  7. Privacy and Data Protection
                </h2>
                <div className="space-y-6 text-slate-600 leading-relaxed">
                  <p>
                    Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these terms by reference. By using our services, you consent to the collection and use of your information as described in our Privacy Policy.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-light text-slate-800 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                  8. Governing Law and Disputes
                </h2>
                <div className="space-y-6 text-slate-600 leading-relaxed">
                  <p>
                    These terms are governed by the laws of California, United States. Any disputes arising from these terms or your use of our services will be resolved through binding arbitration rather than in court, except for certain types of disputes as specified in our complete terms.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-light text-slate-800 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                  9. Contact Information
                </h2>
                <div className="space-y-6 text-slate-600 leading-relaxed">
                  <p>
                    If you have any questions about these Terms of Service, please contact us:
                  </p>
                  <div className="space-y-2">
                    <p><strong>Email:</strong> legal@vibehotels.com</p>
                    <p><strong>Phone:</strong> +1 (888) VIBE-LEGAL</p>
                    <p><strong>Address:</strong> 123 Luxury Lane, Beverly Hills, CA 90210</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-luxury-gradient relative">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-light text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
            Questions About Our Terms?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Our legal team is available to clarify any questions about these terms.
          </p>
          <button className="px-8 py-4 bg-luxury-gold-gradient text-white font-medium rounded-lg hover:scale-105 transform transition-all duration-300 shadow-luxury-lg">
            Contact Legal Team
          </button>
        </div>
      </section>
    </div>
  );
}