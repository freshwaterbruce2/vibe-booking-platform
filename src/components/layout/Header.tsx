
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../ui/Button';
import { ThemeToggle } from './ThemeToggle';
import { Navigation } from './Navigation';
import { UserMenu } from './UserMenu';
import { Hotel, Search, Heart, User } from 'lucide-react';
import { cn } from '@/utils/cn';

export function Header() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <header className={cn(
      'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
      isHomePage && 'bg-transparent border-transparent',
    )}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center space-x-2 text-xl font-bold gradient-text"
        >
          <Hotel className="h-6 w-6 text-primary-600" />
          <span>Vibe Hotels</span>
        </Link>

        {/* Desktop Navigation */}
        <Navigation className="hidden md:flex" />

        {/* Right side actions */}
        <div className="flex items-center space-x-2">
          {/* Search button for mobile */}
          <Link to="/search">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
            >
              <Search className="h-4 w-4" />
            </Button>
          </Link>

          {/* Favorites */}
          <Button variant="ghost" size="icon">
            <Heart className="h-4 w-4" />
          </Button>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* User menu */}
          <UserMenu />

          {/* Mobile menu */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
          >
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
