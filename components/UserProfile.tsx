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
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

interface UserProfileProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
  onUpdate?: (updatedUser: {id: string, name: string, email: string}) => void;
  showStats?: boolean;
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
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();
      
      if (result.success) {
        setIsEditing(false);
        toast.success('Profile updated successfully');
        if (onUpdate) {
          onUpdate({ ...user, ...values });
        }
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error updating profile');
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
      <div className="flex items-center gap-4 mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <span className="text-2xl font-bold text-white">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">{user.name}</h2>
          <p className="text-gray-400">{user.email}</p>
          <p className="text-sm text-gray-500">Member since {new Date().getFullYear()}</p>
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
              <FormField
                control={form.control}
                name="name"
                label="Full Name"
                placeholder="Your full name"
              />
              <FormField
                control={form.control}
                name="email"
                label="Email Address"
                placeholder="Your email address"
                type="email"
              />
              
              <div className="flex gap-4">
                <Button 
                  type="submit" 
                  disabled={updating}
                  className="bg-blue-600 hover:bg-blue-500 text-white"
                >
                  {updating ? 'Updating...' : 'Save Changes'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleCancel}
                  className="border-gray-600 text-white hover:bg-gray-800"
                >
                  Cancel
                </Button>
              </div>
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
          <h3 className="text-lg font-medium text-white mb-4">Account Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {stats?.totalInterviews || 0}
              </div>
              <div className="text-sm text-gray-400">Interviews Completed</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {stats?.averageScore || 0}%
              </div>
              <div className="text-sm text-gray-400">Average Score</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">
                {stats?.totalHours || 0}h
              </div>
              <div className="text-sm text-gray-400">Hours Practiced</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
