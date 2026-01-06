import axios, { AxiosError } from 'axios';
import type { StudentSignupFormData, WaitlistEntry, WaitlistEntryWithDetails } from '../types/waitlist';

const API_BASE_URL = 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add auth token for protected endpoints
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

export const waitlistAPI = {
  /**
   * Submit student signup (public endpoint - no auth required)
   */
  submitSignup: async (data: StudentSignupFormData): Promise<WaitlistEntry> => {
    try {
      const response = await axios.post<WaitlistEntry>(`${API_BASE_URL}/api/waitlist/signup`, {
        email: data.email,
        first_name: data.firstName,
        family_name: data.familyName,
        session_id: data.sessionId,
        school_year: data.schoolYear,
        school_year_other: data.schoolYearOther,
        experience: data.experience,
        needs_device: data.needsDevice,
        medical_info: data.medicalInfo,
        parent_name: data.parentName,
        parent_phone: data.parentPhone,
        consent_share_details: data.consentShareDetails,
        consent_photos: data.consentPhotos,
        heard_from: data.heardFrom,
        heard_from_other: data.heardFromOther,
        newsletter_subscribe: data.newsletterSubscribe,
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to submit signup'));
    }
  },

  /**
   * Get waitlist entries for a session (requires auth)
   */
  getSessionWaitlist: async (sessionId: number): Promise<WaitlistEntryWithDetails[]> => {
    try {
      const response = await apiClient.get<WaitlistEntryWithDetails[]>(`/api/waitlist/session/${sessionId}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch waitlist'));
    }
  },

  /**
   * Update waitlist entry status (requires auth)
   */
  updateStatus: async (waitlistId: number, newStatus: 'waitlist' | 'enrolled' | 'cancelled'): Promise<WaitlistEntry> => {
    try {
      const response = await apiClient.patch<WaitlistEntry>(`/api/waitlist/${waitlistId}/status`, null, {
        params: { new_status: newStatus }
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to update status'));
    }
  },
};
