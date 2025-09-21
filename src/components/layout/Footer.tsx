
import { Link } from 'react-router-dom';
import { Hotel, Mail, Phone, MapPin, Send, Shield, Award, Globe, Twitter, Facebook, Instagram } from 'lucide-react';
import { useState } from 'react';

export function Footer() {
  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Show loading state
      const submitButton = e.currentTarget.querySelector('button[type="submit"]') as HTMLButtonElement;
      const originalText = submitButton.textContent;
      submitButton.textContent = 'Subscribing...';
      submitButton.disabled = true;

      // Simulate API call (replace with actual API endpoint)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Show success message
      setEmail('');
      submitButton.textContent = 'Subscribed!';
      setTimeout(() => {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
      }, 2000);

      // In a real app, you would make an API call here:
      // await fetch('/api/newsletter/subscribe', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email })
      // });

    } catch (error) {
      console.error('Newsletter subscription failed:', error);
      // Handle error - show error message
    }
  };

  return (
    <footer className="bg-luxury-gradient relative overflow-hidden">
      {/* Decorative overlay */}
      <div className="absolute inset-0 bg-black/20"></div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Newsletter Section */}
        <div className="text-center mb-16">
          <div className="inline-block">
            <h2 className="text-4xl md:text-5xl font-light text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Experience Luxury
              <span className="block text-2xl md:text-3xl mt-2 bg-luxury-gold-gradient bg-clip-text text-transparent font-normal">
                Redefined
              </span>
            </h2>
          </div>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto font-light leading-relaxed">
            Join our exclusive community and unlock extraordinary experiences.
            Discover hand-selected luxury hotels that match your sophisticated taste.
          </p>

          {/* Newsletter Form */}
          <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all duration-300"
                required
              />
              <button
                type="submit"
                className="px-8 py-4 bg-luxury-gold-gradient text-white font-medium rounded-lg hover:scale-105 transform transition-all duration-300 shadow-luxury-lg flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Send className="h-4 w-4" />
                Subscribe
              </button>
            </div>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="p-2 bg-white/10 backdrop-blur-md rounded-lg group-hover:bg-white/20 transition-all duration-300">
                <Hotel className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-light text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                Vibe Hotels
              </span>
            </Link>
            <p className="text-sm text-white/70 leading-relaxed">
              Discover extraordinary stays with AI-powered matching that understands your passions.
              Earn 5% rewards on every booking while experiencing unparalleled luxury.
            </p>
          </div>

          {/* Explore */}
          <div className="space-y-6">
            <h3 className="text-lg font-light text-white uppercase tracking-wider" style={{ fontFamily: 'Playfair Display, serif' }}>
              Explore
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/search" className="text-sm text-white/70 hover:text-white transition-all duration-300 hover:translate-x-1 flex items-center group">
                  <span className="w-2 h-px bg-gold-400 mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  Luxury Hotels
                </Link>
              </li>
              <li>
                <Link to="/destinations" className="text-sm text-white/70 hover:text-white transition-all duration-300 hover:translate-x-1 flex items-center group">
                  <span className="w-2 h-px bg-gold-400 mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  Exclusive Destinations
                </Link>
              </li>
              <li>
                <Link to="/deals" className="text-sm text-white/70 hover:text-white transition-all duration-300 hover:translate-x-1 flex items-center group">
                  <span className="w-2 h-px bg-gold-400 mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  Member Offers
                </Link>
              </li>
              <li>
                <Link to="/business" className="text-sm text-white/70 hover:text-white transition-all duration-300 hover:translate-x-1 flex items-center group">
                  <span className="w-2 h-px bg-gold-400 mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  Executive Travel
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-6">
            <h3 className="text-lg font-light text-white uppercase tracking-wider" style={{ fontFamily: 'Playfair Display, serif' }}>
              Services
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/concierge" className="text-sm text-white/70 hover:text-white transition-all duration-300 hover:translate-x-1 flex items-center group">
                  <span className="w-2 h-px bg-gold-400 mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  Personal Concierge
                </Link>
              </li>
              <li>
                <Link to="/rewards" className="text-sm text-white/70 hover:text-white transition-all duration-300 hover:translate-x-1 flex items-center group">
                  <span className="w-2 h-px bg-gold-400 mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  Rewards Program
                </Link>
              </li>
              <li>
                <Link to="/experiences" className="text-sm text-white/70 hover:text-white transition-all duration-300 hover:translate-x-1 flex items-center group">
                  <span className="w-2 h-px bg-gold-400 mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  Curated Experiences
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-sm text-white/70 hover:text-white transition-all duration-300 hover:translate-x-1 flex items-center group">
                  <span className="w-2 h-px bg-gold-400 mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  24/7 Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div className="space-y-6">
            <h3 className="text-lg font-light text-white uppercase tracking-wider" style={{ fontFamily: 'Playfair Display, serif' }}>
              Connect
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-sm text-white/70">
                <div className="p-2 bg-white/10 backdrop-blur-md rounded-lg">
                  <Mail className="h-4 w-4 text-white" />
                </div>
                <span>concierge@vibehotels.com</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-white/70">
                <div className="p-2 bg-white/10 backdrop-blur-md rounded-lg">
                  <Phone className="h-4 w-4 text-white" />
                </div>
                <span>+1 (888) VIBE-LUXURY</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-white/70">
                <div className="p-2 bg-white/10 backdrop-blur-md rounded-lg">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
                <span>Beverly Hills, CA</span>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex items-center space-x-4 pt-2">
              <a
                href="#"
                className="p-3 bg-white/10 backdrop-blur-md rounded-lg hover:bg-white/20 transition-all duration-300 hover:scale-110 group"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5 text-white group-hover:text-gold-300" />
              </a>
              <a
                href="#"
                className="p-3 bg-white/10 backdrop-blur-md rounded-lg hover:bg-white/20 transition-all duration-300 hover:scale-110 group"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5 text-white group-hover:text-gold-300" />
              </a>
              <a
                href="#"
                className="p-3 bg-white/10 backdrop-blur-md rounded-lg hover:bg-white/20 transition-all duration-300 hover:scale-110 group"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5 text-white group-hover:text-gold-300" />
              </a>
            </div>
          </div>
        </div>

        {/* Trust & Recognition Section */}
        <div className="mt-16 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center justify-center space-x-3 p-6 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
              <Shield className="h-8 w-8 text-gold-400" />
              <div className="text-center md:text-left">
                <div className="text-white font-medium">Secure Booking</div>
                <div className="text-white/60 text-sm">256-bit SSL Encryption</div>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-3 p-6 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
              <Award className="h-8 w-8 text-gold-400" />
              <div className="text-center md:text-left">
                <div className="text-white font-medium">Award Winning</div>
                <div className="text-white/60 text-sm">Luxury Travel Excellence</div>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-3 p-6 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
              <Globe className="h-8 w-8 text-gold-400" />
              <div className="text-center md:text-left">
                <div className="text-white font-medium">Global Network</div>
                <div className="text-white/60 text-sm">50,000+ Premium Hotels</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="pt-8 border-t border-white/20">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0">
            <div className="text-center lg:text-left">
              <div className="text-sm text-white/60 mb-2">
                © 2025 Vibe Hotels. All rights reserved.
              </div>
              <div className="text-xs text-white/40">
                Redefining luxury hospitality through AI-powered experiences
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <Link
                  to="/privacy"
                  className="text-white/70 hover:text-white transition-all duration-300 hover:scale-105 px-3 py-1 rounded-md hover:bg-white/10"
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/terms"
                  className="text-white/70 hover:text-white transition-all duration-300 hover:scale-105 px-3 py-1 rounded-md hover:bg-white/10"
                >
                  Terms of Service
                </Link>
                <Link
                  to="/accessibility"
                  className="text-white/70 hover:text-white transition-all duration-300 hover:scale-105 px-3 py-1 rounded-md hover:bg-white/10"
                >
                  Accessibility
                </Link>
              </div>

              <div className="flex items-center gap-3 px-4 py-2 bg-green-500/20 rounded-full border border-green-400/20">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                <span className="text-xs text-green-200 font-medium">All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}