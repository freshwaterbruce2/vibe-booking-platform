import { Shield, Lock, Eye, UserCheck, Database } from 'lucide-react';

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-luxury-cream to-white">
      {/* Hero Section */}
      <section className="relative py-20 bg-luxury-gradient">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-md rounded-full mb-6">
              <Shield className="h-10 w-10 text-gold-400" />
            </div>
            <h1 className="text-5xl md:text-6xl font-light text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
              Privacy Policy
              <span className="block text-3xl md:text-4xl mt-2 bg-luxury-gold-gradient bg-clip-text text-transparent">
                Your Trust, Our Priority
              </span>
            </h1>
            <p className="text-xl text-white/80 mb-8 leading-relaxed">
              At Vibe Hotels, we are committed to protecting your privacy and ensuring the security
              of your personal information. This policy outlines how we collect, use, and safeguard your data.
            </p>
            <div className="text-white/60 text-sm">
              Last updated: January 15, 2025
            </div>
          </div>
        </div>
      </section>

      {/* Quick Overview */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-slate-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Privacy at a Glance
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Your privacy rights and how we protect them
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="p-8 bg-white rounded-xl shadow-luxury">
              <Lock className="h-12 w-12 text-luxury-gold mb-6" />
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Data Security</h3>
              <p className="text-slate-600">
                256-bit SSL encryption and industry-leading security measures protect your information.
              </p>
            </div>

            <div className="p-8 bg-white rounded-xl shadow-luxury">
              <UserCheck className="h-12 w-12 text-luxury-gold mb-6" />
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Your Control</h3>
              <p className="text-slate-600">
                You have full control over your data with easy options to view, update, or delete.
              </p>
            </div>

            <div className="p-8 bg-white rounded-xl shadow-luxury">
              <Eye className="h-12 w-12 text-luxury-gold mb-6" />
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Transparency</h3>
              <p className="text-slate-600">
                Clear, straightforward communication about how we use your information.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Policy */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-luxury p-8 md:p-12 space-y-12">

              <div>
                <h2 className="text-3xl font-light text-slate-800 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Information We Collect
                </h2>
                <div className="space-y-6 text-slate-600 leading-relaxed">
                  <p>
                    <strong className="text-slate-800">Personal Information:</strong> We collect information you provide directly, including name, email address, phone number, payment details, and travel preferences.
                  </p>
                  <p>
                    <strong className="text-slate-800">Booking Information:</strong> Details about your reservations, stays, and interactions with our services.
                  </p>
                  <p>
                    <strong className="text-slate-800">Usage Data:</strong> Information about how you use our website and mobile app, including pages visited and features used.
                  </p>
                  <p>
                    <strong className="text-slate-800">Location Information:</strong> General location data to provide relevant hotel recommendations and services.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-light text-slate-800 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                  How We Use Your Information
                </h2>
                <div className="space-y-4 text-slate-600 leading-relaxed">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-luxury-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Process bookings and provide customer service</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-luxury-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Personalize your experience and recommendations</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-luxury-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Send important updates about your reservations</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-luxury-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Improve our services and develop new features</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-luxury-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Comply with legal obligations and prevent fraud</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-light text-slate-800 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Information Sharing
                </h2>
                <div className="space-y-6 text-slate-600 leading-relaxed">
                  <p>
                    We do not sell your personal information. We may share your information only in these circumstances:
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-luxury-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span><strong>Hotel Partners:</strong> To complete your reservations and provide services</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-luxury-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span><strong>Service Providers:</strong> Trusted partners who help us operate our platform</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-luxury-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span><strong>Legal Requirements:</strong> When required by law or to protect our rights</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-light text-slate-800 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Your Privacy Rights
                </h2>
                <div className="space-y-6 text-slate-600 leading-relaxed">
                  <p>You have the right to:</p>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <UserCheck className="h-5 w-5 text-luxury-gold mt-0.5 flex-shrink-0" />
                        <span>Access your personal information</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <UserCheck className="h-5 w-5 text-luxury-gold mt-0.5 flex-shrink-0" />
                        <span>Correct inaccurate data</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <UserCheck className="h-5 w-5 text-luxury-gold mt-0.5 flex-shrink-0" />
                        <span>Delete your account</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <UserCheck className="h-5 w-5 text-luxury-gold mt-0.5 flex-shrink-0" />
                        <span>Opt-out of marketing communications</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <UserCheck className="h-5 w-5 text-luxury-gold mt-0.5 flex-shrink-0" />
                        <span>Request data portability</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <UserCheck className="h-5 w-5 text-luxury-gold mt-0.5 flex-shrink-0" />
                        <span>Lodge a complaint</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-light text-slate-800 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Data Security
                </h2>
                <div className="space-y-6 text-slate-600 leading-relaxed">
                  <p>
                    We implement industry-standard security measures to protect your information, including:
                  </p>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-50 rounded-lg">
                      <Database className="h-8 w-8 text-luxury-gold mb-3" />
                      <h4 className="font-semibold text-slate-800 mb-2">Encryption</h4>
                      <p className="text-sm">256-bit SSL encryption for all data transmission</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-lg">
                      <Lock className="h-8 w-8 text-luxury-gold mb-3" />
                      <h4 className="font-semibold text-slate-800 mb-2">Access Control</h4>
                      <p className="text-sm">Strict access controls and regular security audits</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-light text-slate-800 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                  International Transfers
                </h2>
                <div className="space-y-6 text-slate-600 leading-relaxed">
                  <p>
                    Your information may be transferred to and processed in countries other than your own.
                    We ensure appropriate safeguards are in place to protect your data in accordance with
                    applicable privacy laws, including GDPR and CCPA.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-light text-slate-800 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Contact Us
                </h2>
                <div className="space-y-6 text-slate-600 leading-relaxed">
                  <p>
                    If you have any questions about this Privacy Policy or your personal information, please contact us:
                  </p>
                  <div className="space-y-2">
                    <p><strong>Email:</strong> privacy@vibehotels.com</p>
                    <p><strong>Phone:</strong> +1 (888) VIBE-PRIVACY</p>
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
            Questions About Your Privacy?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Our privacy team is here to help you understand and exercise your rights.
          </p>
          <button className="px-8 py-4 bg-luxury-gold-gradient text-white font-medium rounded-lg hover:scale-105 transform transition-all duration-300 shadow-luxury-lg">
            Contact Privacy Team
          </button>
        </div>
      </section>
    </div>
  );
}