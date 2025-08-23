import type { ButtonHTMLAttributes} from 'react';
import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'accent';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const buttonVariants = {
  base: 'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 hover:scale-105 active:scale-95 disabled:transform-none',
  variants: {
    primary: 'bg-gradient-to-r from-slate-800 to-slate-700 text-white hover:from-slate-700 hover:to-slate-600 focus-visible:ring-slate-500 shadow-luxury hover:shadow-luxury-lg',
    secondary: 'bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800 focus-visible:ring-amber-500 shadow-luxury hover:shadow-luxury-lg',
    outline: 'border-2 border-slate-300 bg-transparent text-slate-700 hover:bg-slate-800 hover:text-white hover:border-slate-800 focus-visible:ring-slate-500 shadow-luxury-sm hover:shadow-luxury',
    ghost: 'hover:bg-slate-100 hover:text-slate-800 focus-visible:ring-slate-400 rounded-lg',
    destructive: 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 focus-visible:ring-red-500 shadow-luxury hover:shadow-luxury-lg',
    accent: 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 focus-visible:ring-emerald-500 shadow-luxury hover:shadow-luxury-lg',
  },
  sizes: {
    sm: 'h-9 px-4 text-sm font-medium',
    md: 'h-11 px-6 text-base',
    lg: 'h-14 px-8 text-lg font-bold',
    icon: 'h-9 w-9 p-0',
  },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          buttonVariants.base,
          buttonVariants.variants[variant],
          buttonVariants.sizes[size],
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
