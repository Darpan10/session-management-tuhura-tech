import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { sessionAPI } from '../services/sessionAPI';
import type { Session } from '../types/session';
import axios from 'axios';
import { Users } from 'lucide-react';

interface Student {
  id: number;
  email: string;
  first_name: string;
  family_name: string;
  school_year: string;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const isAdmin = user?.roles?.includes('ADMIN') || false;
  const [totalSessions, setTotalSessions] = useState<number>(0);
  const [assignedSessions, setAssignedSessions] = useState<number>(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);

  useEffect(() => {
    loadStats();
    if (isAdmin) {
      loadStudents();
    }
  }, [user, isAdmin]);

  const loadStats = async () => {
    try {
      setIsLoadingStats(true);
      const sessions: Session[] = await sessionAPI.getSessions();
      setTotalSessions(sessions.length);
      
      if (!isAdmin && user?.id) {
        const assigned = sessions.filter(session => 
          session.staff?.some(staff => staff.id === user.id)
        );
        setAssignedSessions(assigned.length);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadStudents = async () => {
    try {
      setIsLoadingStudents(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://127.0.0.1:8000/api/waitlist/students', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setStudents(response.data);
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1">
        {/* Header with Account Dropdown */}
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="card mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome back, {user?.email}!
          </h2>
          <p className="text-gray-600">
            You're successfully logged in to the Session Management System.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card bg-gradient-to-br from-[#6AA469] to-[#5B9359] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90">
                    {isAdmin ? 'Total Sessions' : 'Assigned Sessions'}
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {isLoadingStats ? (
                      <span className="animate-pulse">--</span>
                    ) : (
                      isAdmin ? totalSessions : assignedSessions
                    )}
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {!isAdmin && (
              <div className="card bg-gradient-to-br from-[#1E6193] to-[#003554] text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-90">Total Sessions</p>
                    <p className="text-3xl font-bold mt-2">
                      {isLoadingStats ? (
                        <span className="animate-pulse">--</span>
                      ) : (
                        totalSessions
                      )}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {isAdmin && (
              <div className="card bg-gradient-to-br from-[#00A8E8] to-[#0080B8] text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-90">Student Signups</p>
                    <p className="text-3xl font-bold mt-2">
                      {isLoadingStudents ? (
                        <span className="animate-pulse">--</span>
                      ) : (
                        students.length
                      )}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Student Signups Section (Admin Only) */}
        {isAdmin && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Recent Student Signups</h3>
              <Link
                to="/admin/students"
                className="text-sm font-medium hover:underline"
                style={{ color: '#00A8E8' }}
              >
                View All →
              </Link>
            </div>
            <div className="card">
              {isLoadingStudents ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#00A8E8' }}></div>
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No student signups yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          School Year
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {students.slice(0, 5).map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {student.first_name} {student.family_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{student.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{student.school_year}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {new Date(student.created_at).toLocaleDateString()}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/admin/sessions"
              className="card hover:shadow-xl transition-shadow cursor-pointer group"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[#6AA469] rounded-lg flex items-center justify-center group-hover:shadow-md transition-shadow">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">View Sessions</h4>
                  <p className="text-sm text-tuhura-gray">{isAdmin ? 'View and edit sessions' : 'View all sessions'}</p>
                </div>
              </div>
            </Link>

            {isAdmin && (
              <Link
                to="/admin/sessions/create"
                className="card hover:shadow-xl transition-shadow cursor-pointer group"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-[#6AA469] rounded-lg flex items-center justify-center group-hover:shadow-md transition-shadow">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">Create Session</h4>
                    <p className="text-sm text-tuhura-gray">Add a new session</p>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
