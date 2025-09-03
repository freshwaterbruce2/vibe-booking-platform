import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { authService } from './authService';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('AuthService Email Verification - TDD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Email Verification System (RED PHASE - These tests should FAIL)', () => {
    it('should send email verification when user registers', async () => {
      // This test SHOULD FAIL initially - we haven't implemented verification yet
      const mockResponse = {
        data: {
          success: true,
          data: {
            accessToken: 'mock-token',
            user: {
              id: '123',
              email: 'test@example.com',
              firstName: 'John',
              lastName: 'Doe',
              emailVerified: false, // New user should not be verified
            }
          }
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await authService.register('test@example.com', 'password123', 'John', 'Doe');

      // These assertions should FAIL because we haven't implemented verification
      expect(result.user.emailVerified).toBe(false);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/register'),
        expect.objectContaining({
          email: 'test@example.com',
          sendVerificationEmail: true, // This should be sent but isn't implemented yet
        })
      );
    });

    it('should have verifyEmail method that sends verification request', async () => {
      // This test SHOULD FAIL - method doesn't exist yet
      const mockResponse = {
        data: {
          success: true,
          message: 'Verification email sent'
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      // This should fail because verifyEmail method doesn't exist
      expect(authService.verifyEmail).toBeDefined();
      
      const result = await authService.verifyEmail('test@example.com');
      expect(result.success).toBe(true);
    });

    it('should have confirmEmailVerification method that confirms verification token', async () => {
      // This test SHOULD FAIL - method doesn't exist yet
      const mockResponse = {
        data: {
          success: true,
          data: {
            user: {
              id: '123',
              email: 'test@example.com',
              emailVerified: true,
            }
          }
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      // This should fail because confirmEmailVerification method doesn't exist
      expect(authService.confirmEmailVerification).toBeDefined();
      
      const result = await authService.confirmEmailVerification('verification-token-123');
      expect(result.success).toBe(true);
      expect(result.user.emailVerified).toBe(true);
    });

    it('should check if current user email is verified', async () => {
      // Mock authenticated user
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'mock-token';
        if (key === 'user') return JSON.stringify({
          id: '123',
          email: 'test@example.com',
          emailVerified: false
        });
        return null;
      });

      const mockResponse = {
        data: {
          success: true,
          data: {
            user: {
              id: '123',
              email: 'test@example.com',
              firstName: 'Test',
              lastName: 'User',
              emailVerified: false
            }
          }
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      // This should fail because we don't track email verification status
      const user = await authService.getCurrentUser();
      expect(user).toBeDefined();
      expect(user?.emailVerified).toBeDefined();
    });

    it('should resend verification email for unverified users', async () => {
      // This test SHOULD FAIL - method doesn't exist yet
      const mockResponse = {
        data: {
          success: true,
          message: 'Verification email resent'
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      // This should fail because resendVerificationEmail method doesn't exist
      expect(authService.resendVerificationEmail).toBeDefined();
      
      const result = await authService.resendVerificationEmail('test@example.com');
      expect(result.success).toBe(true);
    });
  });
});