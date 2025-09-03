import React, { useState } from 'react';
// import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, Calendar, MapPin, Heart, Award, Clock, Settings, ChevronRight, BarChart3 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import BookingHistory from '@/components/booking/BookingHistory';
import PersonalizationPreferences from '@/components/user/PersonalizationPreferences';
import TravelAnalytics from '@/components/analytics/TravelAnalytics';

const UserProfilePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'bookings' | 'preferences' | 'analytics'>('profile');

  if (!isAuthenticated || !user) {
    return (
      <>
        {/* <Helmet>
          <title>Sign In Required - Vibe Hotel Booking</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet> */}

        <Layout>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cream-50 to-slate-100 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-luxury-lg max-w-md w-full mx-4">
              <div className="text-center">
                <User className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign In Required</h2>
                <p className="text-slate-600 mb-6">
                  Please sign in to access your profile and booking history.
                </p>
                <Link to="/">
                  <Button size="lg" className="w-full">
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Layout>
      </>
    );
  }

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-slate-50 to-cream-50 rounded-2xl p-6 border border-slate-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 bg-gradient-to-r from-slate-700 to-slate-800 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-slate-600">{user.email}</p>
              <div className="flex items-center mt-2 text-sm text-slate-500">
                <Calendar className="w-4 h-4 mr-1" />
                Member since {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Account Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-luxury">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-slate-900">Total Bookings</h3>
            <Clock className="w-5 h-5 text-luxury-navy" />
          </div>
          <div className="text-3xl font-bold text-luxury-navy mb-1">0</div>
          <p className="text-sm text-slate-600">Lifetime reservations</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-luxury">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-slate-900">Rewards Points</h3>
            <Award className="w-5 h-5 text-luxury-gold" />
          </div>
          <div className="text-3xl font-bold text-luxury-gold mb-1">2,450</div>
          <p className="text-sm text-slate-600">Available points</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-luxury">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-slate-900">Saved Hotels</h3>
            <Heart className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-3xl font-bold text-red-500 mb-1">5</div>
          <p className="text-sm text-slate-600">In wishlist</p>
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-luxury">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-xl font-semibold text-slate-900">Account Information</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-slate-400" />
              <div>
                <div className="font-medium text-slate-900">Email Address</div>
                <div className="text-sm text-slate-600">{user.email}</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
          
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-slate-400" />
              <div>
                <div className="font-medium text-slate-900">Phone Number</div>
                <div className="text-sm text-slate-600">{'Not provided'}</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
          
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-slate-400" />
              <div>
                <div className="font-medium text-slate-900">Location</div>
                <div className="text-sm text-slate-600">{'Not specified'}</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-luxury">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-xl font-semibold text-slate-900">Quick Actions</h3>
        </div>
        <div className="p-6 space-y-3">
          <Link
            to="/my-bookings"
            className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-luxury-navy" />
              <span className="font-medium text-slate-900">View My Bookings</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </Link>
          
          <button className="flex items-center justify-between w-full p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
            <div className="flex items-center space-x-3">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="font-medium text-slate-900">Manage Favorites</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
          
          <button className="flex items-center justify-between w-full p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
            <div className="flex items-center space-x-3">
              <Award className="w-5 h-5 text-luxury-gold" />
              <span className="font-medium text-slate-900">Rewards Program</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* <Helmet>
        <title>My Profile - {user.firstName} {user.lastName} - Vibe Hotel Booking</title>
        <meta 
          name="description" 
          content="Manage your profile, view booking history, and update your travel preferences." 
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet> */}

      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cream-50 to-slate-100">
          <div className="container mx-auto px-4 py-8">
            {/* Tab Navigation */}
            <div className="mb-8">
              <div className="border-b border-slate-200">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'profile'
                        ? 'border-luxury-navy text-luxury-navy'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'bookings'
                        ? 'border-luxury-navy text-luxury-navy'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    My Bookings
                  </button>
                  <button
                    onClick={() => setActiveTab('preferences')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'preferences'
                        ? 'border-luxury-navy text-luxury-navy'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    Preferences
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'analytics'
                        ? 'border-luxury-navy text-luxury-navy'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 inline mr-2" />
                    Analytics
                  </button>
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            <div>
              {activeTab === 'profile' && renderProfileTab()}
              {activeTab === 'bookings' && <BookingHistory />}
              {activeTab === 'preferences' && <PersonalizationPreferences />}
              {activeTab === 'analytics' && <TravelAnalytics />}
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default UserProfilePage;