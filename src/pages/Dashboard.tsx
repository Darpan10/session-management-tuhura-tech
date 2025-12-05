import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  // const { user, logout } = useAuth();

  // const handleLogout = () => {
  //   logout();
  //   navigate('/login');
  // };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img src="/logo.svg" alt="Tuhura Tech" className="h-12 w-auto" />
              <h1 className="text-2xl font-bold text-gray-900">Session Management</h1>
            </div>
            {/* <button
              onClick={handleLogout}
              className="btn-secondary"
            >
              Logout
            </button> */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="card mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome back, Developer!
          </h2>
          <p className="text-gray-600">
            You're successfully logged in to the Session Management System.
          </p>
        </div>

        {/* User Info Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Profile</h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">User ID:</span>
                <span className="ml-2 text-gray-600">DEV-001</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <span className="ml-2 text-gray-600">developer@tuhuratech.com</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Roles:</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-tuhura-lightBlue text-tuhura-darkBlue">
                    Admin
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-tuhura-lightBlue text-tuhura-darkBlue">
                    Developer
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Session Info</h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Session Type:</span>
                <span className="ml-2 text-gray-600">JWT Bearer Token</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Login Time:</span>
                <span className="ml-2 text-gray-600">{new Date().toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/admin/sessions"
            className="card hover:shadow-xl transition-shadow cursor-pointer"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-tuhura-blue rounded-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Manage Sessions</h3>
                <p className="text-sm text-gray-600">Create and manage sessions</p>
              </div>
            </div>
          </Link>

          <div className="card opacity-50 cursor-not-allowed">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gray-400 rounded-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Manage Students</h3>
                <p className="text-sm text-gray-600">Coming soon</p>
              </div>
            </div>
          </div>

          <div className="card opacity-50 cursor-not-allowed">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gray-400 rounded-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Reports</h3>
                <p className="text-sm text-gray-600">Coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
