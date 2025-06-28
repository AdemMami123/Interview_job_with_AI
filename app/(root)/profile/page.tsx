"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import UserProfile from '@/components/UserProfile';

interface UserPreferences {
  emailNotifications: boolean;
  interviewReminders: boolean;
  darkMode: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  interviewDuration: number;
  voiceEnabled: boolean;
}

const ProfilePage = () => {
  const [user, setUser] = useState<{id: string, name: string, email: string} | null>(null);
  const [stats, setStats] = useState<{totalInterviews: number, averageScore: number, totalHours: number} | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  const [loading, setLoading] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchUserProfile();
    fetchUserStats();
    fetchUserPreferences();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/auth/current-user');
      if (response.ok) {
        const userData = await response.json();
        if (userData.success && userData.user) {
          setUser(userData.user);
        }
      } else {
        toast.error('Failed to fetch profile data');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/auth/user-stats');
      if (response.ok) {
        const statsData = await response.json();
        if (statsData.success) {
          setStats(statsData.stats);
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUserPreferences = async () => {
    try {
      const response = await fetch('/api/auth/preferences');
      if (response.ok) {
        const preferencesData = await response.json();
        if (preferencesData.success) {
          setPreferences({
            emailNotifications: preferencesData.preferences.emailNotifications ?? true,
            interviewReminders: preferencesData.preferences.interviewReminders ?? true,
            darkMode: preferencesData.preferences.darkMode ?? true,
            difficulty: preferencesData.preferences.difficulty ?? 'medium',
            interviewDuration: preferencesData.preferences.interviewDuration ?? 30,
            voiceEnabled: preferencesData.preferences.voiceEnabled ?? true,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    setPreferences(prev => prev ? { ...prev, [key]: value } : null);
  };

  const savePreferences = async () => {
    if (!preferences) return;
    
    setSavingPreferences(true);
    try {
      const response = await fetch('/api/auth/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Settings saved successfully');
      } else {
        toast.error(result.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Error saving settings');
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleUserUpdate = (updatedUser: {id: string, name: string, email: string}) => {
    setUser(updatedUser);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load profile data</p>
        <Button onClick={() => router.push('/')} className="mt-4">
          Go Back Home
        </Button>
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
        stats={stats || undefined}
        onUpdate={handleUserUpdate}
      />

      {/* Settings Section */}
      <div className="mt-8 bg-gray-900 rounded-2xl border border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Interview Settings</h2>
        
        {preferences && (
          <div className="space-y-8">
            {/* Notification Settings */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
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
                
                <div className="flex items-center justify-between">
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
              <h3 className="text-lg font-medium text-white mb-4">Interview Preferences</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Default Difficulty</label>
                  <select
                    value={preferences.difficulty}
                    onChange={(e) => handlePreferenceChange('difficulty', e.target.value)}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Interview Duration (minutes)</label>
                  <select
                    value={preferences.interviewDuration}
                    onChange={(e) => handlePreferenceChange('interviewDuration', parseInt(e.target.value))}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between">
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
              </div>
            </div>

            {/* Appearance Settings */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Appearance</h3>
              <div className="flex items-center justify-between">
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

            {/* Save Button */}
            <div className="pt-6 border-t border-gray-700">
              <Button
                onClick={savePreferences}
                disabled={savingPreferences}
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                {savingPreferences ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="mt-8 bg-gray-900 rounded-2xl border border-gray-700 p-6">
        <div className="pt-6 border-t border-red-800">
          <h3 className="text-lg font-medium text-red-400 mb-4">Danger Zone</h3>
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-red-400">Delete Account</h4>
                <p className="text-sm text-gray-400 mt-1">
                  Permanently delete your account and all associated data. This action cannot be undone.
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
      </div>
    </div>
  );
};

export default ProfilePage;
