"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import UserProfile from '@/components/UserProfile';

interface UserPreferences {
  // Notification preferences
  emailNotifications: boolean;
  interviewReminders: boolean;
  
  // Interview preferences
  difficulty: 'easy' | 'medium' | 'hard';
  interviewDuration: number;
  voiceEnabled: boolean;
  autoSave: boolean;
  feedbackDetail: 'basic' | 'detailed' | 'comprehensive';
  
  // Appearance preferences
  darkMode: boolean;
  
  // Privacy preferences
  profileVisibility: 'public' | 'private';
}

const ProfilePage = () => {
  const [user, setUser] = useState<{id: string, name: string, email: string, createdAt?: string} | null>(null);
  const [stats, setStats] = useState<{totalInterviews: number, averageScore: number, totalHours: number} | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchUserProfile();
    fetchUserStats();
    fetchUserPreferences();

    // Warn user about unsaved changes before leaving
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/auth/current-user');
      if (response.ok) {
        const userData = await response.json();
        if (userData.success && userData.user) {
          setUser(userData.user);
        } else {
          toast.error('Failed to load profile data: ' + (userData.error || 'Unknown error'));
        }
      } else if (response.status === 401) {
        toast.error('Please sign in to view your profile');
        router.push('/sign-in');
      } else {
        toast.error(`Failed to fetch profile data (${response.status})`);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Network error while loading profile. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      setLoadingStats(true);
      const response = await fetch('/api/auth/user-stats');
      if (response.ok) {
        const statsData = await response.json();
        if (statsData.success) {
          setStats(statsData.stats);
        } else {
          console.warn('Failed to load stats:', statsData.error);
        }
      } else if (response.status === 401) {
        console.warn('Unauthorized access to stats');
      } else {
        console.warn('Failed to fetch stats:', response.status);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Don't show error toast for stats as it's not critical
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchUserPreferences = async () => {
    try {
      setLoadingPreferences(true);
      const response = await fetch('/api/auth/preferences');
      if (response.ok) {
        const preferencesData = await response.json();
        if (preferencesData.success) {
          setPreferences({
            // Notification preferences
            emailNotifications: preferencesData.preferences.emailNotifications ?? true,
            interviewReminders: preferencesData.preferences.interviewReminders ?? true,
            
            // Interview preferences  
            difficulty: preferencesData.preferences.difficulty ?? 'medium',
            interviewDuration: preferencesData.preferences.interviewDuration ?? 30,
            voiceEnabled: preferencesData.preferences.voiceEnabled ?? true,
            autoSave: preferencesData.preferences.autoSave ?? true,
            feedbackDetail: preferencesData.preferences.feedbackDetail ?? 'detailed',
            
            // Appearance preferences
            darkMode: preferencesData.preferences.darkMode ?? true,
            
            // Privacy preferences
            profileVisibility: preferencesData.preferences.profileVisibility ?? 'private',
          });
        } else {
          console.warn('Failed to load preferences:', preferencesData.error);
          setDefaultPreferences();
        }
      } else if (response.status === 401) {
        console.warn('Unauthorized access to preferences');
        setDefaultPreferences();
      } else {
        console.warn('Failed to fetch preferences:', response.status);
        setDefaultPreferences();
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      setDefaultPreferences();
    } finally {
      setLoadingPreferences(false);
    }
  };

  const setDefaultPreferences = () => {
    setPreferences({
      // Notification preferences
      emailNotifications: true,
      interviewReminders: true,
      
      // Interview preferences  
      difficulty: 'medium',
      interviewDuration: 30,
      voiceEnabled: true,
      autoSave: true,
      feedbackDetail: 'detailed',
      
      // Appearance preferences
      darkMode: true,
      
      // Privacy preferences
      profileVisibility: 'private',
    });
  };

  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    setPreferences(prev => prev ? { ...prev, [key]: value } : null);
    setHasUnsavedChanges(true);
  };

  const savePreferences = async () => {
    if (!preferences) return;
    
    setSavingPreferences(true);
    try {
      // Validate preferences before saving
      const validationErrors = validatePreferencesClient(preferences);
      if (validationErrors.length > 0) {
        toast.error(`Invalid settings: ${validationErrors.join(', ')}`);
        return;
      }
      
      const response = await fetch('/api/auth/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        toast.success('Settings saved successfully');
        setHasUnsavedChanges(false);
      } else if (response.status === 400 && result.details) {
        toast.error(`Validation errors: ${result.details.join(', ')}`);
      } else if (response.status === 401) {
        toast.error('Please sign in again to save your settings');
        router.push('/sign-in');
      } else {
        toast.error(result.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error('Network error. Please check your internet connection.');
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setSavingPreferences(false);
    }
  };

  // Client-side validation for preferences
  const validatePreferencesClient = (prefs: UserPreferences): string[] => {
    const errors: string[] = [];
    
    if (prefs.interviewDuration < 15 || prefs.interviewDuration > 120) {
      errors.push('Interview duration must be between 15 and 120 minutes');
    }
    
    if (!['easy', 'medium', 'hard'].includes(prefs.difficulty)) {
      errors.push('Invalid difficulty level');
    }
    
    if (!['basic', 'detailed', 'comprehensive'].includes(prefs.feedbackDetail)) {
      errors.push('Invalid feedback detail level');
    }
    
    return errors;
  };

  const handleUserUpdate = (updatedUser: {id: string, name: string, email: string}) => {
    setUser(updatedUser);
  };

  const resetToDefaults = () => {
    setDefaultPreferences();
    setHasUnsavedChanges(true);
    toast.info('Settings reset to defaults. Don\'t forget to save!');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
          <p className="text-gray-400">Manage your account information and preferences</p>
        </div>
        
        <div className="flex justify-center items-center min-h-96">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-5 h-5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-5 h-5 bg-blue-500 rounded-full animate-bounce"></div>
            </div>
            <span className="text-gray-300">Loading your profile...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
          <p className="text-gray-400">Manage your account information and preferences</p>
        </div>
        
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Unable to Load Profile</h2>
          <p className="text-gray-400 mb-6">
            We couldn't load your profile data. Please try signing in again.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => router.push('/')} variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
              Go Back Home
            </Button>
            <Button onClick={() => router.push('/sign-in')} className="bg-blue-600 hover:bg-blue-500 text-white">
              Sign In Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
        <p className="text-gray-400">Manage your account information and preferences</p>
      </div>

      {/* Profile Section */}
      <UserProfile 
        user={user} 
        stats={loadingStats ? undefined : stats || undefined}
        onUpdate={handleUserUpdate}
        isLoadingStats={loadingStats}
      />

      {/* Settings Section */}
      <div className="mt-8 bg-gray-900 rounded-2xl border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Settings & Preferences</h2>
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 text-sm text-yellow-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Unsaved changes
            </div>
          )}
        </div>
        
        {loadingPreferences ? (
          <div className="space-y-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="w-32 h-6 bg-gray-700 rounded animate-pulse"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="p-4 bg-gray-800 rounded-lg">
                      <div className="w-24 h-4 bg-gray-700 rounded animate-pulse mb-2"></div>
                      <div className="w-32 h-3 bg-gray-700 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : preferences ? (
          <div className="space-y-8">
            {/* Notification Settings */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-6h0z" />
                </svg>
                Notifications
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-white">Email Notifications</label>
                    <p className="text-sm text-gray-400">Receive updates about your interviews</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.emailNotifications}
                      onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-white">Interview Reminders</label>
                    <p className="text-sm text-gray-400">Get reminded before scheduled interviews</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.interviewReminders}
                      onChange={(e) => handlePreferenceChange('interviewReminders', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Interview Preferences */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Interview Preferences
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Default Difficulty</label>
                    <select
                      value={preferences.difficulty}
                      onChange={(e) => handlePreferenceChange('difficulty', e.target.value)}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="easy">Easy - Beginner level questions</option>
                      <option value="medium">Medium - Intermediate level questions</option>
                      <option value="hard">Hard - Advanced level questions</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Interview Duration</label>
                    <select
                      value={preferences.interviewDuration}
                      onChange={(e) => handlePreferenceChange('interviewDuration', parseInt(e.target.value))}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value={15}>15 minutes - Quick practice</option>
                      <option value={30}>30 minutes - Standard interview</option>
                      <option value={45}>45 minutes - Extended session</option>
                      <option value={60}>60 minutes - Full interview simulation</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Feedback Detail Level</label>
                    <select
                      value={preferences.feedbackDetail}
                      onChange={(e) => handlePreferenceChange('feedbackDetail', e.target.value)}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="basic">Basic - Quick overview</option>
                      <option value="detailed">Detailed - Comprehensive analysis</option>
                      <option value="comprehensive">Comprehensive - In-depth insights</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-white">Voice Interview Mode</label>
                      <p className="text-sm text-gray-400">Enable voice responses during interviews</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.voiceEnabled}
                        onChange={(e) => handlePreferenceChange('voiceEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-white">Auto-Save Progress</label>
                      <p className="text-sm text-gray-400">Automatically save interview progress</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.autoSave}
                        onChange={(e) => handlePreferenceChange('autoSave', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Appearance Settings */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
                Appearance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-white">Dark Mode</label>
                      <p className="text-sm text-gray-400">Use dark theme for the interface</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.darkMode}
                        onChange={(e) => handlePreferenceChange('darkMode', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Privacy & Data
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-white">Profile Visibility</label>
                    <p className="text-sm text-gray-400">Control who can see your profile</p>
                  </div>
                  <select
                    value={preferences.profileVisibility}
                    onChange={(e) => handlePreferenceChange('profileVisibility', e.target.value)}
                    className="p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-6 border-t border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-400">
                  {savingPreferences ? 'Saving your preferences...' : hasUnsavedChanges ? 'You have unsaved changes' : 'All changes are saved'}
                </div>
                <Button
                  onClick={resetToDefaults}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-white"
                >
                  Reset to Defaults
                </Button>
              </div>
              <Button
                onClick={savePreferences}
                disabled={savingPreferences || !hasUnsavedChanges}
                className="bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingPreferences ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </div>
                ) : (
                  'Save All Settings'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">Unable to load preferences. Please try refreshing the page.</p>
            <Button 
              onClick={() => window.location.reload()}
              className="mt-4 bg-blue-600 hover:bg-blue-500 text-white"
            >
              Refresh Page
            </Button>
          </div>
        )}
      </div>


    </div>
  );
};

export default ProfilePage;
