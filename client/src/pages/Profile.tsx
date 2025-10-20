import React, { useEffect, useState, useRef } from 'react';
import { changePassword, getProfile } from '../services/api';

const Profile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<{[key: string]: string}>({});
  const [showPassword, setShowPassword] = useState<{[key: string]: boolean}>({});
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getProfile();
        setUser(data.user);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const validatePassword = (field: string, value: string) => {
    const errors = { ...passwordErrors };
    
    if (field === 'newPassword') {
      if (value.length < 8) {
        errors.newPassword = 'Password must be at least 8 characters';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        errors.newPassword = 'Password must contain uppercase, lowercase, and number';
      } else {
        delete errors.newPassword;
      }
    }
    
    if (field === 'confirm' && value !== newPassword) {
      errors.confirm = 'Passwords do not match';
    } else if (field === 'confirm') {
      delete errors.confirm;
    }
    
    setPasswordErrors(errors);
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const onChangePassword = async () => {
    setMessage(null);
    setError(null);
    
    if (!currentPassword || !newPassword || !confirm) {
      setError('Please fill all password fields');
      return;
    }
    
    if (Object.keys(passwordErrors).length > 0) {
      setError('Please fix password validation errors');
      return;
    }
    
    try {
      setSaving(true);
      await changePassword(currentPassword, newPassword);
      setMessage('Password updated successfully! 🎉');
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
      setPasswordErrors({});
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roles = {
      coordinator: 'Administrator',
      teacher: 'Teacher', 
      student: 'Student'
    };
    return roles[role as keyof typeof roles] || role;
  };

  const getRoleIcon = (role: string) => {
    const icons = {
      coordinator: '👔',
      teacher: '👨‍🏫',
      student: '🎓'
    };
    return icons[role as keyof typeof icons] || '👤';
  };

  const getRoleColor = (role: string) => {
    const colors = {
      coordinator: 'from-purple-500 to-pink-500',
      teacher: 'from-green-500 to-blue-500',
      student: 'from-blue-500 to-cyan-500'
    };
    return colors[role as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  // Enhanced Loading Component
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl p-6 space-y-4">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            My Profile ✨
          </h1>
          <p className="text-gray-600 text-lg">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="glass bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6 text-center hover-lift">
              {/* Avatar */}
              <div className="relative mb-6">
                <div className="relative inline-block">
                  <div className={`w-24 h-24 bg-gradient-to-r ${getRoleColor(user?.role)} rounded-full mx-auto flex items-center justify-center text-4xl shadow-lg`}>
                    {getRoleIcon(user?.role)}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors shadow-lg transform hover:scale-110"
                    title="Change profile picture"
                    aria-label="Change profile picture"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    // Handle file upload here
                    console.log('File selected:', e.target.files?.[0]);
                  }}
                />
              </div>

              {/* User Info */}
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {user?.name || user?.email?.split('@')[0] || 'User'}
              </h2>
              <p className="text-gray-600 mb-4">{user?.email}</p>
              
              {/* Role Badge */}
              <div className={`inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r ${getRoleColor(user?.role)} text-white rounded-full font-semibold text-sm shadow-lg`}>
                <span>{getRoleIcon(user?.role)}</span>
                <span>{getRoleDisplayName(user?.role)}</span>
              </div>

              {/* Quick Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-blue-600 text-lg">Active</div>
                    <div className="text-gray-600">Status</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-green-600 text-lg">
                      {new Date().toLocaleDateString()}
                    </div>
                    <div className="text-gray-600">Joined</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information */}
            <div className="glass bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6 hover-lift">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                  <span>📋</span>
                  <span>Profile Information</span>
                </h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
                  aria-label={isEditing ? "Cancel editing" : "Edit profile"}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-600">
                      {user?.email}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-600">
                      {getRoleDisplayName(user?.role)}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-600 font-mono text-sm">
                      #{user?.user_id || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Status</label>
                    <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-green-600 font-medium">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Password Change Section */}
            <div className="glass bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6 hover-lift">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <span>🔒</span>
                <span>Security Settings</span>
              </h3>

              {/* Success/Error Messages */}
              {message && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-3 animate-slide-in-right">
                  <div className="text-green-500 text-xl">✅</div>
                  <div className="text-green-800 font-medium">{message}</div>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3 animate-slide-in-right">
                  <div className="text-red-500 text-xl">❌</div>
                  <div className="text-red-800 font-medium">{error}</div>
                </div>
              )}

              <div className="space-y-4">
                {/* Current Password */}
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      id="currentPassword"
                      type={showPassword.current ? "text" : "password"}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                      placeholder="Enter your current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      aria-describedby="currentPassword-help"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showPassword.current ? "Hide password" : "Show password"}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {showPassword.current ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        )}
                      </svg>
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showPassword.new ? "text" : "password"}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white ${
                        passwordErrors.newPassword ? 'border-red-300' : 'border-gray-200'
                      }`}
                      placeholder="Enter your new password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        validatePassword('newPassword', e.target.value);
                      }}
                      aria-describedby="newPassword-help"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showPassword.new ? "Hide password" : "Show password"}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {showPassword.new ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        )}
                      </svg>
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="mt-1 text-sm text-red-600" role="alert">{passwordErrors.newPassword}</p>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    Password must be at least 8 characters with uppercase, lowercase, and number
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showPassword.confirm ? "text" : "password"}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white ${
                        passwordErrors.confirm ? 'border-red-300' : 'border-gray-200'
                      }`}
                      placeholder="Confirm your new password"
                      value={confirm}
                      onChange={(e) => {
                        setConfirm(e.target.value);
                        validatePassword('confirm', e.target.value);
                      }}
                      aria-describedby="confirmPassword-help"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showPassword.confirm ? "Hide password" : "Show password"}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {showPassword.confirm ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        )}
                      </svg>
                    </button>
                  </div>
                  {passwordErrors.confirm && (
                    <p className="mt-1 text-sm text-red-600" role="alert">{passwordErrors.confirm}</p>
                  )}
                </div>

                {/* Update Button */}
                <div className="pt-4">
                  <button
                    onClick={onChangePassword}
                    disabled={saving || Object.keys(passwordErrors).length > 0 || !currentPassword || !newPassword || !confirm}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
                    aria-describedby="updatePassword-help"
                  >
                    {saving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
