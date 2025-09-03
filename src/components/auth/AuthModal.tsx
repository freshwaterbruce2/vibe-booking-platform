import React, { useState } from 'react';
import { X } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onSuccess?: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  if (!isOpen) return null;

  const handleSuccess = (user: any) => {
    onSuccess?.(user);
    onClose();
  };

  const handleError = (error: string) => {
    console.error('Auth error:', error);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Modal Body */}
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            {mode === 'login' ? (
              <LoginForm
                onSuccess={handleSuccess}
                onError={handleError}
                onSwitchToRegister={() => setMode('register')}
                showSocialLogin={true}
              />
            ) : (
              <RegisterForm
                onSuccess={handleSuccess}
                onError={handleError}
                onSwitchToLogin={() => setMode('login')}
                showSocialLogin={true}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};