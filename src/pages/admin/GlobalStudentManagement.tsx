import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sessionAPI } from '../../services/sessionAPI';
import Sidebar from '../../components/Sidebar';

interface SessionWithCount {
  id: number;
  title: string;
  term: string;
  dayOfWeek: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  studentCount: number;
}

const GlobalStudentManagement: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract status from path
  const getStatusFromPath = (): 'waitlist' | 'admitted' | 'withdrawn' => {
    if (location.pathname.includes('/waitlist')) return 'waitlist';
    if (location.pathname.includes('/admitted')) return 'admitted';
    if (location.pathname.includes('/withdrawn')) return 'withdrawn';
    return 'waitlist';
  };
  
  const status = getStatusFromPath();
  const [sessions, setSessions] = useState<SessionWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [status]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load all sessions
      const allSessions = await sessionAPI.getSessions();
      
      // Get student count for each session
      const sessionsWithCounts: SessionWithCount[] = [];
      
      for (const session of allSessions) {
        try {
          const students = await sessionAPI.getWaitlistByStatus(session.id, status);
          if (students.length > 0) {
            sessionsWithCounts.push({
              id: session.id,
              title: session.title,
              term: session.term,
              dayOfWeek: session.dayOfWeek,
              startDate: session.startDate,
              endDate: session.endDate,
              startTime: session.startTime,
              endTime: session.endTime,
              location: session.location,
              studentCount: students.length,
            });
          }
        } catch (err) {
          // Session has no students with this status
          console.log(`No students for session ${session.id}:`, err);
        }
      }

      // Sort by student count (descending)
      sessionsWithCounts.sort((a, b) => b.studentCount - a.studentCount);
      
      setSessions(sessionsWithCounts);
      setError(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'waitlist':
        return {
          title: 'Wait List',
          color: 'bg-yellow-500',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
      case 'admitted':
        return {
          title: 'Admitted Students',
          color: 'bg-green-600',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
      case 'withdrawn':
        return {
          title: 'Withdrawn Students',
          color: 'bg-red-600',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
      default:
        return {
          title: 'Students',
          color: 'bg-gray-500',
          icon: null,
        };
    }
  };

  const config = getStatusConfig();
  const totalStudents = sessions.reduce((sum, session) => sum + session.studentCount, 0);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {config.title}
            </h1>
            <p className="text-gray-600">
              View sessions and manage students by status
            </p>
          </div>

          {/* Quick Nav */}
          <div className="mb-6 flex gap-3">
            <button
              onClick={() => navigate('/admin/students/waitlist')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                status === 'waitlist'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Wait List
            </button>
            <button
              onClick={() => navigate('/admin/students/admitted')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                status === 'admitted'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Admitted Students
            </button>
            <button
              onClick={() => navigate('/admin/students/withdrawn')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                status === 'withdrawn'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Withdrawn Students
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search sessions by title, term, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6AA469] focus:border-transparent"
              />
            </div>
          </div>

          {/* Stats Card */}
          <div className="mb-6 bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total {config.title}</p>
                <p className="text-3xl font-bold text-gray-900">{totalStudents}</p>
              </div>
              <div className={`${config.color} text-white p-4 rounded-full`}>
                {config.icon}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderBottomColor: '#6AA469' }}></div>
              <p className="mt-4 text-gray-600">Loading sessions...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className={`px-6 py-4 ${config.color} text-white`}>
                <h2 className="text-lg font-semibold">
                  Sessions ({sessions.filter(s => 
                    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    s.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    s.location.toLowerCase().includes(searchTerm.toLowerCase())
                  ).length})
                </h2>
              </div>

              <div className="overflow-x-auto">
                {sessions.filter(s => 
                  s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  s.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  s.location.toLowerCase().includes(searchTerm.toLowerCase())
                ).length === 0 ? (
                  <div className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? 'No sessions found matching your search' : 'No sessions have students in this status'}
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Session Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Term
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Schedule
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Number of Students
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sessions.filter(s => 
                        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.location.toLowerCase().includes(searchTerm.toLowerCase())
                      ).map((session) => (
                        <tr key={session.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {session.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {session.term}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div>{session.dayOfWeek}</div>
                            <div className="text-xs text-gray-500">{session.startTime} - {session.endTime}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {session.location}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-3 py-1 rounded-full font-semibold ${config.color} text-white`}>
                              {session.studentCount}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => navigate(`/admin/sessions/${session.id}/waitlist?status=${status}`)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                              View Students
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalStudentManagement;
