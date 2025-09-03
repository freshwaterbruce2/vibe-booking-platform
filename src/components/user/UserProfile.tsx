import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { User, Settings, Shield, History, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { authService } from '@/services/authService';
import { toast } from 'sonner';

export const UserProfile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const userData = await authService.getCurrentUser();
      if (userData) {
        setUser(userData);
        setProfileData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          phone: userData.phone || '',
        });
      }
    } catch (error) {
      toast.error('Failed to load profile information');
    } finally {
      setIsLoading(false);
    }
  };

  const validateProfileForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!profileData.firstName?.trim()) errors.firstName = 'First name is required';
    if (!profileData.lastName?.trim()) errors.lastName = 'Last name is required';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSave = async () => {
    if (!validateProfileForm()) return;

    try {
      setIsSaving(true);
      await authService.updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
      });

      if (user) {
        setUser({
          ...user,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phone: profileData.phone,
        });
      }

      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      setIsChangingPassword(true);
      await authService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordSection(false);
      toast.success('Password updated successfully');
    } catch (error) {
      toast.error('Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    try {
      await authService.resendVerificationEmail(user.email);
      toast.success('Verification email sent');
    } catch (error) {
      toast.error('Failed to send verification email');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-luxury-navy" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">Failed to load user profile.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-luxury-navy to-slate-600 bg-clip-text text-transparent">
          Profile Settings
        </h1>
        <p className="text-slate-600 mt-2">Manage your account information and preferences</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Information */}
        <div className="bg-white rounded-xl shadow-luxury-lg overflow-hidden">
          <div className="bg-gradient-to-r from-luxury-navy to-slate-700 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </h2>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <Input
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  className={validationErrors.firstName ? 'border-red-500' : ''}
                />
                {validationErrors.firstName && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <Input
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  className={validationErrors.lastName ? 'border-red-500' : ''}
                />
                {validationErrors.lastName && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <Input value={user.email} disabled className="bg-slate-50" />
              <div className="flex items-center gap-2 mt-2">
                {user.emailVerified ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Email verified
                  </Badge>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-100 text-red-800">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Email not verified
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResendVerification}
                      className="text-luxury-navy hover:text-luxury-navy/80 p-0 h-auto text-sm"
                    >
                      Resend Verification Email
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number (Optional)</label>
              <Input
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                placeholder="+1-555-0123"
              />
            </div>

            <Button
              onClick={handleProfileSave}
              disabled={isSaving}
              className="bg-gradient-to-r from-luxury-navy to-slate-700 hover:from-luxury-navy/90 hover:to-slate-700/90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>

        {/* Password Change */}
        <div className="bg-white rounded-xl shadow-luxury-lg overflow-hidden">
          <div className="bg-gradient-to-r from-luxury-navy to-slate-700 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Change Password
            </h2>
          </div>
          
          <div className="p-6">
            {!showPasswordSection ? (
              <Button
                variant="outline"
                onClick={() => setShowPasswordSection(true)}
                className="border-luxury-navy text-luxury-navy hover:bg-luxury-navy hover:text-white"
              >
                Change Password
              </Button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <Input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <Input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <Input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handlePasswordChange}
                    disabled={isChangingPassword}
                    className="bg-gradient-to-r from-luxury-navy to-slate-700 hover:from-luxury-navy/90 hover:to-slate-700/90"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPasswordSection(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-xl shadow-luxury-lg overflow-hidden">
          <div className="bg-gradient-to-r from-luxury-navy to-slate-700 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Notification Preferences
            </h2>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="newsletter"
                  checked={user.preferences?.newsletter || false}
                  onChange={(e) => {
                    // Simple checkbox handling
                    console.log('Newsletter:', e.target.checked);
                  }}
                  className="h-4 w-4 text-luxury-navy border-gray-300 rounded focus:ring-luxury-navy"
                />
                <div>
                  <label htmlFor="newsletter" className="text-sm font-medium text-gray-900">
                    Newsletter Updates
                  </label>
                  <p className="text-xs text-gray-500">
                    Receive our monthly newsletter with travel tips and special offers
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="notifications"
                  checked={user.preferences?.notifications || false}
                  onChange={(e) => {
                    console.log('Notifications:', e.target.checked);
                  }}
                  className="h-4 w-4 text-luxury-navy border-gray-300 rounded focus:ring-luxury-navy"
                />
                <div>
                  <label htmlFor="notifications" className="text-sm font-medium text-gray-900">
                    Booking Notifications
                  </label>
                  <p className="text-xs text-gray-500">
                    Get notified about booking confirmations, changes, and reminders
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="marketing"
                  checked={user.preferences?.marketing || false}
                  onChange={(e) => {
                    console.log('Marketing:', e.target.checked);
                  }}
                  className="h-4 w-4 text-luxury-navy border-gray-300 rounded focus:ring-luxury-navy"
                />
                <div>
                  <label htmlFor="marketing" className="text-sm font-medium text-gray-900">
                    Marketing Communications
                  </label>
                  <p className="text-xs text-gray-500">
                    Receive promotional offers and personalized recommendations
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking History Summary */}
        {user.bookingStats && (
          <div className="bg-white rounded-xl shadow-luxury-lg overflow-hidden">
            <div className="bg-gradient-to-r from-luxury-navy to-slate-700 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <History className="h-5 w-5" />
                Booking History
              </h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-luxury-navy">
                    {user.bookingStats.totalBookings}
                  </div>
                  <div className="text-sm text-gray-600">total bookings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {user.bookingStats.upcomingBookings}
                  </div>
                  <div className="text-sm text-gray-600">upcoming</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {user.bookingStats.completedBookings}
                  </div>
                  <div className="text-sm text-gray-600">completed</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-luxury-gold">
                    {user.bookingStats.favoriteDestination}
                  </div>
                  <div className="text-sm text-gray-600">Favorite: {user.bookingStats.favoriteDestination}</div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <Button
                  variant="outline"
                  className="w-full border-luxury-navy text-luxury-navy hover:bg-luxury-navy hover:text-white"
                >
                  View All Bookings
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};