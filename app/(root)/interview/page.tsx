"use client";
import React, { useEffect, useState } from 'react';
import Agent from '@/components/agent';

const page = () => {
    const [userName, setUserName] = useState<string>('');
    const [userId, setUserId] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getUser = async () => {
            try {
                // First try to get the authenticated user
                const response = await fetch('/api/auth/current-user');
                if (response.ok) {
                    const userData = await response.json();
                    if (userData.success && userData.user) {
                        setUserName(userData.user.name || 'User');
                        setUserId(userData.user.id);
                        // Store in localStorage for consistency
                        localStorage.setItem('userId', userData.user.id);
                        localStorage.setItem('userName', userData.user.name || 'User');
                        setLoading(false);
                        return;
                    }
                }
                
                // If no authenticated user, fall back to localStorage or create new user
                let storedUserId = localStorage.getItem('userId');
                let storedUserName = localStorage.getItem('userName');
                
                if (!storedUserId) {
                    // Generate a simple user ID if none exists
                    storedUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    localStorage.setItem('userId', storedUserId);
                }
                
                if (!storedUserName) {
                    // Ask user for their name with a better prompt
                    const promptedName = prompt('Please enter your name for the interview session:');
                    if (promptedName && promptedName.trim()) {
                        localStorage.setItem('userName', promptedName.trim());
                        storedUserName = promptedName.trim();
                    } else {
                        // More descriptive fallback
                        storedUserName = 'Anonymous User';
                        localStorage.setItem('userName', storedUserName);
                    }
                }
                
                setUserId(storedUserId);
                setUserName(storedUserName);
                setLoading(false);
                
            } catch (error) {
                console.error('Error getting user:', error);
                // Fall back to anonymous user
                const guestId = `guest_${Date.now()}`;
                setUserId(guestId);
                setUserName('Anonymous User');
                setLoading(false);
            }
        };

        getUser();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-96">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
                    <span>Loading interview...</span>
                </div>
            </div>
        );
    }

    return (
        <>
            <h3>AI Interview Practice</h3>
            <p className="text-sm text-gray-600 mb-4">Welcome, {userName}!</p>
            <Agent userName={userName} userId={userId} type="generate"/>
        </>
    );
};

export default page;