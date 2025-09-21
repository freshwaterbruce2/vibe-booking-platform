
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/utils/cn';

interface NavigationProps {
  className?: string
}

const navItems = [
  { href: '/destinations', label: 'DESTINATIONS' },
  { href: '/deals', label: 'OFFERS' },
  { href: '/experiences', label: 'EXPERIENCES' },
  { href: '/rewards', label: 'REWARDS' },
];

export function Navigation({ className }: NavigationProps) {
  const location = useLocation();

  return (
    <nav className={cn('flex items-center space-x-8', className)}>
      {navItems.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary-600',
            location.pathname === item.href
              ? 'text-primary-600'
              : 'text-gray-600 dark:text-gray-300',
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}