'use client';

import { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

// Create context
const AuthContext = createContext();

// Authentication provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch current user on mount
  useEffect(() => {
    async function loadUserFromSession() {
      try {
        setLoading(true);
        
        // Debug cookie information
        console.log('AuthContext: Current cookies:', document.cookie);
        
        const response = await fetch('/api/auth/me', {
          credentials: 'include' // Important: include cookies with the request
        });
        
        console.log('AuthContext: /api/auth/me response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('AuthContext: User data loaded:', data.user.email);
          setUser(data.user);
        } else {
          // If not authenticated and not on a public route, redirect will happen in middleware
          console.log('AuthContext: Not authenticated, response was not OK');
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to load user session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUserFromSession();
  }, []);

  // Register a new user
  const register = async (email, password, firstName, lastName) => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        toast.success('Registration successful');
        router.push('/');
        return { success: true };
      } else {
        toast.error(data.error || 'Registration failed');
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('An unexpected error occurred');
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Important: include cookies with the request
      });

      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        toast.success('Login successful');
        
        // Give the cookie a moment to be set before redirecting
        // Let the component handle the redirect instead
        return { success: true };
      } else {
        toast.error(data.error || 'Login failed');
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An unexpected error occurred');
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        setUser(null);
        toast.success('Logout successful');
        router.push('/login');
        return { success: true };
      } else {
        const data = await response.json();
        toast.error(data.error || 'Logout failed');
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('An unexpected error occurred');
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Password changed successfully');
        return { success: true };
      } else {
        toast.error(data.error || 'Failed to change password');
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Change password error:', error);
      toast.error('An unexpected error occurred');
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value = {
    user,
    loading,
    register,
    login,
    logout,
    changePassword,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;