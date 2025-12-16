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
};
