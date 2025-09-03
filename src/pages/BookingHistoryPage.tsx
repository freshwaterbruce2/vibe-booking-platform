import React from 'react';
// import { Helmet } from 'react-helmet-async';
import { Layout } from '@/components/layout/Layout';
import BookingHistory from '@/components/booking/BookingHistory';

const BookingHistoryPage: React.FC = () => {
  return (
    <>
      {/* <Helmet>
        <title>My Bookings - Vibe Hotel Booking</title>
        <meta 
          name="description" 
          content="View and manage your hotel bookings. Check booking status, cancellation options, and travel history." 
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet> */}

      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cream-50 to-slate-100">
          <div className="container mx-auto px-4 py-8">
            <BookingHistory />
          </div>
        </div>
      </Layout>
    </>
  );
};

export default BookingHistoryPage;