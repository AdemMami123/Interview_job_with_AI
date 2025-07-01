"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import FormField from "@/components/FormField";

const profileSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
  email: z.string()
    .email("Invalid email address")
    .min(5, "Email must be at least 5 characters")
    .max(100, "Email must be less than 100 characters")
    .toLowerCase(),
});

interface UserProfileProps {
  user: {
    id: string;
    name: string;
    email: string;
    createdAt?: string;
  };
  onUpdate?: (updatedUser: {id: string, name: string, email: string}) => void;
  showStats?: boolean;
  isLoadingStats?: boolean;
  stats?: {
    totalInterviews: number;
    averageScore: number;
    totalHours: number;
  };
}

const UserProfile: React.FC<UserProfileProps> = ({ 
  user, 
  onUpdate, 
  showStats = true, 
  isLoadingStats = false,
  stats 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
    },
  });

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    try {
      setUpdating(true);
      
      // Enhanced client-side validation
      const trimmedName = values.name.trim();
      const trimmedEmail = values.email.trim().toLowerCase();
      
      if (trimmedName.length < 2) {
        toast.error('Name must be at least 2 characters long');
        return;
      }
      
      if (trimmedName.length > 50) {
        toast.error('Name must be less than 50 characters');
        return;
      }
      
      // More robust email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        toast.error('Please enter a valid email address');
        return;
      }
      
      if (trimmedEmail.length > 100) {
        toast.error('Email address is too long');
        return;
      }
      
      // Check if values actually changed
      if (trimmedName === user.name && trimmedEmail === user.email) {
        toast.info('No changes detected');
        setIsEditing(false);
        return;
      }
      
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setIsEditing(false);
        toast.success('Profile updated successfully');
        if (onUpdate) {
          onUpdate({ ...user, name: trimmedName, email: trimmedEmail });
        }
        // Reset form with new values
        form.reset({ name: trimmedName, email: trimmedEmail });
      } else if (response.status === 400 && result.details) {
        toast.error(`Validation error: ${result.details.join(', ')}`);
      } else if (response.status === 409) {
        toast.error('This email address is already in use by another account');
      } else if (response.status === 401) {
        toast.error('Please sign in again to update your profile');
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error('Network error. Please check your internet connection.');
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    form.reset({
      name: user.name,
      email: user.email,
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6">
      {/* Profile Header */}
      <div className="flex items-start gap-6 mb-8">
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center ring-4 ring-gray-700">
            <span className="text-2xl font-bold text-white">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-900 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{user.name}</h2>
              <p className="text-gray-300 mb-2">{user.email}</p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Member since {user.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear()}
                </div>
                {stats && (
                  <div className="flex items-center gap-1 text-green-400 font-medium">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified Profile
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {stats && stats.totalInterviews > 0 && (
                <div className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full text-sm font-medium">
                  {stats.totalInterviews >= 20 ? 'Expert' : stats.totalInterviews >= 10 ? 'Advanced' : stats.totalInterviews >= 5 ? 'Intermediate' : 'Beginner'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-white">Account Information</h3>
          {!isEditing && (
            <Button 
              onClick={() => setIsEditing(true)}
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-800"
            >
              Edit Profile
            </Button>
          )}
        </div>

        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  label="Full Name"
                  placeholder="Enter your full name"
                />
                <FormField
                  control={form.control}
                  name="email"
                  label="Email Address"
                  placeholder="Enter your email address"
                  type="email"
                />
              </div>
              
              <div className="flex gap-4">
                <Button 
                  type="submit" 
                  disabled={updating || !form.formState.isValid}
                  className="bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Updating...
                    </div>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updating}
                  className="border-gray-600 text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  Cancel
                </Button>
              </div>
              
              {form.formState.errors.name || form.formState.errors.email ? (
                <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
                  <p className="text-red-400 text-sm">
                    Please fix the validation errors above before saving.
                  </p>
                </div>
              ) : null}
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Full Name
              </label>
              <div className="p-3 bg-gray-800 rounded-lg text-white">
                {user.name}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email Address
              </label>
              <div className="p-3 bg-gray-800 rounded-lg text-white">
                {user.email}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Account Stats */}
      {showStats && (
        <div className="mt-8 pt-6 border-t border-gray-700">
          <h3 className="text-lg font-medium text-white mb-6">Performance Overview</h3>
          
          {isLoadingStats ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-800 rounded-lg p-4 text-center">
                  <div className="w-12 h-8 bg-gray-700 rounded animate-pulse mb-2 mx-auto"></div>
                  <div className="w-20 h-4 bg-gray-700 rounded animate-pulse mx-auto"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-800 rounded-lg p-4 text-center hover:bg-gray-750 transition-colors">
                <div className="text-2xl font-bold text-blue-400">
                  {stats?.totalInterviews || 0}
                </div>
                <div className="text-sm text-gray-400">Interviews Completed</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center hover:bg-gray-750 transition-colors">
                <div className="text-2xl font-bold text-green-400">
                  {stats?.averageScore || 0}%
                </div>
                <div className="text-sm text-gray-400">Average Score</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center hover:bg-gray-750 transition-colors">
                <div className="text-2xl font-bold text-purple-400">
                  {stats?.totalHours || 0}h
                </div>
                <div className="text-sm text-gray-400">Hours Practiced</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center hover:bg-gray-750 transition-colors">
                <div className="text-2xl font-bold text-yellow-400">
                  {stats ? Math.round((stats.totalInterviews / Math.max(1, Math.ceil((Date.now() - new Date(user.createdAt || new Date()).getTime()) / (1000 * 60 * 60 * 24 * 7)))) * 10) / 10 : 0}
                </div>
                <div className="text-sm text-gray-400">Weekly Average</div>
              </div>
            </div>
          )}
          
          {/* Progress indicators */}
          {!isLoadingStats && stats && stats.totalInterviews > 0 && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Interview Frequency</span>
                  <span className="text-white">{stats.totalInterviews >= 10 ? 'Excellent' : stats.totalInterviews >= 5 ? 'Good' : 'Getting Started'}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(100, (stats.totalInterviews / 20) * 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Performance Level</span>
                  <span className="text-white">
                    {stats.averageScore >= 80 ? 'Expert' : stats.averageScore >= 60 ? 'Proficient' : stats.averageScore >= 40 ? 'Developing' : 'Beginner'}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${stats.averageScore}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          
          {!isLoadingStats && (!stats || stats.totalInterviews === 0) && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-white mb-2">Start Your Interview Journey</h4>
              <p className="text-gray-400 mb-4">
                Complete your first interview to see your performance statistics here.
              </p>
              <Button 
                onClick={() => window.location.href = '/interview'}
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                Start First Interview
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserProfile;
