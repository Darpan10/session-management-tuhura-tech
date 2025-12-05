import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext';
import { sessionAPI } from '../../services/sessionAPI';
import type { Session } from '../../types/session';

const SessionManagement: React.FC = () => {
  const navigate = useNavigate();
  // const { logout } = useAuth();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const data = await sessionAPI.getSessions();
      setSessions(data);
      setError('');
    } catch (err) {
      setError('Failed to load sessions');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this session?')) {
      return;
    }

    try {
      setDeleteId(id);
      await sessionAPI.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError('Failed to delete session');
    } finally {
      setDeleteId(null);
    }
  };

  // const handleLogout = () => {
  //   logout();
  //   navigate('/login');
  // };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-NZ', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

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
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-tuhura-blue hover:text-tuhura-darkBlue">
                Dashboard
              </Link>
              {/* <button onClick={handleLogout} className="btn-secondary">
                Logout
              </button> */}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Sessions</h2>
            <p className="mt-2 text-gray-600">Manage and create sessions for students</p>
          </div>
          <Link to="/admin/sessions/create" className="btn-primary">
            <svg className="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Session
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Sessions List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tuhura-blue"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="card text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No sessions yet</h3>
            <p className="mt-1 text-gray-500">Get started by creating a new session.</p>
            <div className="mt-6">
              <Link to="/admin/sessions/create" className="btn-primary">
                Create New Session
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {sessions.map((session) => (
              <div key={session.id} className="card hover:shadow-xl transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-xl font-bold text-gray-900">
                        {session.term} {session.year}
                      </h3>
                      {session.rrule && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Recurring
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Date & Time</p>
                        <p className="font-medium text-gray-900">{formatDateTime(session.startDateTime)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium text-gray-900">{session.location}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Capacity</p>
                        <p className="font-medium text-gray-900">{session.capacity} students</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Age Range</p>
                        <p className="font-medium text-gray-900">
                          {session.minAge} - {session.maxAge} years
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-2">Assigned Staff</p>
                      <div className="flex flex-wrap gap-2">
                        {session.assignedStaff.map((staff) => (
                          <span
                            key={staff.id}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-tuhura-lightBlue text-tuhura-darkBlue"
                          >
                            {staff.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="ml-4 flex flex-col space-y-2">
                    <button
                      onClick={() => navigate(`/admin/sessions/${session.id}`)}
                      className="text-tuhura-blue hover:text-tuhura-darkBlue text-sm font-medium"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleDelete(session.id)}
                      disabled={deleteId === session.id}
                      className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                    >
                      {deleteId === session.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SessionManagement;
