import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Eye, Search, Users, Calendar } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import Skeleton from '../../components/Skeleton';
import axios from 'axios';
import { sessionAPI } from '../../services/sessionAPI';
import type { Session } from '../../types/session';

interface Student {
  id: number;
  email: string;
  first_name: string;
  family_name: string;
  school_year: string;
  school_year_other?: string;
  experience: string[];
  needs_device: boolean;
  medical_info?: string;
  parent_name: string;
  parent_phone: string;
  created_at: string;
}

const StudentSignups = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [signupCounts, setSignupCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (searchTerm && students.length > 0) {
      const filtered = students.filter(student => 
        student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.family_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.parent_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [searchTerm, students]);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const sessionsData = await sessionAPI.getSessions();
      setSessions(sessionsData);
      
      // Load signups count for each session
      const token = localStorage.getItem('access_token');
      const counts: Record<number, number> = {};
      
      await Promise.all(
        sessionsData.map(async (session: Session) => {
          try {
            const response = await axios.get(`http://127.0.0.1:8000/api/waitlist/session/${session.id}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            counts[session.id] = response.data.length;
          } catch (error) {
            console.error(`Failed to load signups for session ${session.id}:`, error);
            counts[session.id] = 0;
          }
        })
      );
      
      setSignupCounts(counts);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoading(false);
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
      setFilteredStudents(response.data);
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session);
    loadStudents();
  };

  const handleBackToSessions = () => {
    setSelectedSession(null);
    setStudents([]);
    setFilteredStudents([]);
    setSearchTerm('');
  };

  const handleEdit = (studentId: number) => {
    navigate(`/admin/students/${studentId}/edit`);
  };

  const handleView = (studentId: number) => {
    navigate(`/admin/students/${studentId}`);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              {selectedSession ? (
                <button
                  onClick={handleBackToSessions}
                  className="mb-4 flex items-center gap-2 px-4 py-2 rounded-md transition-colors"
                  style={{ color: '#00A8E8' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to Sessions
                </button>
              ) : (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="mb-4 flex items-center gap-2 px-4 py-2 rounded-md transition-colors"
                  style={{ color: '#00A8E8' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to Dashboard
                </button>
              )}
              
              <h1 className="text-3xl font-bold text-gray-900">
                {selectedSession ? selectedSession.title : 'Student Signups by Session'}
              </h1>
              <p className="text-gray-600 mt-2">
                {selectedSession 
                  ? `View all student signups for this session` 
                  : 'Select a session to view student signups'}
              </p>
            </div>

            {/* Sessions List */}
            {!selectedSession && (
              <div className="bg-white rounded-lg shadow-md">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#00A8E8' }}></div>
                    <p className="mt-4 text-gray-600">Loading sessions...</p>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-xl text-gray-600 mb-2">No sessions found</p>
                    <p className="text-gray-500">Create a session to start managing student signups</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="text-white" style={{ backgroundColor: '#6AA469' }}>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Session Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Term
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Day
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Location
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Signups
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sessions.map((session) => (
                          <tr key={session.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{session.title}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{session.termNames?.join(', ')}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{session.dayOfWeek}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{session.city}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium" style={{ color: '#00A8E8' }}>
                                {signupCounts[session.id] || 0} / {session.capacity}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => handleSessionClick(session)}
                                className="px-4 py-2 text-white rounded-md transition-colors flex items-center gap-2"
                                style={{ backgroundColor: '#00A8E8' }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#0077B6';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#00A8E8';
                                }}
                              >
                                <Users className="w-4 h-4" />
                                View Signups
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Students List for Selected Session */}
            {selectedSession && (
              <div className="space-y-6">
                {/* Session Info Card */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Term</p>
                      <p className="text-base font-medium text-gray-900">{selectedSession.termNames?.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Day & Time</p>
                      <p className="text-base font-medium text-gray-900">
                        {selectedSession.dayOfWeek}, {selectedSession.startTime?.substring(0, 5) || 'N/A'} - {selectedSession.endTime?.substring(0, 5) || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="text-base font-medium text-gray-900">{selectedSession.location}, {selectedSession.city}</p>
                    </div>
                  </div>
                </div>

                {/* Search and Stats */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex-1 max-w-md">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          placeholder="Search students..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00A8E8] focus:ring-opacity-50"
                        />
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-2 px-4 py-2 rounded-md" style={{ backgroundColor: '#f3f4f6' }}>
                      <Users className="w-5 h-5" style={{ color: '#00A8E8' }} />
                      <span className="text-sm font-medium text-gray-700">
                        {filteredStudents.length} Student{filteredStudents.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {isLoadingStudents ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#00A8E8' }}></div>
                      <p className="mt-4 text-gray-600">Loading students...</p>
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-xl text-gray-600 mb-2">
                        {searchTerm ? 'No students found' : 'No student signups yet'}
                      </p>
                      <p className="text-gray-500">
                        {searchTerm ? 'Try adjusting your search' : 'Student signups will appear here'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="text-white" style={{ backgroundColor: '#6AA469' }}>
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Student Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              School Year
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Parent Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Parent Phone
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Submitted
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredStudents.map((student) => (
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
                                <div className="text-sm text-gray-900">{student.parent_name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{student.parent_phone}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {new Date(student.created_at).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleView(student.id)}
                                    className="p-2 rounded-md transition-all hover:bg-blue-50"
                                    style={{ color: '#00A8E8' }}
                                    title="View Details"
                                  >
                                    <Eye className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() => handleEdit(student.id)}
                                    className="p-2 rounded-md transition-all hover:bg-blue-50"
                                    style={{ color: '#00A8E8' }}
                                    title="Edit"
                                  >
                                    <Edit className="w-5 h-5" />
                                  </button>
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
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentSignups;
