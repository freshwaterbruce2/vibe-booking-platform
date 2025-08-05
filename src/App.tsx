
import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { HomePage } from '@/pages/HomePage';
import { HotelDetailsPage } from '@/pages/HotelDetailsPage';
import { BookingPage } from '@/pages/BookingPage';
import { SearchResultsPage } from '@/pages/SearchResultsPage';
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/hotel/:id" element={<HotelDetailsPage />} />
          <Route path="/booking" element={<BookingPage />} />
        </Routes>
      </Layout>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
          },
        }}
      />
    </>
  );
}

export default App;