export interface StaffMember {
  id: number;
  userName: string;
  email: string;
}

export interface TermDetail {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  year: number;
}

export interface SessionFormData {
  title: string;
  description?: string;
  termIds: number[];
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  location: string;
  city: string;
  locationUrl?: string;
  capacity: number;
  minAge: number;
  maxAge: number;
  staffIds: number[];
}

export interface Session {
  id: number;
  title: string;
  description?: string;
  termIds: number[];
  termNames: string[];
  terms: TermDetail[];  // Full term details with dates
  dayOfWeek: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  city: string;
  locationUrl?: string;
  capacity: number;
  minAge: number;
  maxAge: number;
  isDeleted: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  staff: StaffMember[];
}

export interface SessionWithCount {
  id: number;
  title: string;
  term: string;
  dayOfWeek: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  city: string;
  studentCount: number;
}

export interface AllSessionsStudentCountResponse {
  status: string;
  totalStudents: number;
  sessions: SessionWithCount[];
}

export interface CreateSessionRequest {
  title: string;
  description?: string;
  termIds: number[];
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  location: string;
  city: string;
  locationUrl?: string;
  capacity: number;
  minAge: number;
  maxAge: number;
  staffIds?: number[];
}

export interface CreateSessionResponse {
  status: string;
  message: string;
  session: Session;
}
