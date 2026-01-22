import axios, { AxiosError } from 'axios';
import type {
  Session,
  CreateSessionRequest,
  CreateSessionResponse,
  StaffMember
} from '../types/session';

// Use the same base URL as auth API
const API_BASE_URL = 'http://127.0.0.1:8000';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper function to extract error message
const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  const axiosError = error as AxiosError<{ detail?: string | { message: string }; message?: string }>;
  console.error('API Error:', {
    status: axiosError.response?.status,
    data: axiosError.response?.data,
    message: axiosError.message
  });
  
  const errorDetail = axiosError.response?.data?.detail;
  if (typeof errorDetail === 'string') {
    return errorDetail;
  }
  if (errorDetail && typeof errorDetail === 'object' && 'message' in errorDetail) {
    return errorDetail.message;
  }
  if (axiosError.response?.data?.message) {
    return axiosError.response.data.message;
  }
  return defaultMessage;
};

// Session API endpoints
export const sessionAPI = {
  /**
   * Get all sessions
   */
  getSessions: async (): Promise<Session[]> => {
    try {
      const response = await apiClient.get<Session[]>('/api/sessions');
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch sessions'));
    }
  },

  /**
   * Get a single session by ID
   */
  getSession: async (id: number): Promise<Session> => {
    try {
      const response = await apiClient.get<Session>(`/api/sessions/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch session'));
    }
  },

  /**
   * Create a new session
   */
  createSession: async (data: CreateSessionRequest): Promise<CreateSessionResponse> => {
    try {
      console.log('Creating session with data:', data);
      const response = await apiClient.post<CreateSessionResponse>('/api/sessions', data);
      console.log('Session created successfully:', response.data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to create session'));
    }
  },

  /**
   * Update an existing session
   */
  updateSession: async (id: number, data: Partial<CreateSessionRequest>): Promise<Session> => {
    try {
      const response = await apiClient.put<Session>(`/api/sessions/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to update session'));
    }
  },

  /**
   * Delete a session
   */
  deleteSession: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/api/sessions/${id}`);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to delete session'));
    }
  },

  /**
   * Get all staff members (users with STAFF role)
   */
  getStaff: async (): Promise<StaffMember[]> => {
    try {
      const response = await apiClient.get<StaffMember[]>('/api/sessions/staff');
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch staff members'));
    }
  },

  /**
   * Bulk update waitlist entry status
   */
  bulkUpdateStatus: async (waitlistIds: number[], newStatus: 'waitlist' | 'admitted' | 'withdrawn'): Promise<{ updated_count: number; message: string }> => {
    try {
      console.log('Bulk update request:', { waitlist_ids: waitlistIds, new_status: newStatus });
      const response = await apiClient.post('/api/waitlist/bulk-status', {
        waitlist_ids: waitlistIds,
        new_status: newStatus,
      });
      console.log('Bulk update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Bulk update error details:', error);
      throw new Error(getErrorMessage(error, 'Failed to update student status'));
    }
  },

  /**
   * Get waitlist entries by status for a specific session
   */
  getWaitlistByStatus: async (sessionId: number, status: 'waitlist' | 'admitted' | 'withdrawn'): Promise<any[]> => {
    try {
      const response = await apiClient.get(`/api/waitlist/session/${sessionId}/status/${status}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch waitlist'));
    }
  },

  /**
   * Get count of admitted students for a session
   */
  getAdmittedCount: async (sessionId: number): Promise<number> => {
    try {
      const response = await apiClient.get(`/api/waitlist/session/${sessionId}/admitted-count`);
      return response.data.admitted_count;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch admitted count'));
    }
  },

  /**
   * Get detailed information for a specific waitlist entry
   */
  getWaitlistEntry: async (waitlistId: number): Promise<any> => {
    try {
      const response = await apiClient.get(`/api/waitlist/${waitlistId}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch student details'));
    }
  },

  /**
   * Update student information
   */
  updateStudent: async (studentId: number, data: any): Promise<any> => {
    try {
      const response = await apiClient.put(`/api/waitlist/students/${studentId}`, data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to update student'));
    }
  },

  /**
   * Get attendance records for a session
   */
  getSessionAttendance: async (sessionId: number): Promise<any[]> => {
    try {
      const response = await apiClient.get(`/api/attendance/session/${sessionId}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch attendance'));
    }
  },

  /**
   * Bulk update attendance - sends all attendance records (present and absent) for a specific date
   */
  bulkUpdateAttendance: async (
    sessionId: number, 
    attendanceDate: string, 
    attendanceRecords: { waitlist_id: number; is_present: boolean }[]
  ): Promise<any> => {
    try {
      const response = await apiClient.post('/api/attendance/bulk-update', {
        session_id: sessionId,
        attendance_date: attendanceDate,
        attendance_records: attendanceRecords
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to save attendance'));
    }
  },

  /**
   * Bulk save ALL attendance - sends all dates and students in ONE call (OPTIMIZED)
   */
  bulkSaveAllAttendance: async (
    sessionId: number,
    allRecords: { attendance_date: string; waitlist_id: number; is_present: boolean }[]
  ): Promise<any> => {
    try {
      const response = await apiClient.post('/api/attendance/bulk-save-all', {
        session_id: sessionId,
        attendance_records: allRecords
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to save attendance'));
    }
  },

  /**
   * OPTIMIZED: Get all sessions with student counts for a specific status in ONE call
   */
  getAllSessionsWithStudentCounts: async (status: 'waitlist' | 'admitted' | 'withdrawn'): Promise<any> => {
    try {
      const response = await apiClient.get(`/api/waitlist/all-sessions/status/${status}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to load sessions'));
    }
  },
};
