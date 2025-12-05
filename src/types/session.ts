export interface Term {
  id: number;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
}

export interface Staff {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface SessionFormData {
  term: string;
  year: number;
  startDateTime: string;
  location: string;
  capacity: number;
  minAge: number;
  maxAge: number;
  assignedStaff: number[];
  recurringPattern?: 'weekly' | 'biweekly' | 'none';
  endDate?: string;
}

export interface Session {
  id: number;
  term: string;
  year: number;
  startDateTime: string;
  endDateTime: string;
  location: string;
  capacity: number;
  minAge: number;
  maxAge: number;
  assignedStaff: Staff[];
  rrule?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionRequest {
  term: string;
  year: number;
  startDateTime: string;
  location: string;
  capacity: number;
  minAge: number;
  maxAge: number;
  assignedStaffIds: number[];
  recurringPattern?: 'weekly' | 'biweekly' | 'none';
  endDate?: string;
}

export interface CreateSessionResponse {
  status: string;
  message: string;
  sessionId: number;
  rrule?: string;
}
