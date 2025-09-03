import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserProfile } from './UserProfile';
import { authService } from '../../services/authService';

// Mock auth service
vi.mock('../../services/authService', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
    updatePreferences: vi.fn(),
  },
}));

describe('User Profile Management - TDD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('User Profile System (RED PHASE - These tests should FAIL)', () => {
    it('should render UserProfile component with user information', async () => {
      // This test SHOULD FAIL - component doesn't exist yet
      const mockUser = {
        id: '123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1-555-0123',
        emailVerified: true,
        preferences: {
          newsletter: true,
          notifications: true,
          marketing: false,
        },
      };

      (authService.getCurrentUser as any).mockResolvedValue(mockUser);

      render(<UserProfile />);

      expect(screen.getByText('Profile Settings')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+1-555-0123')).toBeInTheDocument();
    });

    it('should allow editing and saving profile information', async () => {
      // This test SHOULD FAIL - edit functionality doesn't exist yet
      const mockUser = {
        id: '123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1-555-0123',
        emailVerified: true,
      };

      (authService.getCurrentUser as any).mockResolvedValue(mockUser);
      (authService.updateProfile as any).mockResolvedValue({ success: true });

      render(<UserProfile />);

      // Edit first name
      const firstNameInput = screen.getByDisplayValue('John');
      fireEvent.change(firstNameInput, { target: { value: 'Jonathan' } });

      // Save changes
      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(authService.updateProfile).toHaveBeenCalledWith({
          firstName: 'Jonathan',
          lastName: 'Doe',
          phone: '+1-555-0123',
        });
      });
    });

    it('should have password change functionality', async () => {
      // This test SHOULD FAIL - password change doesn't exist yet
      const mockUser = {
        id: '123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        emailVerified: true,
      };

      (authService.getCurrentUser as any).mockResolvedValue(mockUser);
      (authService.changePassword as any).mockResolvedValue({ success: true });

      render(<UserProfile />);

      // Find password section
      expect(screen.getByText('Change Password')).toBeInTheDocument();
      
      // Fill password fields
      const currentPasswordInput = screen.getByLabelText('Current Password');
      const newPasswordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

      fireEvent.change(currentPasswordInput, { target: { value: 'oldpassword123' } });
      fireEvent.change(newPasswordInput, { target: { value: 'NewPassword123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123!' } });

      // Submit password change
      const changePasswordButton = screen.getByText('Update Password');
      fireEvent.click(changePasswordButton);

      await waitFor(() => {
        expect(authService.changePassword).toHaveBeenCalledWith('oldpassword123', 'NewPassword123!');
      });
    });

    it('should display email verification status and allow resending verification', async () => {
      // This test SHOULD FAIL - email verification UI doesn't exist yet
      const mockUser = {
        id: '123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        emailVerified: false,
      };

      (authService.getCurrentUser as any).mockResolvedValue(mockUser);

      render(<UserProfile />);

      expect(screen.getByText('Email not verified')).toBeInTheDocument();
      expect(screen.getByText('Resend Verification Email')).toBeInTheDocument();

      const resendButton = screen.getByText('Resend Verification Email');
      expect(resendButton).toBeEnabled();
    });

    it('should have notification preferences management', async () => {
      // This test SHOULD FAIL - preferences management doesn't exist yet
      const mockUser = {
        id: '123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        emailVerified: true,
        preferences: {
          newsletter: true,
          notifications: false,
          marketing: false,
        },
      };

      (authService.getCurrentUser as any).mockResolvedValue(mockUser);
      (authService.updatePreferences as any).mockResolvedValue({ success: true });

      render(<UserProfile />);

      expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
      
      const newsletterCheckbox = screen.getByLabelText('Newsletter Updates');
      const notificationsCheckbox = screen.getByLabelText('Booking Notifications');
      const marketingCheckbox = screen.getByLabelText('Marketing Communications');

      expect(newsletterCheckbox).toBeChecked();
      expect(notificationsCheckbox).not.toBeChecked();
      expect(marketingCheckbox).not.toBeChecked();

      // Toggle notifications
      fireEvent.click(notificationsCheckbox);

      await waitFor(() => {
        expect(authService.updatePreferences).toHaveBeenCalledWith({
          newsletter: true,
          notifications: true,
          marketing: false,
        });
      });
    });

    it('should display booking history summary with view details link', async () => {
      // This test SHOULD FAIL - booking history summary doesn't exist yet
      const mockUser = {
        id: '123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        emailVerified: true,
        bookingStats: {
          totalBookings: 15,
          upcomingBookings: 2,
          completedBookings: 13,
          favoriteDestination: 'New York',
        },
      };

      (authService.getCurrentUser as any).mockResolvedValue(mockUser);

      render(<UserProfile />);

      expect(screen.getByText('Booking History')).toBeInTheDocument();
      expect(screen.getByText('15 total bookings')).toBeInTheDocument();
      expect(screen.getByText('2 upcoming')).toBeInTheDocument();
      expect(screen.getByText('13 completed')).toBeInTheDocument();
      expect(screen.getByText('Favorite: New York')).toBeInTheDocument();
      expect(screen.getByText('View All Bookings')).toBeInTheDocument();
    });

    it('should have form validation for profile updates', async () => {
      // This test SHOULD FAIL - validation doesn't exist yet
      const mockUser = {
        id: '123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1-555-0123',
        emailVerified: true,
      };

      (authService.getCurrentUser as any).mockResolvedValue(mockUser);

      render(<UserProfile />);

      // Clear required field
      const firstNameInput = screen.getByDisplayValue('John');
      fireEvent.change(firstNameInput, { target: { value: '' } });

      // Try to save
      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument();
        expect(authService.updateProfile).not.toHaveBeenCalled();
      });
    });

    it('should show loading states during profile operations', async () => {
      // This test SHOULD FAIL - loading states don't exist yet
      const mockUser = {
        id: '123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        emailVerified: true,
      };

      (authService.getCurrentUser as any).mockResolvedValue(mockUser);
      (authService.updateProfile as any).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      render(<UserProfile />);

      // Trigger an update
      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      // Should show loading state
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(saveButton).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
        expect(saveButton).toBeEnabled();
      });
    });
  });
});