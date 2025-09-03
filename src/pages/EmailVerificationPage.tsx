import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Mail, RefreshCw } from 'lucide-react';
import { authService } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export const EmailVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [verificationState, setVerificationState] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setVerificationState('error');
      setErrorMessage('No verification token provided');
      return;
    }

    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    if (!token) return;

    try {
      setVerificationState('loading');
      await authService.confirmEmailVerification(token);
      setVerificationState('success');
      
      // Redirect to profile after success
      setTimeout(() => {
        navigate('/profile', { replace: true });
      }, 3000);
      
    } catch (error: any) {
      const message = error.message || 'Email verification failed';
      setErrorMessage(message);
      
      if (message.includes('expired') || message.includes('Token Expired')) {
        setVerificationState('expired');
      } else {
        setVerificationState('error');
      }
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;

    try {
      setIsResending(true);
      await authService.resendVerificationEmail(user.email);
      // Show success message or redirect
    } catch (error) {
      console.error('Failed to resend verification email:', error);
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (verificationState) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="mb-6">
              <LoadingSpinner size="lg" />
            </div>
            <h1 className="text-2xl font-bold text-luxury-navy mb-4">
              Verifying your email...
            </h1>
            <p className="text-slate-600">
              Please wait while we verify your email address.
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="mb-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-luxury-navy mb-4">
              Email Verified Successfully!
            </h1>
            <p className="text-slate-600 mb-6">
              Welcome to Vibe Hotels! Your email has been verified and your account is now active.
              You'll be redirected to your profile in a few seconds.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/profile')}
                className="bg-gradient-to-r from-luxury-navy to-slate-700 hover:from-luxury-navy/90 hover:to-slate-700/90"
              >
                Go to My Profile
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
              >
                Start Browsing Hotels
              </Button>
            </div>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center">
            <div className="mb-6">
              <XCircle className="h-16 w-16 text-amber-500 mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-luxury-navy mb-4">
              Verification Link Expired
            </h1>
            <p className="text-slate-600 mb-6">
              Your email verification link has expired for security reasons. 
              Don't worry - we can send you a new one!
            </p>
            {user?.email && (
              <div className="space-y-3">
                <Button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="bg-gradient-to-r from-luxury-gold to-amber-600 hover:from-luxury-gold/90 hover:to-amber-600/90"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sending New Link...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send New Verification Email
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/login')}
                >
                  Back to Login
                </Button>
              </div>
            )}
          </div>
        );

      case 'error':
      default:
        return (
          <div className="text-center">
            <div className="mb-6">
              <XCircle className="h-16 w-16 text-red-500 mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-luxury-navy mb-4">
              Verification Failed
            </h1>
            <p className="text-slate-600 mb-6">
              {errorMessage || 'We couldn\'t verify your email address. This could be due to an invalid or already used verification link.'}
            </p>
            <div className="space-y-3">
              {user?.email && (
                <Button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="bg-gradient-to-r from-luxury-gold to-amber-600 hover:from-luxury-gold/90 hover:to-amber-600/90"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sending New Link...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send New Verification Email
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-luxury-cream to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white shadow-luxury-xl rounded-2xl p-8 border border-slate-200">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};