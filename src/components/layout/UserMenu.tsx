import { User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function UserMenu() {
  // In a real app, this would check authentication state
  const isAuthenticated = false;

  if (!isAuthenticated) {
    return (
      <Button variant="outline" size="sm">
        <LogIn className="h-4 w-4 mr-2" />
        Sign In
      </Button>
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