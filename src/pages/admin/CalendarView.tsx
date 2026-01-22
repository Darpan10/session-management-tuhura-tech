import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionAPI } from '../../services/sessionAPI';
import type { Session } from '../../types/session';
import Sidebar from '../../components/Sidebar';
import Skeleton from '../../components/Skeleton';
import Calendar from '../../components/Calendar';
import type { DateSelectArg } from '@fullcalendar/core';
import { useAuth } from '../../context/AuthContext';

const CalendarView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const isAdmin = user?.roles?.includes('ADMIN') || false;

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const data = await sessionAPI.getSessions();
      setSessions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventClick = (session: Session) => {
    setSelectedSession(session);
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    // Only allow admins to create sessions
    if (!isAdmin) return;
    
    // Navigate to create session with pre-filled dates
    const startDate = selectInfo.startStr.split('T')[0];
    const endDate = selectInfo.endStr.split('T')[0];
    navigate(`/admin/sessions/create?startDate=${startDate}&endDate=${endDate}`);
  };

  const closeModal = () => {
    setSelectedSession(null);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-[#003554]">Session Calendar</h1>
                <p className="text-tuhura-gray mt-1">
                  {isAdmin 
                    ? 'View and manage sessions in calendar format' 
                    : 'View all sessions - Your assigned sessions are highlighted in blue'}
                </p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin/sessions/create')}
                  className="btn-primary flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Session
                </button>
              )}
            </div>
          </div>

          {/* Calendar */}
          {isLoading ? (
            <div className="flex justify-center items-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tuhura-green"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="font-medium">Error loading sessions</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : (
            <Calendar
              sessions={sessions.filter(s => !s.isDeleted)}
              onEventClick={handleEventClick}
              onDateSelect={isAdmin ? handleDateSelect : undefined}
              currentUserId={user?.id}
            />
          )}

          {/* Session Detail Modal */}
          {selectedSession && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-[#1E6193] to-[#6AA469] text-white p-6 rounded-t-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold">{selectedSession.title}</h2>
                      <div className="flex items-center mt-2 space-x-3">
                        <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                          {selectedSession.termNames?.join(', ')}
                        </span>
                        <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                          {selectedSession.dayOfWeek}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={closeModal}
                      className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-4">
                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Start Date</p>
                      <p className="font-medium text-gray-900">{new Date(selectedSession.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">End Date</p>
                      <p className="font-medium text-gray-900">{new Date(selectedSession.endDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Start Time</p>
                      <p className="font-medium text-gray-900">{selectedSession.startTime}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">End Time</p>
                      <p className="font-medium text-gray-900">{selectedSession.endTime}</p>
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Location</p>
                    <p className="font-medium text-gray-900 break-words">{selectedSession.location}, {selectedSession.city}</p>
                    {selectedSession.locationUrl && (
                      <a
                        href={selectedSession.locationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-tuhura-blue hover:underline text-sm"
                      >
                        View on map →
                      </a>
                    )}
                  </div>

                  {/* Capacity & Age */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Capacity</p>
                      <p className="font-medium text-gray-900">{selectedSession.capacity} participants</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Years Range</p>
                      <p className="font-medium text-gray-900">{selectedSession.minAge} - {selectedSession.maxAge} years</p>
                    </div>
                  </div>

                  {/* Staff */}
                  {selectedSession.staff && selectedSession.staff.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Assigned Staff</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedSession.staff.map((staff) => (
                          <span
                            key={staff.id}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-tuhura-green/10 text-tuhura-green"
                            title={staff.email}
                          >
                            {staff.userName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3">
                  <button
                    onClick={closeModal}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => navigate(`/admin/attendance/${selectedSession.id}`)}
                        className="px-4 py-2 bg-[#00A8E8] text-white rounded-lg hover:bg-[#0088C8] transition-colors font-medium"
                      >
                        Attendance
                      </button>
                      <button
                        onClick={() => navigate(`/admin/sessions/${selectedSession.id}/waitlist`)}
                        className="px-4 py-2 bg-[#6AA469] text-white rounded-lg hover:bg-[#5A9459] transition-colors font-medium"
                      >
                        Manage Students
                      </button>
                      <button
                        onClick={() => navigate(`/admin/sessions/${selectedSession.id}/edit`)}
                        className="btn-primary"
                      >
                        Edit Session
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CalendarView;
