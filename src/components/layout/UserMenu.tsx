import { useState } from 'react';
import { User, LogIn, UserPlus, Award } from 'lucide-react';
import { Button } from '../ui/Button';
import { MemberLoginModal } from '../auth/MemberLoginModal';

export function UserMenu() {
  // In a real app, this would check authentication state
  const isAuthenticated = false;
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleSignIn = () => {
    console.log('Sign in clicked');
    setShowAuthModal(true);
  };

  const handleSignUp = () => {
    console.log('Sign up clicked');
    setShowAuthModal(true);
  };

  if (!isAuthenticated) {
    return (
      <>
        <div className="flex items-center space-x-2">
          {/* Member Rewards Button - Marriott/Hilton style */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSignUp}
            className="hidden md:flex items-center gap-2 text-amber-600 hover:text-amber-700"
          >
            <Award className="h-4 w-4" />
            <span className="font-semibold">Join Rewards</span>
          </Button>
          
          <Button variant="ghost" size="sm" onClick={handleSignUp}>
            <UserPlus className="h-4 w-4 mr-2" />
            Sign Up
          </Button>
          <Button variant="outline" size="sm" onClick={handleSignIn}>
            <LogIn className="h-4 w-4 mr-2" />
            Sign In
          </Button>
        </div>
        
        {/* Member Login Modal */}
        <MemberLoginModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
      </>
    );
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon">
        <User className="h-4 w-4" />
      </Button>
      {/* Dropdown menu would go here */}
    </div>
  );
}
