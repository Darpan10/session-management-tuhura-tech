import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessionAPI } from '../../services/sessionAPI';
import type { Session } from '../../types/session';
import Sidebar from '../../components/Sidebar';
import Skeleton from '../../components/Skeleton';

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

interface TermDates {
  termId: number;
  termName: string;
  termStartDate: string;
  termEndDate: string;
  dates: Date[];
}

const Attendance: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<Session | null>(null);
  const [students, setStudents] = useState<WaitlistStudent[]>([]);
  const [sessionDatesByTerm, setSessionDatesByTerm] = useState<TermDates[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTermId, setSelectedTermId] = useState<number | null>(null);

  useEffect(() => {
    if (sessionId) {
      loadData(parseInt(sessionId));
    }
  }, [sessionId]);

  const getDayOfWeekNumber = (dayName: string): number => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.indexOf(dayName);
  };

  const generateSessionDates = (session: Session): TermDates[] => {
    const termDatesList: TermDates[] = [];
    const targetDay = getDayOfWeekNumber(session.dayOfWeek);

    // Generate dates for each term in the session
    session.terms.forEach(term => {
      const dates: Date[] = [];
      const termStart = new Date(term.startDate);
      const termEnd = new Date(term.endDate);
      
      let currentDate = new Date(termStart);
      
      // Move to the first occurrence of the target day within this term
      while (currentDate.getDay() !== targetDay && currentDate <= termEnd) {
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Collect all dates that match the day of week within this term
      while (currentDate <= termEnd) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 7); // Move to next week
      }

      if (dates.length > 0) {
        termDatesList.push({
          termId: term.id,
          termName: term.name,
          termStartDate: term.startDate,
          termEndDate: term.endDate,
          dates: dates
        });
      }
    });
    
    return termDatesList;
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
      
      // Generate session dates grouped by term
      const datesByTerm = generateSessionDates(sessionData);
      setSessionDatesByTerm(datesByTerm);
      
      // Set the first term as selected by default
      if (datesByTerm.length > 0) {
        setSelectedTermId(datesByTerm[0].termId);
      }
      
      // Initialize attendance from backend data
      const initialAttendance: AttendanceRecord = {};
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to start of day
      
      admittedData.forEach(student => {
        initialAttendance[student.id] = {};
        const admissionDate = new Date(student.created_at);
        admissionDate.setHours(0, 0, 0, 0); // Normalize to start of day
        
        // Iterate through all terms and their dates
        datesByTerm.forEach(termData => {
          termData.dates.forEach(date => {
            const dateStr = date.toISOString().split('T')[0];
            const sessionDate = new Date(date);
            sessionDate.setHours(0, 0, 0, 0); // Normalize to start of day
            
            // Find existing attendance record from database
            const existingRecord = attendanceData.find(
              (record: any) => record.waitlist_id === student.id && record.attendance_date === dateStr
            );
          
            if (existingRecord) {
              // Use database value
              initialAttendance[student.id][dateStr] = existingRecord.is_present;
            } else {
              // No record yet - default to false (can be edited later)
              initialAttendance[student.id][dateStr] = false;
            }
          });
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

  const isDateEditable = (dateStr: string, studentCreatedAt: string): boolean => {
    const sessionDate = new Date(dateStr);
    sessionDate.setHours(0, 0, 0, 0);
    
    const admissionDate = new Date(studentCreatedAt);
    admissionDate.setHours(0, 0, 0, 0);
    
    // Only editable if student was admitted by this date
    return sessionDate >= admissionDate;
  };

  const toggleAttendance = (studentId: number, date: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student || !isDateEditable(date, student.created_at)) {
      return; // Don't allow toggling dates before admission
    }
    
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
      
      // Collect ALL attendance records for ALL dates in a single batch
      const allAttendanceRecords: { 
        attendance_date: string; 
        waitlist_id: number; 
        is_present: boolean 
      }[] = [];
      
      // Iterate through all terms and their dates
      sessionDatesByTerm.forEach(termData => {
        termData.dates.forEach(date => {
          const dateStr = date.toISOString().split('T')[0];
          const sessionDate = new Date(date);
          sessionDate.setHours(0, 0, 0, 0);
          
          students.forEach(student => {
            const admissionDate = new Date(student.created_at);
            admissionDate.setHours(0, 0, 0, 0);
            
            // Only include if session date is on or after admission
            if (sessionDate >= admissionDate) {
              const isPresent = attendance[student.id]?.[dateStr] || false;
              allAttendanceRecords.push({
                attendance_date: dateStr,
                waitlist_id: student.id,
                is_present: isPresent
              });
            }
          });
        });
      });
      
      // Single API call with all attendance data
      await sessionAPI.bulkSaveAllAttendance(
        parseInt(sessionId),
        allAttendanceRecords
      );

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

  const formatTime = (time24: string): string => {
    // Parse the time (expected format: "HH:MM" or "HH:MM:SS")
    const [hours, minutes] = time24.split(':').map(Number);
    
    // Determine AM/PM
    const period = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    const hours12 = hours % 12 || 12; // Convert 0 to 12 for midnight
    
    // Format minutes with leading zero if needed
    const minutesStr = minutes.toString().padStart(2, '0');
    
    return `${hours12}:${minutesStr} ${period}`;
  };

  const getAttendanceStats = (studentId: number) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return { present: 0, total: 0, percentage: 0 };
    
    const studentAttendance = attendance[studentId] || {};
    const admissionDate = new Date(student.created_at);
    admissionDate.setHours(0, 0, 0, 0);
    
    // Count sessions on or after admission across all terms
    const applicableDates: Date[] = [];
    sessionDatesByTerm.forEach(termData => {
      termData.dates.forEach(date => {
        const sessionDate = new Date(date);
        sessionDate.setHours(0, 0, 0, 0);
        if (sessionDate >= admissionDate) {
          applicableDates.push(date);
        }
      });
    });
    
    const total = applicableDates.length;
    const present = applicableDates.filter(date => {
      const dateStr = date.toISOString().split('T')[0];
      return studentAttendance[dateStr] === true;
    }).length;
    
    return { present, total, percentage: total > 0 ? Math.round((present / total) * 100) : 0 };
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
              <Skeleton variant="attendance" />
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
                    {session.dayOfWeek}s | {formatTime(session.startTime)} - {formatTime(session.endTime)} | {session.termNames?.join(', ')}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    {sessionDatesByTerm.reduce((total, term) => total + term.dates.length, 0)} session{sessionDatesByTerm.reduce((total, term) => total + term.dates.length, 0) !== 1 ? 's' : ''} | {students.length} student{students.length !== 1 ? 's' : ''}
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

          {/* Term Tabs */}
          {sessionDatesByTerm.length > 0 && (
            <div className="mb-6 bg-white rounded-lg shadow-md p-2">
              <div className="flex gap-2 flex-wrap">
                {sessionDatesByTerm.map((termData) => (
                  <button
                    key={termData.termId}
                    onClick={() => setSelectedTermId(termData.termId)}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                      selectedTermId === termData.termId
                        ? 'bg-gradient-to-r from-[#6AA469] to-[#5B9359] text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className="text-left">
                      <div className="font-bold">{termData.termName}</div>
                      <div className="text-xs opacity-90">
                        {termData.dates.length} session{termData.dates.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
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
          ) : sessionDatesByTerm.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">No session dates found for the selected day of week.</p>
            </div>
          ) : (
            <>
              {(() => {
                const selectedTerm = sessionDatesByTerm.find(t => t.termId === selectedTermId);
                if (!selectedTerm) return null;

                return (
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {/* Term Header */}
                    <div className="bg-gradient-to-r from-[#6AA469] to-[#5B9359] px-6 py-4">
                      <h2 className="text-xl font-bold text-white">{selectedTerm.termName}</h2>
                      <p className="text-white text-sm opacity-90">
                        {new Date(selectedTerm.termStartDate).toLocaleDateString('en-NZ', { day: '2-digit', month: 'short', year: 'numeric' })} - {new Date(selectedTerm.termEndDate).toLocaleDateString('en-NZ', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10">
                            Student Name
                          </th>
                          {selectedTerm.dates.map((date, idx) => (
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
                          {selectedTerm.dates.map((date, idx) => {
                            const dateStr = date.toISOString().split('T')[0];
                            const isPresent = attendance[student.id]?.[dateStr] || false;
                            const editable = isDateEditable(dateStr, student.created_at);
                            
                            return (
                              <td key={idx} className="px-4 py-3 text-center">
                                {!editable ? (
                                  <div className="w-8 h-8 rounded-md flex items-center justify-center bg-gray-100 text-gray-400 text-xs mx-auto" title="Before admission">
                                    —
                                  </div>
                                ) : (
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
                                )}
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
                );
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance;
