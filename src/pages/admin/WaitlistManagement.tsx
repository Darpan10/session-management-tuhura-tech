import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { waitlistAPI } from '../../services/waitlistAPI';
import { sessionAPI } from '../../services/sessionAPI';
import type { WaitlistEntryWithDetails } from '../../types/waitlist';
import type { Session } from '../../types/session';
import Sidebar from '../../components/Sidebar';

const WaitlistManagement: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [waitlist, setWaitlist] = useState<WaitlistEntryWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      loadData(parseInt(sessionId));
    }
  }, [sessionId]);

  const loadData = async (id: number) => {
    try {
      setIsLoading(true);
      const [sessionData, waitlistData] = await Promise.all([
        sessionAPI.getSession(id),
        waitlistAPI.getSessionWaitlist(id)
      ]);
      setSession(sessionData);
      setWaitlist(waitlistData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (waitlistId: number, newStatus: 'waitlist' | 'enrolled' | 'cancelled') => {
    try {
      await waitlistAPI.updateStatus(waitlistId, newStatus);
      if (sessionId) {
        await loadData(parseInt(sessionId));
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enrolled': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/admin/sessions')}
              className="mb-4 flex items-center"
              style={{ color: '#6AA469' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#4A8449'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#6AA469'}
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Sessions
            </button>
            
            {session && (
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Waitlist: {session.title}
                </h1>
                <p className="text-gray-600">
                  {session.dayOfWeek} {session.startTime} - {session.endTime} | {session.term}
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderBottomColor: '#6AA469' }}></div>
              <p className="mt-4 text-gray-600">Loading waitlist...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="text-white" style={{ backgroundColor: '#6AA469' }}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        School Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Parent Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Parent Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Needs Device
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {waitlist.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                          No students on waitlist yet
                        </td>
                      </tr>
                    ) : (
                      waitlist.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {entry.studentName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {entry.studentEmail}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {entry.schoolYear}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {entry.parentName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {entry.parentPhone}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {entry.needsDevice ? (
                              <span className="text-blue-600 font-semibold">Yes</span>
                            ) : (
                              <span className="text-gray-400">No</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(entry.status)}`}>
                              {entry.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <select
                              value={entry.status}
                              onChange={(e) => handleStatusUpdate(entry.id, e.target.value as any)}
                              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                              <option value="waitlist">Waitlist</option>
                              <option value="enrolled">Enrolled</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              {waitlist.length > 0 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <div>
                      <span className="font-semibold">Total:</span> {waitlist.length} students
                    </div>
                    <div className="space-x-4">
                      <span>
                        <span className="font-semibold">Waitlist:</span>{' '}
                        {waitlist.filter(e => e.status === 'waitlist').length}
                      </span>
                      <span>
                        <span className="font-semibold">Enrolled:</span>{' '}
                        {waitlist.filter(e => e.status === 'enrolled').length}
                      </span>
                      <span>
                        <span className="font-semibold">Need Device:</span>{' '}
                        {waitlist.filter(e => e.needsDevice).length}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaitlistManagement;
