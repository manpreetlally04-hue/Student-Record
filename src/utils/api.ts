import { Student, StudentFormData, AuditLog, MySQLConfig, SQLQueryResult, BatchImportResult, CSVStudentRow } from '../types/student.ts';

export async function fetchStudents(params?: {
  search?: string;
  department?: string;
  semester?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<Student[]> {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.department) query.append('department', params.department);
  if (params?.semester) query.append('semester', params.semester.toString());
  if (params?.status) query.append('status', params.status);
  if (params?.sortBy) query.append('sortBy', params.sortBy);
  if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

  const res = await fetch(`/api/students?${query.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch students.');
  }
  const data = await res.json();
  return data.students;
}

export async function addStudentApi(formData: StudentFormData): Promise<{ student: Student; sqlQuery: string; message: string }> {
  const res = await fetch('/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to add student.');
  }
  return data;
}

export async function updateStudentApi(
  id: number,
  formData: StudentFormData,
  secretKey: string,
  remark?: string
): Promise<{ student: Student; sqlQuery: string; message: string }> {
  const res = await fetch(`/api/students/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-secret-key': secretKey,
    },
    body: JSON.stringify({ ...formData, remark }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update student.');
  }
  return data;
}

export async function deleteStudentApi(
  id: number,
  secretKey: string
): Promise<{ deleted: Student; sqlQuery: string; message: string }> {
  const res = await fetch(`/api/students/${id}`, {
    method: 'DELETE',
    headers: {
      'x-secret-key': secretKey,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to delete student.');
  }
  return data;
}

export async function bulkDeleteStudentsApi(
  ids: number[],
  secretKey: string
): Promise<{ count: number; sqlQuery: string; message: string }> {
  const res = await fetch('/api/students/bulk-delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-secret-key': secretKey,
    },
    body: JSON.stringify({ ids }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to delete students.');
  }
  return data;
}

export async function verifySecretKeyApi(key: string): Promise<boolean> {
  const res = await fetch('/api/secret-key/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  });
  const data = await res.json();
  return Boolean(data.valid);
}

export async function changeSecretKeyApi(oldKey: string, newKey: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/secret-key/change', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldKey, newKey }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update secret key.');
  }
  return data;
}

export async function executeSQLApi(query: string): Promise<SQLQueryResult> {
  const res = await fetch('/api/sql/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  return await res.json();
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  const res = await fetch('/api/audit-logs');
  const data = await res.json();
  return data.logs || [];
}

export async function fetchMySQLConfig(): Promise<MySQLConfig> {
  const res = await fetch('/api/mysql/config');
  const data = await res.json();
  return data.config;
}

export async function testMySQLConnectionApi(config: MySQLConfig): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/mysql/test-connection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  return await res.json();
}

export async function resetDatabaseApi(secretKey: string): Promise<{ success: boolean; message: string; sqlQuery: string }> {
  const res = await fetch('/api/students/reset', {
    method: 'POST',
    headers: { 'x-secret-key': secretKey },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to reset database.');
  }
  return data;
}

export async function batchImportStudentsApi(
  records: CSVStudentRow[],
  secretKey: string,
  conflictStrategy: 'skip' | 'overwrite' = 'skip'
): Promise<BatchImportResult> {
  const res = await fetch('/api/students/batch-import', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-secret-key': secretKey,
    },
    body: JSON.stringify({ records, conflictStrategy }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to batch import student records.');
  }
  return data;
}

