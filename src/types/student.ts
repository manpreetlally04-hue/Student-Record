export type StudentStatus = 'Active' | 'On Leave' | 'Graduated' | 'Suspended';

export interface Student {
  id: number;
  studentId: string; // e.g. "STU-2025-010"
  fullName: string;
  email: string;
  phone: string;
  department: string; // e.g. "Computer Science", "Information Technology", "Data Science", "Electronics", "Mechanical"
  semester: number;   // 1 to 8
  gpa: number;        // 0.00 to 4.00
  enrollmentDate: string; // YYYY-MM-DD
  status: StudentStatus;
  address: string;
  emergencyContact: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentFormData {
  studentId: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  semester: number;
  gpa: number;
  enrollmentDate: string;
  status: StudentStatus;
  address: string;
  emergencyContact: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'BULK_DELETE' | 'SQL_EXECUTE' | 'IMPORT';
  target: string;
  studentId?: string;
  details: string;
  sqlQuery: string;
  secretKeyUsed: boolean;
  success: boolean;
}

export interface MySQLConfig {
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
  ssl: boolean;
  connected: boolean;
  lastTested?: string;
}

export interface SQLQueryResult {
  success: boolean;
  query: string;
  executionTimeMs: number;
  rowsAffected?: number;
  columns?: string[];
  rows?: Record<string, unknown>[];
  error?: string;
}

export interface BatchImportResult {
  success: boolean;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  totalProcessed: number;
  errors: string[];
  sqlQuery: string;
  message: string;
}

export interface CSVStudentRow {
  studentId: string;
  fullName: string;
  email: string;
  phone?: string;
  department: string;
  semester?: number | string;
  gpa?: number | string;
  enrollmentDate?: string;
  status?: string;
  address?: string;
  emergencyContact?: string;
}

