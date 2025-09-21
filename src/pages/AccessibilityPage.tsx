import { Accessibility, Eye, Ear, Hand, Heart, Users, Phone, Globe } from 'lucide-react';

export function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-luxury-cream to-white">
      {/* Hero Section */}
      <section className="relative py-20 bg-luxury-gradient">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-md rounded-full mb-6">
              <Accessibility className="h-10 w-10 text-gold-400" />
            </div>
            <h1 className="text-5xl md:text-6xl font-light text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
              Accessibility
              <span className="block text-3xl md:text-4xl mt-2 bg-luxury-gold-gradient bg-clip-text text-transparent">
                For Everyone
              </span>
            </h1>
            <p className="text-xl text-white/80 mb-8 leading-relaxed">
              At Vibe Hotels, we believe luxury travel should be accessible to everyone. We're committed
              to creating inclusive experiences that accommodate all guests' needs and abilities.
            </p>
            <div className="text-white/60 text-sm">
              Committed to WCAG 2.1 AA standards and ADA compliance
            </div>
          </div>
        </div>
      </section>

      {/* Our Commitment */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-slate-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Our Commitment
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Creating barrier-free luxury experiences for all travelers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <div className="text-center p-8 bg-white rounded-xl shadow-luxury">
              <Eye className="h-12 w-12 text-luxury-gold mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Visual</h3>
              <p className="text-slate-600">
                Screen reader compatibility, high contrast options, and clear navigation
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-xl shadow-luxury">
              <Ear className="h-12 w-12 text-luxury-gold mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Hearing</h3>
              <p className="text-slate-600">
                Visual alerts, text-based communication, and assistive listening devices
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-xl shadow-luxury">
              <Hand className="h-12 w-12 text-luxury-gold mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Mobility</h3>
              <p className="text-slate-600">
                Wheelchair accessible rooms, grab bars, and adaptive equipment
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-xl shadow-luxury">
              <Heart className="h-12 w-12 text-luxury-gold mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Cognitive</h3>
              <p className="text-slate-600">
                Clear signage, simplified processes, and patient, understanding staff
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Website Accessibility */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-light text-slate-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                Digital Accessibility
              </h2>
              <p className="text-xl text-slate-600">
                Our website and mobile app are designed to be accessible to everyone
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-luxury p-8 md:p-12 space-y-8">
              <div>
                <h3 className="text-2xl font-semibold text-slate-800 mb-6">Website Features</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">Navigation & Structure</h4>
                    <ul className="space-y-2 text-slate-600">
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-luxury-gold rounded-full mt-2 flex-shrink-0"></div>
                        <span>Logical heading hierarchy (H1-H6)</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-luxury-gold rounded-full mt-2 flex-shrink-0"></div>
                        <span>Skip navigation links</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-luxury-gold rounded-full mt-2 flex-shrink-0"></div>
                        <span>Consistent navigation structure</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-luxury-gold rounded-full mt-2 flex-shrink-0"></div>
                        <span>Clear page titles and landmarks</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">Visual & Interaction</h4>
                    <ul className="space-y-2 text-slate-600">
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-luxury-gold rounded-full mt-2 flex-shrink-0"></div>
                        <span>High contrast color schemes</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-luxury-gold rounded-full mt-2 flex-shrink-0"></div>
                        <span>Keyboard navigation support</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-luxury-gold rounded-full mt-2 flex-shrink-0"></div>
                        <span>Focus indicators on all interactive elements</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-luxury-gold rounded-full mt-2 flex-shrink-0"></div>
                        <span>Resizable text up to 200%</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-slate-800 mb-6">Screen Reader Support</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">Compatibility</h4>
                    <ul className="space-y-2 text-slate-600">
                      <li>• JAWS (Windows)</li>
                      <li>• NVDA (Windows)</li>
                      <li>• VoiceOver (macOS/iOS)</li>
                      <li>• TalkBack (Android)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">Features</h4>
                    <ul className="space-y-2 text-slate-600">
                      <li>• Alt text for all images</li>
                      <li>• Form labels and instructions</li>
                      <li>• ARIA landmarks and descriptions</li>
                      <li>• Semantic HTML markup</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hotel Accommodations */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-slate-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Hotel Accommodations
            </h2>
            <p className="text-xl text-slate-600">
              Physical accessibility features available at our partner hotels
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-semibold text-slate-800 mb-6">Room Features</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm">
                    <div className="w-3 h-3 bg-luxury-gold rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-slate-800">Accessible Bathrooms</h4>
                      <p className="text-slate-600 text-sm">Roll-in showers, grab bars, and lowered fixtures</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm">
                    <div className="w-3 h-3 bg-luxury-gold rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-slate-800">Mobility Features</h4>
                      <p className="text-slate-600 text-sm">Wider doorways, accessible light switches and controls</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm">
                    <div className="w-3 h-3 bg-luxury-gold rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-slate-800">Communication Aids</h4>
                      <p className="text-slate-600 text-sm">Visual notifications, TTY phones, and hearing loops</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-semibold text-slate-800 mb-6">Common Areas</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm">
                    <div className="w-3 h-3 bg-luxury-gold rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-slate-800">Accessible Entrances</h4>
                      <p className="text-slate-600 text-sm">Automatic doors, ramps, and step-free access</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm">
                    <div className="w-3 h-3 bg-luxury-gold rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-slate-800">Elevator Access</h4>
                      <p className="text-slate-600 text-sm">Braille buttons, audio announcements, and handrails</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm">
                    <div className="w-3 h-3 bg-luxury-gold rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-slate-800">Dining & Recreation</h4>
                      <p className="text-slate-600 text-sm">Accessible seating, pool lifts, and adaptive equipment</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support & Assistance */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-slate-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Support & Assistance
            </h2>
            <p className="text-xl text-slate-600">
              We're here to help with your accessibility needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white rounded-xl shadow-luxury">
              <Phone className="h-12 w-12 text-luxury-gold mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Dedicated Support</h3>
              <p className="text-slate-600 mb-4">
                Speak with our accessibility specialists for personalized assistance
              </p>
              <div className="text-luxury-gold font-semibold">+1 (888) ACCESSIBLE</div>
            </div>

            <div className="text-center p-8 bg-white rounded-xl shadow-luxury">
              <Users className="h-12 w-12 text-luxury-gold mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Pre-Arrival Planning</h3>
              <p className="text-slate-600 mb-4">
                Let us know your needs in advance to ensure everything is ready
              </p>
              <button className="text-luxury-gold font-semibold hover:underline">Request Planning</button>
            </div>

            <div className="text-center p-8 bg-white rounded-xl shadow-luxury">
              <Globe className="h-12 w-12 text-luxury-gold mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-4 text-slate-800">24/7 Assistance</h3>
              <p className="text-slate-600 mb-4">
                Round-the-clock support during your stay for any accessibility needs
              </p>
              <div className="text-luxury-gold font-semibold">Available Worldwide</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feedback */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-light text-slate-800 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
              Help Us Improve
            </h2>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              Your feedback helps us enhance our accessibility features. If you encounter any barriers
              or have suggestions for improvement, please let us know.
            </p>
            <div className="bg-white rounded-xl shadow-luxury p-8">
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Contact Our Accessibility Team</h3>
              <div className="space-y-3 text-slate-600">
                <p><strong>Email:</strong> accessibility@vibehotels.com</p>
                <p><strong>Phone:</strong> +1 (888) ACCESSIBLE</p>
                <p><strong>TTY:</strong> +1 (888) 555-0199</p>
                <p><strong>Mail:</strong> Accessibility Team, 123 Luxury Lane, Beverly Hills, CA 90210</p>
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
            Luxury Travel for Everyone
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Experience the finest accommodations with the accessibility features you need.
          </p>
          <button className="px-8 py-4 bg-luxury-gold-gradient text-white font-medium rounded-lg hover:scale-105 transform transition-all duration-300 shadow-luxury-lg">
            Plan Your Accessible Stay
          </button>
        </div>
      </section>
    </div>
  );
}