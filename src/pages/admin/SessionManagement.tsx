import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sessionAPI } from '../../services/sessionAPI';
import type { Session } from '../../types/session';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';

const SessionManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const isAdmin = user?.roles?.includes('ADMIN') || false;

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const openLocationMap = (location: string, locationUrl?: string) => {
    if (locationUrl) {
      window.open(locationUrl, '_blank');
    } else {
      const searchQuery = encodeURIComponent(location);
      window.open(`https://www.google.com/maps/search/?api=1&query=${searchQuery}`, '_blank');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <img src="/logo.svg" alt="Tuhura Tech" className="h-10 w-10" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Session Management</h1>
                  <p className="text-sm text-gray-600 mt-1">Manage all your sessions</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Sessions</h2>
            <p className="mt-2 text-gray-600">{isAdmin ? 'Manage and create sessions' : 'View all sessions'}</p>
          </div>
          {isAdmin && (
            <Link
              to="/admin/sessions/create"
              className="btn-primary inline-flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Session
            </Link>
          )}
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-lg shadow text-center py-12 px-6">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No sessions yet</h3>
            <p className="mt-1 text-gray-500">Get started by creating a new session.</p>
            <div className="mt-6">
              <Link
                to="/admin/sessions/create"
                className="btn-primary inline-flex items-center"
              >
                Create New Session
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="card hover:shadow-xl transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{session.title}</h3>
                    
                    <div className="flex gap-4 mb-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#6AA469] text-white">
                        {session.term}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#00A8E8] text-white">
                        {session.dayOfWeek}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-tuhura-gray">Start Date</p>
                        <p className="font-medium text-gray-900">{formatDate(session.startDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-tuhura-gray">End Date</p>
                        <p className="font-medium text-gray-900">{formatDate(session.endDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-tuhura-gray">Time</p>
                        <p className="font-medium text-gray-900">
                          {formatTime(session.startTime)} - {formatTime(session.endTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-tuhura-gray">Location</p>
                        <p className="font-medium text-gray-900">{session.location}</p>
                      </div>
                      <div>
                        <p className="text-sm text-tuhura-gray">City</p>
                        <button
                          onClick={() => openLocationMap(session.location, session.locationUrl)}
                          className="font-medium text-tuhura-blue hover:text-tuhura-darkBlue flex items-center gap-1"
                        >
                          {session.city}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                      </div>
                      <div>
                        <p className="text-sm text-tuhura-gray">Capacity</p>
                        <p className="font-medium text-gray-900">{session.capacity} participants</p>
                      </div>
                      <div>
                        <p className="text-sm text-tuhura-gray">Age Range</p>
                        <p className="font-medium text-gray-900">
                          {session.minAge} - {session.maxAge} years
                        </p>
                      </div>
                      {session.staff && session.staff.length > 0 && (
                        <div>
                          <p className="text-sm text-tuhura-gray mb-1">Assigned Staff</p>
                          <div className="flex flex-wrap gap-1">
                            {session.staff.map((staff) => (
                              <span
                                key={staff.id}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-tuhura-green/10 text-tuhura-green"
                                title={staff.email}
                              >
                                {staff.userName}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => navigate(`/admin/sessions/${session.id}/waitlist`)}
                        className="p-2 rounded-md transition-all hover:bg-blue-50"
                        style={{ color: '#6AA469' }}
                        title="View waitlist"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                      </button>
                      <button
                        onClick={() => navigate(`/admin/sessions/${session.id}/edit`)}
                        className="p-2 text-[#6AA469] hover:bg-[#6AA469]/10 rounded-md transition-all"
                        title="Edit session"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(session.id)}
                        disabled={deleteId === session.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50 transition-colors"
                        title="Delete session"
                      >
                        {deleteId === session.id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      )}
                    </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      </div>
    </div>
  );
};

export default SessionManagement;
