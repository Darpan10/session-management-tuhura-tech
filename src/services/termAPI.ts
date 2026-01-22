import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/terms';

export interface Term {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  year: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTermRequest {
  name: string;
  startDate: string;
  endDate: string;
}

export interface UpdateTermRequest {
  name?: string;
  startDate?: string;
  endDate?: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

export const termAPI = {
  // Get all terms
  getAllTerms: async (): Promise<Term[]> => {
    const response = await axios.get(API_BASE_URL, getAuthHeaders());
    return response.data;
  },

  // Get single term by ID
  getTermById: async (id: number): Promise<Term> => {
    const response = await axios.get(`${API_BASE_URL}/${id}`, getAuthHeaders());
    return response.data;
  },

  // Create a new term
  createTerm: async (data: CreateTermRequest): Promise<Term> => {
    const response = await axios.post(API_BASE_URL, data, getAuthHeaders());
    return response.data;
  },

  // Update a term
  updateTerm: async (id: number, data: UpdateTermRequest): Promise<Term> => {
    const response = await axios.put(`${API_BASE_URL}/${id}`, data, getAuthHeaders());
    return response.data;
  },

  // Delete a term
  deleteTerm: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/${id}`, getAuthHeaders());
  },
};
