"use client";
import React, { useState } from 'react';
import { logout } from '@/lib/actions/auth.action';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const LogoutButton = () => {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    try {
      // Call the logout API route
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Include cookies
      });
      
      const data = await response.json();
      
      if (data.success || response.ok) {
        // Clear any client-side storage
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        
        console.log('✅ Logout successful');
        
        // Redirect to sign-in page
        router.push('/sign-in');
        router.refresh(); // Force a refresh to clear any cached data
      } else {
        console.error('Logout failed:', data.message);
        // Still redirect even if there's an error to be safe
        clearAndRedirect();
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Redirect anyway to be safe
      clearAndRedirect();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const clearAndRedirect = () => {
    // Clear client-side data
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    
    // Force redirect
    window.location.href = '/sign-in';
  };

  return (
    <Button
      onClick={handleLogout}
      disabled={isLoggingOut}
      variant="outline"
      size="sm"
      className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors duration-200 disabled:opacity-50"
    >
      {isLoggingOut ? (
        <>
          <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
          Logging out...
        </>
      ) : (
        <>
          <svg 
            className="w-4 h-4 mr-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
            />
          </svg>
          Logout
        </>
      )}
    </Button>
  );
};

export default LogoutButton;
