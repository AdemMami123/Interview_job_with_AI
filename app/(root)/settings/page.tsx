"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import UserProfile from '@/components/UserProfile';

const SettingsPage = () => {
  const [user, setUser] = useState<{id: string, name: string, email: string} | null>(null);
  const [stats, setStats] = useState<{totalInterviews: number, averageScore: number, totalHours: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    interviewReminders: true,
    darkMode: true,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    interviewDuration: 30,
    voiceEnabled: true,
    autoSave: true,
    feedbackDetail: 'detailed' as 'basic' | 'detailed' | 'comprehensive',
    profileVisibility: 'private' as 'public' | 'private',
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const [userResponse, statsResponse, preferencesResponse] = await Promise.all([
        fetch('/api/auth/current-user'),
        fetch('/api/auth/user-stats'),
        fetch('/api/auth/preferences')
      ]);

      if (userResponse.ok) {
        const userData = await userResponse.json();
        if (userData.success && userData.user) {
          setUser(userData.user);
        }
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.stats);
        }
      }

      if (preferencesResponse.ok) {
        const preferencesData = await preferencesResponse.json();
        if (preferencesData.success) {
          setPreferences(preferencesData.preferences);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleUserUpdate = (updatedUser: {id: string, name: string, email: string}) => {
    setUser(updatedUser);
  };

  const handlePreferenceChange = async (key: string, value: boolean) => {
    const newPreferences = {
      ...preferences,
      [key]: value
    };
    
    setPreferences(newPreferences);
    setHasUnsavedChanges(true);

    // Auto-save preferences
    try {
      setSavingPreferences(true);
      const response = await fetch('/api/auth/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPreferences),
      });

      if (response.ok) {
        toast.success('Preference updated successfully');
        setHasUnsavedChanges(false);
      } else {
        throw new Error('Failed to save preference');
      }
    } catch (error) {
      console.error('Error saving preference:', error);
      // Revert the change if save failed
      setPreferences(preferences);
      setHasUnsavedChanges(false);
      toast.error('Failed to save preference. Please try again.');
    } finally {
      setSavingPreferences(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account and application preferences</p>
        </div>
        
        <div className="flex justify-center items-center min-h-96">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-5 h-5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-5 h-5 bg-blue-500 rounded-full animate-bounce"></div>
            </div>
            <span className="text-gray-300">Loading settings...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load user data</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your account and application preferences</p>
      </div>

      {/* Profile Section */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">Profile Information</h2>
        <UserProfile 
          user={user} 
          stats={stats || undefined}
          onUpdate={handleUserUpdate}
        />
      </section>

      {/* Preferences Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Preferences</h2>
          {savingPreferences && (
            <div className="flex items-center gap-2 text-sm text-blue-400">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </div>
          )}
        </div>
        <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 space-y-6">
          
          {/* Notification Settings */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Notifications</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white">Email Notifications</div>
                  <div className="text-sm text-gray-400">Receive updates about your interviews via email</div>
                </div>
                <button
                  onClick={() => handlePreferenceChange('emailNotifications', !preferences.emailNotifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    preferences.emailNotifications ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white">Interview Reminders</div>
                  <div className="text-sm text-gray-400">Get reminded about scheduled interview sessions</div>
                </div>
                <button
                  onClick={() => handlePreferenceChange('interviewReminders', !preferences.interviewReminders)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    preferences.interviewReminders ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.interviewReminders ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Appearance Settings */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-white mb-4">Appearance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white">Dark Mode</div>
                  <div className="text-sm text-gray-400">Use dark theme throughout the application</div>
                </div>
                <button
                  onClick={() => handlePreferenceChange('darkMode', !preferences.darkMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    preferences.darkMode ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.darkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data & Privacy */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">Data & Privacy</h2>
        <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-white">Export Data</h3>
              <p className="text-sm text-gray-400 mt-1">
                Download a copy of your interview data and feedback
              </p>
            </div>
            <Button 
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-800"
              onClick={() => toast.info('Data export feature coming soon')}
            >
              Export Data
            </Button>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-red-400">Delete Account</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <Button 
                variant="outline"
                className="border-red-600 text-red-400 hover:bg-red-900/30"
                onClick={() => toast.error('Account deletion is not implemented yet')}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;
