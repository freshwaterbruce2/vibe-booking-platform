import { HeadphonesIcon, MessageSquare, Mail, Clock, Search, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';

export function SupportPage() {
  const faqs = [
    {
      question: "How do I modify or cancel my reservation?",
      answer: "You can easily modify or cancel your reservation through your account dashboard or by contacting our 24/7 support team. Cancellation policies vary by hotel and rate type."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers. All transactions are secured with 256-bit SSL encryption."
    },
    {
      question: "How does the rewards program work?",
      answer: "Earn 5% in rewards on every booking. Points can be redeemed for future stays, room upgrades, and exclusive experiences. Diamond members enjoy additional perks and priority service."
    },
    {
      question: "Can I request special accommodations?",
      answer: "Absolutely! We can arrange accessibility accommodations, dietary restrictions, special occasions, and other requests. Contact us during booking or reach out to our concierge team."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-luxury-cream to-white">
      {/* Hero Section */}
      <section className="relative py-20 bg-luxury-gradient">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-md rounded-full mb-6">
              <HeadphonesIcon className="h-10 w-10 text-gold-400" />
            </div>
            <h1 className="text-5xl md:text-6xl font-light text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
              24/7 Support
              <span className="block text-3xl md:text-4xl mt-2 bg-luxury-gold-gradient bg-clip-text text-transparent">
                We're Here to Help
              </span>
            </h1>
            <p className="text-xl text-white/80 mb-8 leading-relaxed">
              Experience exceptional support around the clock. Our dedicated team of travel specialists
              is ready to assist you with any questions or concerns about your luxury hotel experience.
            </p>
            <div className="flex items-center justify-center gap-3 px-6 py-3 bg-green-500/20 rounded-full border border-green-400/20 max-w-md mx-auto">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
              <span className="text-green-200 font-medium">Support team online now</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-slate-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Get Instant Help
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Choose your preferred way to connect with our support team
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-8 bg-white rounded-xl shadow-luxury hover:shadow-luxury-lg transition-all duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-luxury-gold-gradient rounded-full mb-6">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Live Chat</h3>
              <p className="text-slate-600 mb-6">
                Instant support via chat. Average response time: 30 seconds
              </p>
              <button className="px-6 py-3 bg-luxury-gold-gradient text-white font-medium rounded-lg hover:scale-105 transform transition-all duration-300">
                Start Chat
              </button>
            </div>

            <div className="text-center p-8 bg-white rounded-xl shadow-luxury hover:shadow-luxury-lg transition-all duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-luxury-gold-gradient rounded-full mb-6">
                <HeadphonesIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Phone Support</h3>
              <p className="text-slate-600 mb-6">
                Speak directly with our specialists. Available 24/7
              </p>
              <div className="text-luxury-gold font-semibold text-lg">+1 (888) VIBE-LUXURY</div>
            </div>

            <div className="text-center p-8 bg-white rounded-xl shadow-luxury hover:shadow-luxury-lg transition-all duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-luxury-gold-gradient rounded-full mb-6">
                <Mail className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Email Support</h3>
              <p className="text-slate-600 mb-6">
                Detailed inquiries welcome. Response within 2 hours
              </p>
              <div className="text-luxury-gold font-semibold">support@vibehotels.com</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-slate-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-slate-600">
              Quick answers to common questions
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl shadow-luxury p-8">
                <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-luxury-gold mt-0.5 flex-shrink-0" />
                  {faq.question}
                </h3>
                <p className="text-slate-600 leading-relaxed pl-9">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button className="px-8 py-4 bg-luxury-gold-gradient text-white font-medium rounded-lg hover:scale-105 transform transition-all duration-300 shadow-luxury-lg flex items-center gap-2 mx-auto">
              <BookOpen className="h-5 w-5" />
              View All FAQs
            </button>
          </div>
        </div>
      </section>

      {/* Self-Service Tools */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-slate-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Self-Service Tools
            </h2>
            <p className="text-xl text-slate-600">
              Manage your bookings and account instantly
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-white rounded-xl shadow-luxury hover:shadow-luxury-lg transition-all duration-300">
              <Search className="h-12 w-12 text-luxury-gold mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-slate-800">Find Booking</h3>
              <p className="text-slate-600 text-sm">Look up reservations by confirmation number</p>
            </div>

            <div className="text-center p-6 bg-white rounded-xl shadow-luxury hover:shadow-luxury-lg transition-all duration-300">
              <CheckCircle className="h-12 w-12 text-luxury-gold mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-slate-800">Check-in Online</h3>
              <p className="text-slate-600 text-sm">Complete check-in process before arrival</p>
            </div>

            <div className="text-center p-6 bg-white rounded-xl shadow-luxury hover:shadow-luxury-lg transition-all duration-300">
              <Clock className="h-12 w-12 text-luxury-gold mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-slate-800">Modify Dates</h3>
              <p className="text-slate-600 text-sm">Change your check-in or check-out dates</p>
            </div>

            <div className="text-center p-6 bg-white rounded-xl shadow-luxury hover:shadow-luxury-lg transition-all duration-300">
              <AlertCircle className="h-12 w-12 text-luxury-gold mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-slate-800">Cancel Booking</h3>
              <p className="text-slate-600 text-sm">Cancel reservations within policy terms</p>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="py-20 bg-red-50 border-l-4 border-red-400">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-3xl font-light text-slate-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Emergency Support
            </h2>
            <p className="text-lg text-slate-600 mb-6">
              For urgent travel emergencies, safety concerns, or immediate assistance during your stay
            </p>
            <div className="text-2xl font-bold text-red-600">+1 (888) EMERGENCY</div>
            <p className="text-sm text-slate-500 mt-2">Available 24/7 worldwide</p>
          </div>
        </div>
      </section>
    </div>
  );
}