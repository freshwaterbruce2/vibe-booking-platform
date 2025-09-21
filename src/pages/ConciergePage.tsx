import { Crown, Phone, MessageCircle, MapPin, Calendar, Car, Utensils, Theater, Star } from 'lucide-react';

export function ConciergePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-luxury-cream to-white">
      {/* Hero Section */}
      <section className="relative py-20 bg-luxury-gradient">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-md rounded-full mb-6">
              <Crown className="h-10 w-10 text-gold-400" />
            </div>
            <h1 className="text-5xl md:text-6xl font-light text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
              Personal Concierge
              <span className="block text-3xl md:text-4xl mt-2 bg-luxury-gold-gradient bg-clip-text text-transparent">
                At Your Service
              </span>
            </h1>
            <p className="text-xl text-white/80 mb-8 leading-relaxed">
              Experience the pinnacle of personalized service. Our dedicated concierge team crafts bespoke experiences
              tailored to your every desire, ensuring your stay transcends expectations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-luxury-gold-gradient text-white font-medium rounded-lg hover:scale-105 transform transition-all duration-300 shadow-luxury-lg flex items-center justify-center gap-2">
                <Phone className="h-5 w-5" />
                Call Concierge
              </button>
              <button className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium rounded-lg hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Live Chat
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-slate-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Exclusive Services
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              From restaurant reservations to private jet arrangements, we handle every detail
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-8 bg-white rounded-xl shadow-luxury hover:shadow-luxury-lg transition-all duration-300">
              <Utensils className="h-12 w-12 text-luxury-gold mb-6" />
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Fine Dining</h3>
              <p className="text-slate-600 leading-relaxed">
                Exclusive reservations at Michelin-starred restaurants and private chef arrangements.
              </p>
            </div>

            <div className="p-8 bg-white rounded-xl shadow-luxury hover:shadow-luxury-lg transition-all duration-300">
              <Car className="h-12 w-12 text-luxury-gold mb-6" />
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Luxury Transportation</h3>
              <p className="text-slate-600 leading-relaxed">
                Private chauffeurs, yacht charters, helicopter transfers, and premium vehicle rentals.
              </p>
            </div>

            <div className="p-8 bg-white rounded-xl shadow-luxury hover:shadow-luxury-lg transition-all duration-300">
              <Theater className="h-12 w-12 text-luxury-gold mb-6" />
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Entertainment</h3>
              <p className="text-slate-600 leading-relaxed">
                VIP tickets to shows, concerts, sporting events, and exclusive cultural experiences.
              </p>
            </div>

            <div className="p-8 bg-white rounded-xl shadow-luxury hover:shadow-luxury-lg transition-all duration-300">
              <MapPin className="h-12 w-12 text-luxury-gold mb-6" />
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Local Experiences</h3>
              <p className="text-slate-600 leading-relaxed">
                Curated city tours, private museum visits, and insider access to hidden gems.
              </p>
            </div>

            <div className="p-8 bg-white rounded-xl shadow-luxury hover:shadow-luxury-lg transition-all duration-300">
              <Calendar className="h-12 w-12 text-luxury-gold mb-6" />
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Event Planning</h3>
              <p className="text-slate-600 leading-relaxed">
                Corporate meetings, special celebrations, and bespoke event coordination.
              </p>
            </div>

            <div className="p-8 bg-white rounded-xl shadow-luxury hover:shadow-luxury-lg transition-all duration-300">
              <Star className="h-12 w-12 text-luxury-gold mb-6" />
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Personal Requests</h3>
              <p className="text-slate-600 leading-relaxed">
                From shopping assistance to pet services, no request is too unique for our team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-slate-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              How to Reach Us
            </h2>
            <p className="text-xl text-slate-600">
              Available 24/7 to assist with your every need
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white rounded-xl shadow-luxury">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-luxury-gold-gradient rounded-full mb-6">
                <Phone className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Direct Line</h3>
              <p className="text-slate-600 mb-4">
                Speak directly with our concierge team
              </p>
              <div className="text-luxury-gold font-semibold">+1 (888) VIBE-LUXURY</div>
            </div>

            <div className="text-center p-8 bg-white rounded-xl shadow-luxury">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-luxury-gold-gradient rounded-full mb-6">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Live Chat</h3>
              <p className="text-slate-600 mb-4">
                Instant messaging with our specialists
              </p>
              <button className="text-luxury-gold font-semibold hover:underline">
                Start Chat
              </button>
            </div>

            <div className="text-center p-8 bg-white rounded-xl shadow-luxury">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-luxury-gold-gradient rounded-full mb-6">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-slate-800">In-Person</h3>
              <p className="text-slate-600 mb-4">
                Visit our concierge desk at any property
              </p>
              <div className="text-luxury-gold font-semibold">Available 24/7</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <blockquote className="text-2xl text-slate-700 mb-8 italic leading-relaxed">
              "The concierge team went above and beyond to arrange a private dinner on the beach for our anniversary.
              Every detail was perfect, from the string quartet to the personalized menu. Truly unforgettable."
            </blockquote>
            <div className="text-slate-600">
              <div className="font-semibold">Sarah & Michael Chen</div>
              <div>Diamond Members</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-luxury-gradient relative">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-light text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
            Experience Unparalleled Service
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Let our concierge team create extraordinary moments during your stay.
          </p>
          <button className="px-8 py-4 bg-luxury-gold-gradient text-white font-medium rounded-lg hover:scale-105 transform transition-all duration-300 shadow-luxury-lg">
            Request Concierge Service
          </button>
        </div>
      </section>
    </div>
  );
}