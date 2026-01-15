export interface StaffMember {
  id: number;
  userName: string;
  email: string;
}

export interface SessionFormData {
  title: string;
  term: string;
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
  staffIds: number[];
}

export interface Session {
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
  locationUrl?: string;
  capacity: number;
  minAge: number;
  maxAge: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  staff: StaffMember[];
}

export interface CreateSessionRequest {
  title: string;
  term: string;
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
  staffIds?: number[];
}

export interface CreateSessionResponse {
  status: string;
  message: string;
  session: Session;
}
