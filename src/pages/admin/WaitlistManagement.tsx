import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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

interface StudentDetails extends WaitlistStudent {
  student_id: number;
  first_name: string;
  family_name: string;
  school_year_other?: string;
  experience: string[];
  medical_info?: string;
  consent_share_details: boolean;
  consent_photos: boolean;
  heard_from: string;
  heard_from_other?: string;
  newsletter_subscribe: boolean;
}

const WaitlistManagement: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusStatus = searchParams.get('status') as 'waitlist' | 'admitted' | 'withdrawn' | null;
  
  const waitlistRef = useRef<HTMLDivElement>(null);
  const admittedRef = useRef<HTMLDivElement>(null);
  const withdrawnRef = useRef<HTMLDivElement>(null);
  
  const [session, setSession] = useState<Session | null>(null);
  const [waitlistStudents, setWaitlistStudents] = useState<WaitlistStudent[]>([]);
  const [admittedStudents, setAdmittedStudents] = useState<WaitlistStudent[]>([]);
  const [withdrawnStudents, setWithdrawnStudents] = useState<WaitlistStudent[]>([]);
  const [admittedCount, setAdmittedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWaitlist, setSelectedWaitlist] = useState<Set<number>>(new Set());
  const [selectedAdmitted, setSelectedAdmitted] = useState<Set<number>>(new Set());
  const [selectedWithdrawn, setSelectedWithdrawn] = useState<Set<number>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<StudentDetails | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<StudentDetails>>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (sessionId) {
      loadData(parseInt(sessionId));
    }
  }, [sessionId]);

  useEffect(() => {
    // Scroll to the focused section after data loads
    if (!isLoading && focusStatus) {
      setTimeout(() => {
        if (focusStatus === 'waitlist' && waitlistRef.current) {
          waitlistRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (focusStatus === 'admitted' && admittedRef.current) {
          admittedRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (focusStatus === 'withdrawn' && withdrawnRef.current) {
          withdrawnRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }
  }, [isLoading, focusStatus]);

  const loadData = async (id: number) => {
    try {
      setIsLoading(true);
      const [sessionData, waitlistData, admittedData, withdrawnData] = await Promise.all([
        sessionAPI.getSession(id),
        sessionAPI.getWaitlistByStatus(id, 'waitlist').catch(() => []),
        sessionAPI.getWaitlistByStatus(id, 'admitted').catch(() => []),
        sessionAPI.getWaitlistByStatus(id, 'withdrawn').catch(() => [])
      ]);
      
      setSession(sessionData);
    // Sort by created_at ascending (first come first serve)
    setWaitlistStudents(waitlistData.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
    setAdmittedStudents(admittedData.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
    setWithdrawnStudents(withdrawnData.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
      // Get admitted count separately with error handling
      try {
        const count = await sessionAPI.getAdmittedCount(id);
        setAdmittedCount(count);
      } catch (err) {
        console.error('Failed to get admitted count:', err);
        // Fall back to counting admitted students from the list
        setAdmittedCount(admittedData.length);
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Load data error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkStatusUpdate = async (ids: number[], newStatus: 'waitlist' | 'admitted' | 'withdrawn') => {
    if (ids.length === 0) return;

    // Check capacity when admitting students
    if (newStatus === 'admitted' && session) {
      const newAdmittedCount = admittedCount + ids.length;
      if (newAdmittedCount > session.capacity) {
        const available = session.capacity - admittedCount;
        setErrorMessage(
          `Cannot admit ${ids.length} student${ids.length > 1 ? 's' : ''}. Only ${available} spot${available !== 1 ? 's' : ''} available.\n\n` +
          `Current capacity: ${admittedCount}/${session.capacity}\n\n` +
          `Please select only ${available} student${available !== 1 ? 's' : ''}.`
        );
        return;
      }
    }

    // Show confirmation dialog
    const statusLabels = {
      waitlist: 'Wait List',
      admitted: 'Admitted Students',
      withdrawn: 'Withdrawn'
    };
    
    setConfirmDialog({
      show: true,
      message: `Are you sure you want to move ${ids.length} student${ids.length > 1 ? 's' : ''} to ${statusLabels[newStatus]}?`,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await sessionAPI.bulkUpdateStatus(ids, newStatus);
          // Clear selections
          setSelectedWaitlist(new Set());
          setSelectedAdmitted(new Set());
          setSelectedWithdrawn(new Set());
          // Reload data
          if (sessionId) {
            await loadData(parseInt(sessionId));
          }
        } catch (err) {
          console.error('Bulk update error:', err);
          const errorMsg = err instanceof Error ? err.message : 'Failed to update status';
          setErrorMessage(`Error: ${errorMsg}\n\nPlease try again or contact support.`);
        }
      }
    });
  };

  const handleViewStudentDetails = async (waitlistId: number) => {
    try {
      const response = await sessionAPI.getWaitlistEntry(waitlistId);
      setSelectedStudentDetails(response);
      setIsEditMode(false);
      setEditFormData({});
    } catch (err) {
      console.error('Failed to load student details:', err);
      setErrorMessage('Failed to load student details. Please try again.');
    }
  };

  const handleEditClick = () => {
    if (selectedStudentDetails) {
      setEditFormData({
        first_name: selectedStudentDetails.first_name,
        family_name: selectedStudentDetails.family_name,
        student_email: selectedStudentDetails.student_email,
        school_year: selectedStudentDetails.school_year,
        school_year_other: selectedStudentDetails.school_year_other,
        experience: selectedStudentDetails.experience,
        needs_device: selectedStudentDetails.needs_device,
        medical_info: selectedStudentDetails.medical_info,
        parent_name: selectedStudentDetails.parent_name,
        parent_phone: selectedStudentDetails.parent_phone,
      });
      setIsEditMode(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditFormData({});
  };

  const handleSaveEdit = async () => {
    if (!selectedStudentDetails) return;

    try {
      await sessionAPI.updateStudent(selectedStudentDetails.student_id, {
        email: editFormData.student_email,
        first_name: editFormData.first_name,
        family_name: editFormData.family_name,
        school_year: editFormData.school_year,
        school_year_other: editFormData.school_year_other,
        experience: editFormData.experience || [],
        needs_device: editFormData.needs_device,
        medical_info: editFormData.medical_info,
        parent_name: editFormData.parent_name,
        parent_phone: editFormData.parent_phone,
      });

      // Refresh student details
      await handleViewStudentDetails(selectedStudentDetails.id);
      setIsEditMode(false);
      setEditFormData({});

      // Reload the lists to reflect changes
      if (sessionId) {
        await loadData(parseInt(sessionId));
      }
    } catch (err) {
      console.error('Failed to update student:', err);
      setErrorMessage('Failed to update student information. Please try again.');
    }
  };

  const handleFormChange = (field: string, value: any) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleExperienceChange = (experience: string, checked: boolean) => {
    setEditFormData(prev => {
      const current = prev.experience || [];
      if (checked) {
        return { ...prev, experience: [...current, experience] };
      } else {
        return { ...prev, experience: current.filter(e => e !== experience) };
      }
    });
  };

  const handleToggleSelection = (
    id: number,
    currentSet: Set<number>,
    setSetter: React.Dispatch<React.SetStateAction<Set<number>>>,
    listType?: 'waitlist'
  ) => {
    const newSet = new Set(currentSet);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSetter(newSet);
  };

  const handleSelectAll = (
    students: WaitlistStudent[],
    currentSet: Set<number>,
    setSetter: React.Dispatch<React.SetStateAction<Set<number>>>,
    listType?: 'waitlist'
  ) => {
    if (currentSet.size === students.length) {
      setSetter(new Set());
    } else {
      setSetter(new Set(students.map(s => s.id)));
    }
  };

  const renderStudentList = (
    title: string,
    students: WaitlistStudent[],
    selectedSet: Set<number>,
    setSetter: React.Dispatch<React.SetStateAction<Set<number>>>,
    colorClass: string,
    actions: { label: string; onClick: () => void; color: string }[],
    ref: React.RefObject<HTMLDivElement>,
    isHighlighted: boolean,
    listType?: 'waitlist'
  ) => (
    <div ref={ref} className={`bg-white rounded-lg shadow-md overflow-hidden ${isHighlighted ? 'ring-4 ring-blue-500' : ''}`}>
      <div className={`px-6 py-4 ${colorClass} text-white`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title} ({students.length})</h2>
          {students.length > 0 && (
            <button
              onClick={() => handleSelectAll(students, selectedSet, setSetter, listType)}
              className="text-sm underline hover:no-underline"
            >
              {selectedSet.size === students.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        {students.filter(s =>
          s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.student_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.parent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.school_year.toLowerCase().includes(searchTerm.toLowerCase())
        ).length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            {searchTerm ? 'No students found matching your search' : 'No students in this list'}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedSet.size === students.filter(s =>
                      s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      s.student_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      s.parent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      s.school_year.toLowerCase().includes(searchTerm.toLowerCase())
                    ).length && students.filter(s =>
                      s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      s.student_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      s.parent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      s.school_year.toLowerCase().includes(searchTerm.toLowerCase())
                    ).length > 0}
                    onChange={() => handleSelectAll(students.filter(s =>
                      s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      s.student_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      s.parent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      s.school_year.toLowerCase().includes(searchTerm.toLowerCase())
                    ), selectedSet, setSetter, listType)}
                    className="rounded border-gray-300"
                  />
                </th>
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
                  Parent Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parent Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Needs Device
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.filter(s =>
                s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.student_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.parent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.school_year.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedSet.has(student.id)}
                      onChange={() => handleToggleSelection(student.id, selectedSet, setSetter, listType)}
                      className="rounded border-gray-300 text-tuhura-blue focus:ring-tuhura-blue"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {student.student_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {student.student_email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {student.school_year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {student.parent_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {student.parent_phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {student.needs_device ? (
                      <span className="text-blue-600 font-semibold">Yes</span>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleViewStudentDetails(student.id)}
                      className="text-[#00A8E8] hover:text-[#0077B6] font-medium flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Action buttons */}
      {selectedSet.size > 0 && actions.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
          <span className="text-sm text-gray-600 flex items-center">
            {selectedSet.size} selected
          </span>
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.onClick}
              className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
              style={{ backgroundColor: action.color }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate(`/admin/students/${focusStatus || 'waitlist'}`)}
              className="mb-4 flex items-center"
              style={{ color: '#6AA469' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#4A8449'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#6AA469'}
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Student List
            </button>
            
            {session && (
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Student Management: {session.title}
                  </h1>
                  <p className="text-gray-600">
                    {session.dayOfWeek} {session.startTime} - {session.endTime} | {session.term}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigate(`/admin/attendance/${sessionId}`)}
                    className="px-4 py-2 bg-[#00A8E8] text-white rounded-lg hover:bg-[#0088C8] transition-colors font-medium flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Attendance
                  </button>
                  <div className="bg-white rounded-lg shadow-md px-6 py-4">
                    <div className="text-sm text-gray-600">Capacity</div>
                    <div className="text-2xl font-bold" style={{ color: admittedCount >= session.capacity ? '#dc2626' : '#6AA469' }}>
                      {admittedCount} / {session.capacity}
                    </div>
                    {admittedCount >= session.capacity && (
                      <div className="text-xs text-red-600 mt-1">Session Full</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status Navigation Tabs */}
          {session && (
            <div className="mb-6 flex gap-2">
              <button
                onClick={() => navigate(`/admin/sessions/${sessionId}/waitlist?status=waitlist`)}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  (focusStatus === 'waitlist' || !focusStatus)
                    ? 'bg-yellow-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Wait List ({waitlistStudents.length})
              </button>
              <button
                onClick={() => navigate(`/admin/sessions/${sessionId}/waitlist?status=admitted`)}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  focusStatus === 'admitted'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Admitted Students ({admittedStudents.length})
              </button>
              <button
                onClick={() => navigate(`/admin/sessions/${sessionId}/waitlist?status=withdrawn`)}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  focusStatus === 'withdrawn'
                    ? 'bg-red-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Withdrawn Students ({withdrawnStudents.length})
              </button>
            </div>
          )}

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
                placeholder="Search students by name, email, parent, or school year..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6AA469] focus:border-transparent"
              />
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
              <p className="mt-4 text-gray-600">Loading student data...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Show only the list corresponding to focusStatus */}
              {(focusStatus === 'waitlist' || !focusStatus) && renderStudentList(
                'Wait List',
                waitlistStudents,
                selectedWaitlist,
                setSelectedWaitlist,
                'bg-yellow-500',
                [
                  {
                    label: '→ Admit to Session',
                    onClick: () => handleBulkStatusUpdate(Array.from(selectedWaitlist), 'admitted'),
                    color: '#6AA469'
                  },
                  {
                    label: '→ Move to Withdrawn',
                    onClick: () => handleBulkStatusUpdate(Array.from(selectedWaitlist), 'withdrawn'),
                    color: '#dc2626'
                  }
                ],
                waitlistRef,
                true,
                'waitlist'
              )}

              {focusStatus === 'admitted' && renderStudentList(
                'Admitted Students',
                admittedStudents,
                selectedAdmitted,
                setSelectedAdmitted,
                'bg-green-600',
                [
                  {
                    label: '← Return to Waitlist',
                    onClick: () => handleBulkStatusUpdate(Array.from(selectedAdmitted), 'waitlist'),
                    color: '#f59e0b'
                  },
                  {
                    label: '→ Move to Withdrawn',
                    onClick: () => handleBulkStatusUpdate(Array.from(selectedAdmitted), 'withdrawn'),
                    color: '#dc2626'
                  }
                ],
                admittedRef,
                true
              )}

              {focusStatus === 'withdrawn' && renderStudentList(
                'Withdrawn Students',
                withdrawnStudents,
                selectedWithdrawn,
                setSelectedWithdrawn,
                'bg-red-600',
                [
                  {
                    label: '← Return to Waitlist',
                    onClick: () => handleBulkStatusUpdate(Array.from(selectedWithdrawn), 'waitlist'),
                    color: '#f59e0b'
                  },
                  {
                    label: '→ Admit to Session',
                    onClick: () => handleBulkStatusUpdate(Array.from(selectedWithdrawn), 'admitted'),
                    color: '#6AA469'
                  }
                ],
                withdrawnRef,
                true
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog?.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Action</h3>
              <p className="text-gray-600 whitespace-pre-line">{confirmDialog.message}</p>
            </div>
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 bg-[#6AA469] text-white rounded-lg hover:bg-[#5A9459] transition-colors font-medium"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message Modal */}
      {errorMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Cannot Complete Action</h3>
                  <p className="text-gray-600 whitespace-pre-line">{errorMessage}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end">
              <button
                onClick={() => setErrorMessage(null)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {selectedStudentDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#1E6193] to-[#6AA469] text-white px-6 py-4 sticky top-0">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">{isEditMode ? 'Edit Student Details' : 'Student Details'}</h3>
                <button
                  onClick={() => {
                    setSelectedStudentDetails(null);
                    setIsEditMode(false);
                    setEditFormData({});
                  }}
                  className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Student Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-[#6AA469]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Student Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">First Name</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editFormData.first_name || ''}
                        onChange={(e) => handleFormChange('first_name', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6AA469] focus:ring-[#6AA469] sm:text-sm px-3 py-2 border"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">{selectedStudentDetails.first_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Family Name</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editFormData.family_name || ''}
                        onChange={(e) => handleFormChange('family_name', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6AA469] focus:ring-[#6AA469] sm:text-sm px-3 py-2 border"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">{selectedStudentDetails.family_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    {isEditMode ? (
                      <input
                        type="email"
                        value={editFormData.student_email || ''}
                        onChange={(e) => handleFormChange('student_email', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6AA469] focus:ring-[#6AA469] sm:text-sm px-3 py-2 border"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">{selectedStudentDetails.student_email}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">School Year</label>
                    {isEditMode ? (
                      <select
                        value={editFormData.school_year || ''}
                        onChange={(e) => handleFormChange('school_year', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6AA469] focus:ring-[#6AA469] sm:text-sm px-3 py-2 border"
                      >
                        <option value="Year 7-8">Year 7-8</option>
                        <option value="Year 9-10">Year 9-10</option>
                        <option value="Year 11-13">Year 11-13</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <p className="mt-1 text-gray-900">
                        {selectedStudentDetails.school_year}
                        {selectedStudentDetails.school_year_other && ` (${selectedStudentDetails.school_year_other})`}
                      </p>
                    )}
                  </div>
                  {isEditMode && editFormData.school_year === 'Other' && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-500">Please Specify School Year</label>
                      <input
                        type="text"
                        value={editFormData.school_year_other || ''}
                        onChange={(e) => handleFormChange('school_year_other', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6AA469] focus:ring-[#6AA469] sm:text-sm px-3 py-2 border"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Parent/Guardian Information */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-[#00A8E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Parent/Guardian Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Parent Name</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editFormData.parent_name || ''}
                        onChange={(e) => handleFormChange('parent_name', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6AA469] focus:ring-[#6AA469] sm:text-sm px-3 py-2 border"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">{selectedStudentDetails.parent_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Parent Phone</label>
                    {isEditMode ? (
                      <input
                        type="tel"
                        value={editFormData.parent_phone || ''}
                        onChange={(e) => handleFormChange('parent_phone', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6AA469] focus:ring-[#6AA469] sm:text-sm px-3 py-2 border"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">{selectedStudentDetails.parent_phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-[#0077B6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Additional Information
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Needs Device</label>
                    {isEditMode ? (
                      <div className="mt-1">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={editFormData.needs_device || false}
                            onChange={(e) => handleFormChange('needs_device', e.target.checked)}
                            className="rounded border-gray-300 text-[#6AA469] shadow-sm focus:border-[#6AA469] focus:ring-[#6AA469]"
                          />
                          <span className="ml-2 text-gray-900">Yes, student needs a device</span>
                        </label>
                      </div>
                    ) : (
                      <p className="mt-1 text-gray-900">{selectedStudentDetails.needs_device ? 'Yes' : 'No'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Previous Experience</label>
                    {isEditMode ? (
                      <div className="mt-2 space-y-2">
                        {['Scratch', 'Python', 'HTML/CSS', 'JavaScript', 'Other'].map((exp) => (
                          <label key={exp} className="inline-flex items-center mr-4">
                            <input
                              type="checkbox"
                              checked={(editFormData.experience || []).includes(exp)}
                              onChange={(e) => handleExperienceChange(exp, e.target.checked)}
                              className="rounded border-gray-300 text-[#6AA469] shadow-sm focus:border-[#6AA469] focus:ring-[#6AA469]"
                            />
                            <span className="ml-2 text-gray-700">{exp}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      selectedStudentDetails.experience && selectedStudentDetails.experience.length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-2">
                          {selectedStudentDetails.experience.map((exp, idx) => (
                            <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                              {exp}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-gray-900">None</p>
                      )
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Medical Information</label>
                    {isEditMode ? (
                      <textarea
                        value={editFormData.medical_info || ''}
                        onChange={(e) => handleFormChange('medical_info', e.target.value)}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6AA469] focus:ring-[#6AA469] sm:text-sm px-3 py-2 border"
                        placeholder="Any medical conditions or allergies we should know about"
                      />
                    ) : (
                      selectedStudentDetails.medical_info ? (
                        <p className="mt-1 text-gray-900 bg-yellow-50 p-3 rounded border border-yellow-200">
                          {selectedStudentDetails.medical_info}
                        </p>
                      ) : (
                        <p className="mt-1 text-gray-900">None</p>
                      )
                    )}
                  </div>
                  {!isEditMode && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">How did you hear about us?</label>
                      <p className="mt-1 text-gray-900">
                        {selectedStudentDetails.heard_from}
                        {selectedStudentDetails.heard_from_other && ` (${selectedStudentDetails.heard_from_other})`}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Consents */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Consents
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    {selectedStudentDetails.consent_share_details ? (
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className="text-gray-900">Share Details with Schools/Organizations</span>
                  </div>
                  <div className="flex items-center">
                    {selectedStudentDetails.consent_photos ? (
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className="text-gray-900">Photo Permission</span>
                  </div>
                  <div className="flex items-center">
                    {selectedStudentDetails.newsletter_subscribe ? (
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className="text-gray-900">Newsletter Subscription</span>
                  </div>
                </div>
              </div>

              {/* Status & Dates */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Status Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Current Status</label>
                    <p className="mt-1">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedStudentDetails.status === 'admitted' ? 'bg-green-100 text-green-800' :
                        selectedStudentDetails.status === 'withdrawn' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedStudentDetails.status === 'waitlist' ? 'Wait List' :
                         selectedStudentDetails.status === 'admitted' ? 'Admitted' : 'Withdrawn'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Submitted</label>
                    <p className="mt-1 text-gray-900">
                      {new Date(selectedStudentDetails.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 sticky bottom-0 flex justify-end border-t space-x-3">
              {isEditMode ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-6 py-2 bg-[#6AA469] text-white rounded-lg hover:bg-[#5A9459] transition-colors font-medium"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setSelectedStudentDetails(null);
                      setIsEditMode(false);
                      setEditFormData({});
                    }}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleEditClick}
                    className="px-6 py-2 bg-[#00A8E8] text-white rounded-lg hover:bg-[#0077B6] transition-colors font-medium flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Student
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaitlistManagement;
