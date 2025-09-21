import { Building2, Users, Calendar, Shield, Award, Briefcase } from 'lucide-react';

export function BusinessTravelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-luxury-cream to-white">
      {/* Hero Section */}
      <section className="relative py-20 bg-luxury-gradient">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-light text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
              Executive Travel
              <span className="block text-3xl md:text-4xl mt-2 bg-luxury-gold-gradient bg-clip-text text-transparent">
                Reimagined
              </span>
            </h1>
            <p className="text-xl text-white/80 mb-8 leading-relaxed">
              Elevate your business travel with our corporate solutions. From seamless booking management
              to exclusive executive amenities, we understand what discerning business travelers need.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-luxury-gold-gradient text-white font-medium rounded-lg hover:scale-105 transform transition-all duration-300 shadow-luxury-lg">
                Get Corporate Rates
              </button>
              <button className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium rounded-lg hover:bg-white/20 transition-all duration-300">
                Request Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-slate-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Corporate Solutions
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Streamlined travel management designed for today's business needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-8 bg-white rounded-xl shadow-luxury hover:shadow-luxury-lg transition-all duration-300">
              <Building2 className="h-12 w-12 text-luxury-gold mb-6" />
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Corporate Accounts</h3>
              <p className="text-slate-600 leading-relaxed">
                Centralized billing, expense management, and detailed reporting for all your business travel needs.
              </p>
            </div>

            <div className="p-8 bg-white rounded-xl shadow-luxury hover:shadow-luxury-lg transition-all duration-300">
              <Users className="h-12 w-12 text-luxury-gold mb-6" />
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Group Bookings</h3>
              <p className="text-slate-600 leading-relaxed">
                Effortlessly manage team travel with group rates, coordinated itineraries, and bulk booking options.
              </p>
            </div>

            <div className="p-8 bg-white rounded-xl shadow-luxury hover:shadow-luxury-lg transition-all duration-300">
              <Calendar className="h-12 w-12 text-luxury-gold mb-6" />
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Travel Policy</h3>
              <p className="text-slate-600 leading-relaxed">
                Automated policy compliance with custom approval workflows and spending controls.
              </p>
            </div>

            <div className="p-8 bg-white rounded-xl shadow-luxury hover:shadow-luxury-lg transition-all duration-300">
              <Shield className="h-12 w-12 text-luxury-gold mb-6" />
              <h3 className="text-xl font-semibold mb-4 text-slate-800">24/7 Support</h3>
              <p className="text-slate-600 leading-relaxed">
                Dedicated corporate travel specialists available around the clock for any assistance.
              </p>
            </div>

            <div className="p-8 bg-white rounded-xl shadow-luxury hover:shadow-luxury-lg transition-all duration-300">
              <Award className="h-12 w-12 text-luxury-gold mb-6" />
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Executive Perks</h3>
              <p className="text-slate-600 leading-relaxed">
                Priority check-in, room upgrades, airport lounge access, and exclusive corporate rates.
              </p>
            </div>

            <div className="p-8 bg-white rounded-xl shadow-luxury hover:shadow-luxury-lg transition-all duration-300">
              <Briefcase className="h-12 w-12 text-luxury-gold mb-6" />
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Business Centers</h3>
              <p className="text-slate-600 leading-relaxed">
                Access to fully equipped business centers, meeting rooms, and conference facilities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-8">
              <div className="text-4xl font-bold text-luxury-gold mb-2">500+</div>
              <div className="text-slate-600">Corporate Partners</div>
            </div>
            <div className="p-8">
              <div className="text-4xl font-bold text-luxury-gold mb-2">98%</div>
              <div className="text-slate-600">Client Satisfaction</div>
            </div>
            <div className="p-8">
              <div className="text-4xl font-bold text-luxury-gold mb-2">24/7</div>
              <div className="text-slate-600">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-luxury-gradient">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-light text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
            Ready to Elevate Your Business Travel?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Join hundreds of companies that trust Vibe Hotels for their executive travel needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-luxury-gold-gradient text-white font-medium rounded-lg hover:scale-105 transform transition-all duration-300 shadow-luxury-lg">
              Contact Sales Team
            </button>
            <button className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium rounded-lg hover:bg-white/20 transition-all duration-300">
              Download Brochure
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}