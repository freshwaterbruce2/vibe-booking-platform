import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Get the redirect path from location state, default to home
  const redirectPath = (location.state as { from?: string })?.from || '/';

  // If already authenticated, redirect to the intended page
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  const handleLoginSuccess = () => {
    navigate(redirectPath, { replace: true });
  };

  const handleClose = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Welcome Back to Vibe Hotels
          </h1>
          <p className="mt-2 text-gray-600">
            Sign in to access your bookings and continue your luxury travel journey
          </p>
        </div>

        <div className="bg-white shadow-luxury-lg rounded-lg">
          <AuthModal
            isOpen={true}
            onClose={handleClose}
            initialMode="login"
            onSuccess={handleLoginSuccess}
          />
        </div>
      </div>
    </div>
  );
};