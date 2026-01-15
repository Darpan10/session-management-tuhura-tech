import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessionAPI } from '../../services/sessionAPI';
import type { Session } from '../../types/session';
import Sidebar from '../../components/Sidebar';

interface WaitlistStudent {
  id: number;
  student_name: string;
  student_email: string;
  parent_name: string;
  parent_phone: string;
  school_year: string;
  needs_device: boolean;
  status: 'waitlist' | 'admitted' | 'withdrawn';
  created_at: string;
}

interface AttendanceRecord {
  [studentId: number]: {
    [date: string]: boolean;
  };
}

const Attendance: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<Session | null>(null);
  const [students, setStudents] = useState<WaitlistStudent[]>([]);
  const [sessionDates, setSessionDates] = useState<Date[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (sessionId) {
      loadData(parseInt(sessionId));
    }
  }, [sessionId]);

  const getDayOfWeekNumber = (dayName: string): number => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.indexOf(dayName);
  };

  const generateSessionDates = (session: Session): Date[] => {
    const dates: Date[] = [];
    const startDate = new Date(session.startDate);
    const endDate = new Date(session.endDate);
    const targetDay = getDayOfWeekNumber(session.dayOfWeek);

    let currentDate = new Date(startDate);
    
    // Move to the first occurrence of the target day
    while (currentDate.getDay() !== targetDay && currentDate <= endDate) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Collect all dates that match the day of week
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 7); // Move to next week
    }

    return dates;
  };

  const loadData = async (id: number) => {
    try {
      setIsLoading(true);
      const [sessionData, admittedData, attendanceData] = await Promise.all([
        sessionAPI.getSession(id),
        sessionAPI.getWaitlistByStatus(id, 'admitted').catch(() => []),
        sessionAPI.getSessionAttendance(id).catch(() => [])
      ]);
      
      setSession(sessionData);
      setStudents(admittedData.sort((a, b) => a.student_name.localeCompare(b.student_name)));
      
      // Generate session dates
      const dates = generateSessionDates(sessionData);
      setSessionDates(dates);
      
      // Initialize attendance from backend data
      const initialAttendance: AttendanceRecord = {};
      admittedData.forEach(student => {
        initialAttendance[student.id] = {};
        dates.forEach(date => {
          const dateStr = date.toISOString().split('T')[0];
          // Check if we have existing attendance data
          const existingRecord = attendanceData.find(
            (record: any) => record.waitlist_id === student.id && record.attendance_date === dateStr
          );
          initialAttendance[student.id][dateStr] = existingRecord ? existingRecord.is_present : false;
        });
      });
      setAttendance(initialAttendance);
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Load data error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAttendance = (studentId: number, date: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [date]: !prev[studentId][date]
      }
    }));
  };

  const saveAttendance = async () => {
    if (!sessionId) return;

    try {
      setIsSaving(true);
      setSaveMessage(null);
      
      // Convert attendance state to array of records
      const records: any[] = [];
      Object.entries(attendance).forEach(([studentIdStr, dates]) => {
        const studentId = parseInt(studentIdStr);
        Object.entries(dates).forEach(([date, isPresent]) => {
          records.push({
            waitlist_id: studentId,
            attendance_date: date,
            is_present: isPresent
          });
        });
      });

      await sessionAPI.bulkUpdateAttendance(parseInt(sessionId), records);
      setSaveMessage('Attendance saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save attendance');
      console.error('Save attendance error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-NZ', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getAttendanceStats = (studentId: number) => {
    const studentAttendance = attendance[studentId] || {};
    const total = sessionDates.length;
    const present = Object.values(studentAttendance).filter(val => val === true).length;
    return { present, total, percentage: total > 0 ? Math.round((present / total) * 100) : 0 };
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6AA469] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading attendance...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/admin/attendance')}
              className="mb-4 flex items-center"
              style={{ color: '#6AA469' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#4A8449'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#6AA469'}
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Session List
            </button>
            
            {session && (
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Attendance: {session.title}
                  </h1>
                  <p className="text-gray-600">
                    {session.dayOfWeek}s | {session.startTime} - {session.endTime} | {session.term}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    {sessionDates.length} session{sessionDates.length !== 1 ? 's' : ''} | {students.length} student{students.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={saveAttendance}
                  disabled={isSaving}
                  className="px-6 py-3 bg-[#6AA469] text-white rounded-lg hover:bg-[#5A9459] transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      Save Attendance
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {saveMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
              {saveMessage}
            </div>
          )}

          {/* Search Bar */}
          {students.length > 0 && (
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
                  placeholder="Search students by name or school year..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6AA469] focus:border-transparent"
                />
              </div>
            </div>
          )}

          {students.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">No admitted students for this session.</p>
            </div>
          ) : students.filter(s =>
            s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.school_year.toLowerCase().includes(searchTerm.toLowerCase())
          ).length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">No students found matching your search.</p>
            </div>
          ) : sessionDates.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">No session dates found for the selected day of week.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10">
                        Student Name
                      </th>
                      {sessionDates.map((date, idx) => (
                        <th key={idx} className="px-4 py-3 text-center text-xs font-semibold text-gray-700 min-w-[100px]">
                          <div>{formatDate(date)}</div>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 sticky right-0 bg-gray-50 z-10 min-w-[120px]">
                        Attendance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {students.filter(s =>
                      s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      s.school_year.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map((student) => {
                      const stats = getAttendanceStats(student.id);
                      return (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                            <div>
                              <div>{student.student_name}</div>
                              <div className="text-xs text-gray-500">{student.school_year}</div>
                            </div>
                          </td>
                          {sessionDates.map((date, idx) => {
                            const dateStr = date.toISOString().split('T')[0];
                            const isPresent = attendance[student.id]?.[dateStr] || false;
                            return (
                              <td key={idx} className="px-4 py-3 text-center">
                                <button
                                  onClick={() => toggleAttendance(student.id, dateStr)}
                                  className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                                    isPresent
                                      ? 'bg-green-500 text-white hover:bg-green-600'
                                      : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                                  }`}
                                  title={isPresent ? 'Present' : 'Absent'}
                                >
                                  {isPresent && (
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </button>
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-center sticky right-0 bg-white z-10">
                            <div className="text-sm font-medium text-gray-900">
                              {stats.present}/{stats.total}
                            </div>
                            <div className={`text-xs ${
                              stats.percentage >= 80 ? 'text-green-600' :
                              stats.percentage >= 60 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {stats.percentage}%
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance;
