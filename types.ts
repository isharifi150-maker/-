export type Role = 'admin' | 'employee';
export type FormType = 'teacher' | 'teacher_activity' | 'teacher_health' | 'lab_keeper' | 'student_guide';

export interface Criterion { id: string; label: string; weight: number; description?: string; }
export interface EvaluationForm { type: FormType; name: string; shortName: string; description: string; icon: string; criteria: Criterion[]; }

export interface User {
  id: string;
  civilId: string;
  password: string;
  fullName: string;
  role: Role;
  formType?: FormType;
  jobTitle?: string;
  createdAt: number;
  mustChangePassword: boolean;
}

export interface Evidence {
  id: string;
  userId: string;
  criterionId: string;
  fileName: string;
  fileType: 'pdf' | 'image';
  fileSize: number;
  fileData: string; // Supabase public/signed URL (kept for existing preview UI compatibility)
  storagePath?: string;
  uploadedAt: number;
  description?: string;
}

export interface Score {
  id: string;
  userId: string;
  criterionId: string;
  rating: number;
  notes: string;
  period: 'midyear' | 'final';
  createdAt: number;
  updatedAt: number;
}

export interface Evaluation {
  id: string;
  userId: string;
  period: 'midyear' | 'final';
  status: 'draft' | 'submitted' | 'approved';
  generalNotes: string;
  totalScore: number;
  ratingLabel: string;
  scores?: Score[];
  approvedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface SchoolSettings {
  id: string;
  schoolName: string;
  educationDepartment?: string;
  schoolYear?: string;
  updatedAt: number;
  [key: string]: unknown;
}

export interface AuthState { user: User | null; isAuthenticated: boolean; }
