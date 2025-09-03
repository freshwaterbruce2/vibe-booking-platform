import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Clock, Search, Filter, ChevronDown, Phone, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { bookingService, type Booking, type BookingStats } from '@/services/bookingService';
import { logger } from '@/utils/logger';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';

interface BookingHistoryProps {
  className?: string;
}

const BookingHistory: React.FC<BookingHistoryProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadBookingData();
    }
  }, [user?.id]);

  const loadBookingData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [userBookings, bookingStats] = await Promise.all([
        bookingService.getUserBookings(user.id),
        bookingService.getBookingStats(user.id)
      ]);

      setBookings(userBookings);
      setStats(bookingStats);

      logger.info('Booking history loaded successfully:', {
        userId: user.id,
        bookingCount: userBookings.length
      });
    } catch (error) {
      logger.error('Failed to load booking history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    const success = await bookingService.cancelBooking(bookingId, 'Cancelled by user');
    if (success) {
      await loadBookingData();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'checked_in':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      case 'refunded':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.hotelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.confirmationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.hotelCity?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!user) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="bg-gradient-to-br from-slate-50 to-cream-50 rounded-2xl p-8 border border-slate-200">
          <h3 className="text-xl font-semibold text-slate-800 mb-2">Sign in to view your bookings</h3>
          <p className="text-slate-600">Access your booking history and manage your reservations</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex justify-center py-12 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Stats */}
      <div className="bg-gradient-to-br from-slate-50 to-cream-50 rounded-2xl p-6 border border-slate-200">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-6">
          My Booking History
        </h2>
        
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-luxury-navy">{stats.totalBookings}</div>
              <div className="text-sm text-slate-600">Total Bookings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.upcomingBookings}</div>
              <div className="text-sm text-slate-600">Upcoming</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.completedBookings}</div>
              <div className="text-sm text-slate-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-luxury-gold">
                ${stats.totalSpent.toLocaleString()}
              </div>
              <div className="text-sm text-slate-600">Total Spent</div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by hotel name, confirmation number, or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-luxury-navy focus:border-luxury-navy transition-all"
              />
            </div>
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-2 p-4 bg-white rounded-xl border border-slate-200">
              {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    statusFilter === status
                      ? 'bg-luxury-navy text-white shadow-luxury'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {status === 'all' ? 'All Bookings' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gradient-to-br from-slate-50 to-cream-50 rounded-2xl p-8 border border-slate-200">
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No bookings match your search' : 'No bookings yet'}
            </h3>
            <p className="text-slate-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your filters or search terms'
                : 'Start exploring our amazing hotels and make your first booking!'
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-luxury hover:shadow-luxury-md transition-shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  {/* Hotel Image and Info */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <img
                        src={booking.hotelImage || `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=120&h=90&fit=crop&crop=center`}
                        alt={booking.hotelName}
                        className="w-20 h-16 sm:w-24 sm:h-18 object-cover rounded-xl"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 truncate">
                            {booking.hotelName}
                          </h3>
                          <div className="flex items-center text-slate-600 text-sm mt-1">
                            <MapPin className="w-4 h-4 mr-1" />
                            {booking.hotelCity}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}
                          >
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                          <div className={`text-xs font-medium ${getPaymentStatusColor(booking.paymentStatus)}`}>
                            {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-slate-600 space-y-1">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                          <span className="ml-2 text-slate-500">({booking.nights} night{booking.nights > 1 ? 's' : ''})</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          {booking.guests.adults} adult{booking.guests.adults > 1 ? 's' : ''}
                          {booking.guests.children > 0 && `, ${booking.guests.children} child${booking.guests.children > 1 ? 'ren' : ''}`}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          Booked on {new Date(booking.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="lg:text-right space-y-3">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Confirmation Number</div>
                      <div className="font-mono text-sm font-semibold text-luxury-navy">
                        {booking.confirmationNumber}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Total Amount</div>
                      <div className="text-xl font-bold text-luxury-gold">
                        {booking.currency} ${booking.totalAmount.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 pt-2">
                      {booking.isCancellable && booking.status === 'confirmed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelBooking(booking.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Cancel Booking
                        </Button>
                      )}
                      
                      {booking.status === 'confirmed' && (
                        <div className="flex gap-2">
                          <a
                            href={`tel:${booking.guestInfo.phone}`}
                            className="flex items-center gap-1 px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                          >
                            <Phone className="w-3 h-3" />
                            Call Hotel
                          </a>
                          <a
                            href={`mailto:${booking.guestInfo.email}`}
                            className="flex items-center gap-1 px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                          >
                            <Mail className="w-3 h-3" />
                            Email
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Special Requests */}
                {booking.specialRequests && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="text-xs text-slate-500 mb-1">Special Requests</div>
                    <div className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">
                      {booking.specialRequests}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingHistory;