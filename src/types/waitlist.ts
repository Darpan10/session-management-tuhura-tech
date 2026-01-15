export interface StudentSignupFormData {
  // Student details
  email: string;
  firstName: string;
  familyName: string;
  sessionId: number;
  schoolYear: string;
  schoolYearOther?: string;
  experience: string[];
  needsDevice: boolean;
  medicalInfo?: string;
  
  // Parent/Guardian details
  parentName: string;
  parentPhone: string;
  
  // Consents
  consentShareDetails: boolean;
  consentPhotos: boolean;
  
  // Marketing
  heardFrom: string;
  heardFromOther?: string;
  newsletterSubscribe: boolean;
}

export interface WaitlistEntry {
  id: number;
  studentId: number;
  sessionId: number;
  consentShareDetails: boolean;
  consentPhotos: boolean;
  heardFrom: string;
  heardFromOther?: string;
  newsletterSubscribe: boolean;
  status: 'waitlist' | 'enrolled' | 'cancelled';
  createdAt: string;
}

export interface WaitlistEntryWithDetails {
  id: number;
  studentName: string;
  studentEmail: string;
  parentName: string;
  parentPhone: string;
  schoolYear: string;
  needsDevice: boolean;
  status: string;
  createdAt: string;
}
