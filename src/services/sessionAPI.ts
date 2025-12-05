import apiClient from './api';
import type {
  CreateSessionRequest,
  CreateSessionResponse,
  Session,
  Term,
  Staff
} from '../types/session';

export const sessionAPI = {
  /**
   * Create a new session
   */
  createSession: async (data: CreateSessionRequest): Promise<CreateSessionResponse> => {
    try {
      const response = await apiClient.post<CreateSessionResponse>('/api/sessions/create', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to create session');
    }
  },

  /**
   * Get all sessions
   */
  getSessions: async (): Promise<Session[]> => {
    try {
      const response = await apiClient.get<Session[]>('/api/sessions');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch sessions');
    }
  },

  /**
   * Get session by ID
   */
  getSessionById: async (id: number): Promise<Session> => {
    try {
      const response = await apiClient.get<Session>(`/api/sessions/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch session');
    }
  },

  /**
   * Get all available terms
   */
  getTerms: async (): Promise<Term[]> => {
    try {
      const response = await apiClient.get<Term[]>('/api/terms');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch terms');
    }
  },

  /**
   * Get all staff members
   */
  getStaff: async (): Promise<Staff[]> => {
    try {
      const response = await apiClient.get<Staff[]>('/api/staff');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch staff');
    }
  },

  /**
   * Delete a session
   */
  deleteSession: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/api/sessions/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to delete session');
    }
  },
};
