import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { logger } from '../utils/logger';
import type { User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize authentication state
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        if (authService.isAuthenticated()) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          
          logger.info('User session restored', {
            component: 'AuthProvider',
            userId: currentUser?.id,
            email: currentUser?.email,
          });
        }
      } catch (error) {
        logger.warn('Failed to restore user session', {
          component: 'AuthProvider',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        
        // Clear invalid token
        authService.logout();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const result = await authService.login(email, password);
      
      if (result.success) {
        setUser(result.user);
        
        logger.info('User logged in successfully', {
          component: 'AuthProvider',
          userId: result.user.id,
          email: result.user.email,
        });
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      logger.error('Login failed', {
        component: 'AuthProvider',
        email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  };

  const register = async (
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string
  ): Promise<void> => {
    try {
      const result = await authService.register(email, password, firstName, lastName);
      
      if (result.success) {
        setUser(result.user);
        
        logger.info('User registered successfully', {
          component: 'AuthProvider',
          userId: result.user.id,
          email: result.user.email,
        });
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      logger.error('Registration failed', {
        component: 'AuthProvider',
        email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  };

  const logout = (): void => {
    try {
      logger.info('User logging out', {
        component: 'AuthProvider',
        userId: user?.id,
        email: user?.email,
      });
      
      authService.logout();
      setUser(null);
    } catch (error) {
      logger.error('Logout failed', {
        component: 'AuthProvider',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const updateUser = (userData: Partial<User>): void => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      logger.info('User data updated', {
        component: 'AuthProvider',
        userId: user.id,
        updatedFields: Object.keys(userData),
      });
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Hook for checking if user has specific role
export const useRole = (requiredRole: string): boolean => {
  const { user } = useAuth();
  return user?.role === requiredRole;
};

// Hook for admin access
export const useIsAdmin = (): boolean => {
  return useRole('admin');
};