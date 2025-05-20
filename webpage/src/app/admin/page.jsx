'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input, Label, FormGroup } from '@/components/ui/Input';
import { showToast } from '@/lib/toastUtil';
import DbStatsPanel from '@/components/DbStatsPanel';

export default function AdminPage() {
  const { user: currentUser, isAdmin } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [statsRefreshTrigger, setStatsRefreshTrigger] = useState(0);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    isAdmin: false
  });

  useEffect(() => {
    // Check if user is admin, if not redirect to home
    if (currentUser && !isAdmin) {
      router.push('/');
    }

    // Fetch users
    fetchUsers();
  }, [currentUser, isAdmin, router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add user');
      }
      
      const data = await response.json();
      showToast('User added successfully');
      
      // Reset form and fetch users
      setNewUser({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        isAdmin: false
      });
      setShowAddUser(false);
      fetchUsers();
      
      // Trigger stats refresh
      setStatsRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error adding user:', error);
      showToast(error.message, 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    console.log('handleDeleteUser called with userId:', userId);
    
    // Get user details for the confirmation message
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) {
      showToast('User not found', 'error');
      console.error('User not found for deletion:', userId, 'Available users:', users);
      return;
    }
    
    // Show a more detailed confirmation dialog
    const confirmMessage = `Are you sure you want to delete user ${userToDelete.email}? This will permanently remove the user and all their data, including favorites, settings, and usage history.`;
    
    if (!confirm(confirmMessage)) {
      console.log('User deletion cancelled by confirmation dialog');
      return;
    }
    
    console.log('Beginning user deletion process for', userToDelete.email);
    
    // Set deleting state for this specific user
    setDeletingUserId(userId);
    
    try {
      // Delete the user
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }
      
      // Show success toast and refresh user list
      showToast(`User ${userToDelete.email} deleted successfully`);
      fetchUsers();
      
      // Trigger stats refresh
      setStatsRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast(`Error deleting user: ${error.message}`, 'error');
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = prompt('Enter the new password for this user:');
    
    if (!newPassword) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newPassword })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reset password');
      }
      
      showToast('Password reset successfully');
    } catch (error) {
      console.error('Error resetting password:', error);
      showToast(error.message, 'error');
    }
  };

  const toggleAdminStatus = async (userId, currentStatus) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isAdmin: !currentStatus })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update admin status');
      }
      
      showToast('User admin status updated successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error updating admin status:', error);
      showToast(error.message, 'error');
    }
  };

  if (loading && !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage users, permissions, and view database statistics
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              onClick={() => router.push('/')}
            >
              Back to Application
            </Button>
            <Button 
              variant="primary" 
              onClick={() => setShowAddUser(!showAddUser)}
            >
              {showAddUser ? 'Cancel' : 'Add New User'}
            </Button>
          </div>
        </div>
        
        {/* Database Statistics Panel */}
        <DbStatsPanel refreshTrigger={statsRefreshTrigger} />
        
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">User Management</h2>

        {/* Add User Form */}
        {showAddUser && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-md mb-6">
            <h2 className="text-lg font-semibold mb-4">Add New User</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormGroup>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={newUser.email}
                    onChange={handleInputChange}
                    placeholder="user@example.com"
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={newUser.password}
                    onChange={handleInputChange}
                    placeholder="Minimum 8 characters"
                  />
                </FormGroup>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormGroup>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={newUser.firstName}
                    onChange={handleInputChange}
                    placeholder="First name"
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={newUser.lastName}
                    onChange={handleInputChange}
                    placeholder="Last name"
                  />
                </FormGroup>
              </div>
              
              <div className="flex items-center">
                <input
                  id="isAdmin"
                  name="isAdmin"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  checked={newUser.isAdmin}
                  onChange={handleInputChange}
                />
                <label htmlFor="isAdmin" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Admin User
                </label>
              </div>
              
              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  type="button"
                  className="mr-2"
                  onClick={() => setShowAddUser(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                >
                  Add User
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Users List */}
        <div className="bg-white dark:bg-gray-800 rounded-md shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      Loading users...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-red-500">
                      Error: {error}
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              ID: {user.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.isAdmin 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {user.isAdmin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => toggleAdminStatus(user.id, user.isAdmin)}
                            className="px-2 py-1 text-xs font-medium rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                            disabled={user.id === currentUser?.id}
                          >
                            {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                          </button>
                          <button
                            onClick={() => handleResetPassword(user.id)}
                            className="px-2 py-1 text-xs font-medium rounded-md bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-800 transition-colors"
                          >
                            Reset Password
                          </button>
                          <button
                            onClick={() => {
                              if (!(user.id === currentUser?.id || deletingUserId === user.id)) {
                                handleDeleteUser(user.id);
                              }
                            }}
                            className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                              user.id === currentUser?.id
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'
                                : deletingUserId === user.id
                                ? 'bg-red-50 text-gray-500 animate-pulse dark:bg-red-900 dark:text-gray-400'
                                : 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800'
                            }`}
                            disabled={user.id === currentUser?.id || deletingUserId === user.id}
                          >
                            {deletingUserId === user.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}