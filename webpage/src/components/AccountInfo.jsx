import React from 'react';

export function AccountInfo({ user }) {
  return (
    <div className="account-info-container bg-gray-100 dark:bg-gray-800 p-4 rounded-md border border-gray-300 dark:border-gray-700 shadow-sm">
      <div className="flex flex-col space-y-1">
        <p className="text-sm text-gray-800 dark:text-gray-100">
          <span className="font-semibold dark:text-blue-300">Email:</span> {user?.email || 'No email available'}
        </p>
        <p className="text-sm text-gray-800 dark:text-gray-100">
          <span className="font-semibold dark:text-blue-300">Name:</span> {(user?.firstName || '') + ' ' + (user?.lastName || '') || 'No name available'}
        </p>
        <p className="text-sm text-gray-800 dark:text-gray-100">
          <span className="font-semibold dark:text-blue-300">Account Type:</span> {user?.isAdmin ? 'Administrator' : 'User'}
        </p>
      </div>
    </div>
  );
}