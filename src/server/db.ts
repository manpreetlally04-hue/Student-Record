import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { Student, StudentFormData, AuditLog, MySQLConfig, SQLQueryResult, BatchImportResult, CSVStudentRow, StudentStatus } from '../types/student.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STUDENTS_FILE = path.join(DATA_DIR, 'students.json');
const AUDIT_FILE = path.join(DATA_DIR, 'audit_logs.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

const DEFAULT_SECRET_KEY = 'ADMIN@2025';

interface AppConfig {
  secretKey: string;
  mysql: MySQLConfig;
}

const DEFAULT_CONFIG: AppConfig = {
  secretKey: DEFAULT_SECRET_KEY,
  mysql: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    database: 'student_management_db',
    ssl: false,
    connected: false,
  },
};

const INITIAL_STUDENTS: Student[] = [
  {
    id: 1,
    studentId: 'STU-2024-001',
    fullName: 'Aarav Sharma',
    email: 'aarav.sharma@university.edu',
    phone: '+1 (555) 234-5678',
    department: 'Computer Science',
    semester: 6,
    gpa: 3.85,
    enrollmentDate: '2022-08-20',
    status: 'Active',
    address: '42 Campus View Drive, Suite 3B',
    emergencyContact: 'Rajesh Sharma (+1 555-901-2345)',
    createdAt: '2024-01-15T09:30:00.000Z',
    updatedAt: '2024-01-15T09:30:00.000Z',
  },
  {
    id: 2,
    studentId: 'STU-2024-002',
    fullName: 'Sophia Martinez',
    email: 'sophia.m@university.edu',
    phone: '+1 (555) 345-6789',
    department: 'Data Science',
    semester: 4,
    gpa: 3.92,
    enrollmentDate: '2023-01-12',
    status: 'Active',
    address: '118 University Boulevard, Apt 12',
    emergencyContact: 'Elena Martinez (+1 555-888-7711)',
    createdAt: '2024-01-16T10:15:00.000Z',
    updatedAt: '2024-02-01T14:20:00.000Z',
  },
  {
    id: 3,
    studentId: 'STU-2024-003',
    fullName: 'Liam Chen',
    email: 'liam.chen@university.edu',
    phone: '+1 (555) 456-7890',
    department: 'Information Technology',
    semester: 8,
    gpa: 3.48,
    enrollmentDate: '2021-08-15',
    status: 'Graduated',
    address: '77 Silicon Way',
    emergencyContact: 'Grace Chen (+1 555-222-3344)',
    createdAt: '2024-01-18T11:00:00.000Z',
    updatedAt: '2024-05-30T16:00:00.000Z',
  },
  {
    id: 4,
    studentId: 'STU-2024-004',
    fullName: 'Emily Watson',
    email: 'emily.watson@university.edu',
    phone: '+1 (555) 567-8901',
    department: 'Electronics & Communication',
    semester: 5,
    gpa: 3.65,
    enrollmentDate: '2022-08-20',
    status: 'Active',
    address: '204 Highland Park, Block C',
    emergencyContact: 'David Watson (+1 555-444-5566)',
    createdAt: '2024-02-01T08:45:00.000Z',
    updatedAt: '2024-02-01T08:45:00.000Z',
  },
  {
    id: 5,
    studentId: 'STU-2024-005',
    fullName: 'Manpreet Singh',
    email: 'manpreet.s@university.edu',
    phone: '+1 (555) 678-9012',
    department: 'Computer Science',
    semester: 7,
    gpa: 3.78,
    enrollmentDate: '2021-08-15',
    status: 'Active',
    address: '90 Greenfield Ave',
    emergencyContact: 'Harpreet Singh (+1 555-777-9900)',
    createdAt: '2024-02-10T12:00:00.000Z',
    updatedAt: '2024-03-15T09:10:00.000Z',
  },
  {
    id: 6,
    studentId: 'STU-2024-006',
    fullName: 'Chloe Dupont',
    email: 'chloe.dupont@university.edu',
    phone: '+1 (555) 789-0123',
    department: 'Mechanical Engineering',
    semester: 3,
    gpa: 3.20,
    enrollmentDate: '2023-08-22',
    status: 'On Leave',
    address: '15 Maple Street',
    emergencyContact: 'Henri Dupont (+1 555-333-1122)',
    createdAt: '2024-02-20T14:30:00.000Z',
    updatedAt: '2024-04-10T11:00:00.000Z',
  },
  {
    id: 7,
    studentId: 'STU-2024-007',
    fullName: 'Devon Patel',
    email: 'devon.patel@university.edu',
    phone: '+1 (555) 890-1234',
    department: 'Data Science',
    semester: 2,
    gpa: 3.90,
    enrollmentDate: '2024-01-10',
    status: 'Active',
    address: '302 Horizon Hall',
    emergencyContact: 'Sunita Patel (+1 555-666-4433)',
    createdAt: '2024-03-01T15:20:00.000Z',
    updatedAt: '2024-03-01T15:20:00.000Z',
  },
  {
    id: 8,
    studentId: 'STU-2024-008',
    fullName: 'Hannah Becker',
    email: 'hannah.b@university.edu',
    phone: '+1 (555) 901-2345',
    department: 'Electronics & Communication',
    semester: 6,
    gpa: 2.85,
    enrollmentDate: '2022-08-20',
    status: 'Suspended',
    address: '50 Elm Road, Apt 4A',
    emergencyContact: 'Klaus Becker (+1 555-111-9988)',
    createdAt: '2024-03-05T09:00:00.000Z',
    updatedAt: '2024-05-12T13:45:00.000Z',
  },
];

class DatabaseService {
  private students: Student[] = [];
  private auditLogs: AuditLog[] = [];
  private config: AppConfig = DEFAULT_CONFIG;

  constructor() {
    this.ensureDataDir();
    this.loadData();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
      } else {
        this.saveConfig();
      }

      if (fs.existsSync(STUDENTS_FILE)) {
        const raw = fs.readFileSync(STUDENTS_FILE, 'utf-8');
        this.students = JSON.parse(raw);
      } else {
        this.students = [...INITIAL_STUDENTS];
        this.saveStudents();
      }

      if (fs.existsSync(AUDIT_FILE)) {
        const raw = fs.readFileSync(AUDIT_FILE, 'utf-8');
        this.auditLogs = JSON.parse(raw);
      } else {
        this.auditLogs = [
          {
            id: 'audit-init-001',
            timestamp: new Date().toISOString(),
            action: 'IMPORT',
            target: 'students table',
            details: 'Database initialized with standard schema and sample seed records.',
            sqlQuery: 'CREATE TABLE `students` (...); INSERT INTO `students` VALUES (...);',
            secretKeyUsed: true,
            success: true,
          },
        ];
        this.saveAuditLogs();
      }
    } catch (err) {
      console.error('Error loading database files:', err);
      this.students = [...INITIAL_STUDENTS];
      this.config = DEFAULT_CONFIG;
    }
  }

  private saveStudents() {
    try {
      fs.writeFileSync(STUDENTS_FILE, JSON.stringify(this.students, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving students:', err);
    }
  }

  private saveAuditLogs() {
    try {
      fs.writeFileSync(AUDIT_FILE, JSON.stringify(this.auditLogs, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving audit logs:', err);
    }
  }

  private saveConfig() {
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving config:', err);
    }
  }

  public getSecretKey(): string {
    return this.config.secretKey;
  }

  public verifySecretKey(key: string | undefined): boolean {
    if (!key) return false;
    return key.trim() === this.config.secretKey.trim();
  }

  public setSecretKey(oldKey: string, newKey: string): { success: boolean; message: string } {
    if (!this.verifySecretKey(oldKey)) {
      return { success: false, message: 'Current secret key is incorrect.' };
    }
    if (!newKey || newKey.trim().length < 4) {
      return { success: false, message: 'New secret key must be at least 4 characters long.' };
    }
    this.config.secretKey = newKey.trim();
    this.saveConfig();

    this.logAudit({
      action: 'UPDATE',
      target: 'security_config',
      details: 'Admin Secret Key was modified successfully.',
      sqlQuery: `-- Admin credentials modified at ${new Date().toISOString()}`,
      secretKeyUsed: true,
      success: true,
    });

    return { success: true, message: 'Secret key updated successfully!' };
  }

  public getMySQLConfig(): MySQLConfig {
    return this.config.mysql;
  }

  public updateMySQLConfig(partial: Partial<MySQLConfig>): MySQLConfig {
    this.config.mysql = {
      ...this.config.mysql,
      ...partial,
    };
    this.saveConfig();
    return this.config.mysql;
  }

  public logAudit(entry: Omit<AuditLog, 'id' | 'timestamp'>) {
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.auditLogs.unshift(newLog);
    // Keep last 150 entries
    if (this.auditLogs.length > 150) {
      this.auditLogs = this.auditLogs.slice(0, 150);
    }
    this.saveAuditLogs();
  }

  public getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  // Students CRUD
  public getAllStudents(params?: {
    search?: string;
    department?: string;
    semester?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Student[] {
    let result = [...this.students];

    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.studentId.toLowerCase().includes(q) ||
          s.fullName.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q) ||
          s.phone.toLowerCase().includes(q)
      );
    }

    if (params?.department && params.department !== 'All') {
      result = result.filter((s) => s.department === params.department);
    }

    if (params?.semester) {
      result = result.filter((s) => s.semester === Number(params.semester));
    }

    if (params?.status && params.status !== 'All') {
      result = result.filter((s) => s.status === params.status);
    }

    const sortBy = params?.sortBy || 'id';
    const sortOrder = params?.sortOrder === 'desc' ? -1 : 1;

    result.sort((a: any, b: any) => {
      if (a[sortBy] < b[sortBy]) return -1 * sortOrder;
      if (a[sortBy] > b[sortBy]) return 1 * sortOrder;
      return 0;
    });

    return result;
  }

  public getStudentById(id: number): Student | undefined {
    return this.students.find((s) => s.id === id);
  }

  public addStudent(data: StudentFormData): { student: Student; sqlQuery: string } {
    // Validate uniqueness of studentId and email
    const trimmedId = data.studentId.trim();
    const trimmedEmail = data.email.trim();

    if (this.students.some((s) => s.studentId.toLowerCase() === trimmedId.toLowerCase())) {
      throw new Error(`Duplicate entry: Student ID '${trimmedId}' already exists.`);
    }

    if (this.students.some((s) => s.email.toLowerCase() === trimmedEmail.toLowerCase())) {
      throw new Error(`Duplicate entry: Email '${trimmedEmail}' is already registered.`);
    }

    const nextId = this.students.length > 0 ? Math.max(...this.students.map((s) => s.id)) + 1 : 1;
    const now = new Date().toISOString();

    const newStudent: Student = {
      id: nextId,
      studentId: trimmedId,
      fullName: data.fullName.trim(),
      email: trimmedEmail,
      phone: data.phone.trim(),
      department: data.department.trim(),
      semester: Number(data.semester),
      gpa: Number(Number(data.gpa).toFixed(2)),
      enrollmentDate: data.enrollmentDate,
      status: data.status,
      address: data.address.trim(),
      emergencyContact: data.emergencyContact.trim(),
      createdAt: now,
      updatedAt: now,
    };

    this.students.push(newStudent);
    this.saveStudents();

    const sqlQuery = `INSERT INTO \`students\` (\`id\`, \`student_id\`, \`full_name\`, \`email\`, \`phone\`, \`department\`, \`semester\`, \`gpa\`, \`enrollment_date\`, \`status\`, \`address\`, \`emergency_contact\`, \`created_at\`, \`updated_at\`)
VALUES (${newStudent.id}, '${escapeSQL(newStudent.studentId)}', '${escapeSQL(newStudent.fullName)}', '${escapeSQL(newStudent.email)}', '${escapeSQL(newStudent.phone)}', '${escapeSQL(newStudent.department)}', ${newStudent.semester}, ${newStudent.gpa.toFixed(2)}, '${newStudent.enrollmentDate}', '${newStudent.status}', '${escapeSQL(newStudent.address)}', '${escapeSQL(newStudent.emergencyContact)}', NOW(), NOW());`;

    this.logAudit({
      action: 'INSERT',
      target: `students (id: ${newStudent.id})`,
      studentId: newStudent.studentId,
      details: `Added new student: ${newStudent.fullName} (${newStudent.studentId}) in ${newStudent.department}`,
      sqlQuery,
      secretKeyUsed: false,
      success: true,
    });

    return { student: newStudent, sqlQuery };
  }

  public updateStudent(
    id: number,
    data: StudentFormData,
    secretKey: string | undefined,
    remark?: string
  ): { student: Student; sqlQuery: string } {
    if (!this.verifySecretKey(secretKey)) {
      this.logAudit({
        action: 'UPDATE',
        target: `students (id: ${id})`,
        details: `Failed update attempt: Invalid secret key provided.`,
        sqlQuery: `-- REJECTED: Invalid Secret Key`,
        secretKeyUsed: false,
        success: false,
      });
      throw new Error('Access Denied: Invalid Secret Key. A valid secret key is strictly required to modify student records.');
    }

    const index = this.students.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Student record with ID ${id} not found.`);
    }

    const existing = this.students[index];
    const trimmedId = data.studentId.trim();
    const trimmedEmail = data.email.trim();

    // Check uniqueness if changed
    if (
      trimmedId.toLowerCase() !== existing.studentId.toLowerCase() &&
      this.students.some((s) => s.id !== id && s.studentId.toLowerCase() === trimmedId.toLowerCase())
    ) {
      throw new Error(`Duplicate entry: Student ID '${trimmedId}' is already in use by another student.`);
    }

    if (
      trimmedEmail.toLowerCase() !== existing.email.toLowerCase() &&
      this.students.some((s) => s.id !== id && s.email.toLowerCase() === trimmedEmail.toLowerCase())
    ) {
      throw new Error(`Duplicate entry: Email '${trimmedEmail}' is already registered to another student.`);
    }

    const now = new Date().toISOString();
    const updated: Student = {
      ...existing,
      studentId: trimmedId,
      fullName: data.fullName.trim(),
      email: trimmedEmail,
      phone: data.phone.trim(),
      department: data.department.trim(),
      semester: Number(data.semester),
      gpa: Number(Number(data.gpa).toFixed(2)),
      enrollmentDate: data.enrollmentDate,
      status: data.status,
      address: data.address.trim(),
      emergencyContact: data.emergencyContact.trim(),
      updatedAt: now,
    };

    this.students[index] = updated;
    this.saveStudents();

    const sqlQuery = `UPDATE \`students\`
SET \`student_id\` = '${escapeSQL(updated.studentId)}',
    \`full_name\` = '${escapeSQL(updated.fullName)}',
    \`email\` = '${escapeSQL(updated.email)}',
    \`phone\` = '${escapeSQL(updated.phone)}',
    \`department\` = '${escapeSQL(updated.department)}',
    \`semester\` = ${updated.semester},
    \`gpa\` = ${updated.gpa.toFixed(2)},
    \`enrollment_date\` = '${updated.enrollmentDate}',
    \`status\` = '${updated.status}',
    \`address\` = '${escapeSQL(updated.address)}',
    \`emergency_contact\` = '${escapeSQL(updated.emergencyContact)}',
    \`updated_at\` = NOW()
WHERE \`id\` = ${id};`;

    this.logAudit({
      action: 'UPDATE',
      target: `students (id: ${id})`,
      studentId: updated.studentId,
      details: `Modified record for ${updated.fullName}. Remark: ${remark || 'Direct update via portal'}`,
      sqlQuery,
      secretKeyUsed: true,
      success: true,
    });

    return { student: updated, sqlQuery };
  }

  public deleteStudent(id: number, secretKey: string | undefined): { deleted: Student; sqlQuery: string } {
    if (!this.verifySecretKey(secretKey)) {
      this.logAudit({
        action: 'DELETE',
        target: `students (id: ${id})`,
        details: `Failed delete attempt: Invalid secret key provided.`,
        sqlQuery: `-- REJECTED: Invalid Secret Key`,
        secretKeyUsed: false,
        success: false,
      });
      throw new Error('Access Denied: Invalid Secret Key. A valid secret key is strictly required to delete student records.');
    }

    const index = this.students.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Student record with ID ${id} not found.`);
    }

    const [deleted] = this.students.splice(index, 1);
    this.saveStudents();

    const sqlQuery = `DELETE FROM \`students\` WHERE \`id\` = ${id};`;

    this.logAudit({
      action: 'DELETE',
      target: `students (id: ${id})`,
      studentId: deleted.studentId,
      details: `Deleted student: ${deleted.fullName} (${deleted.studentId}) from ${deleted.department}`,
      sqlQuery,
      secretKeyUsed: true,
      success: true,
    });

    return { deleted, sqlQuery };
  }

  public bulkDelete(ids: number[], secretKey: string | undefined): { count: number; sqlQuery: string } {
    if (!this.verifySecretKey(secretKey)) {
      this.logAudit({
        action: 'BULK_DELETE',
        target: `students table`,
        details: `Failed bulk delete attempt for ${ids.length} records: Invalid secret key.`,
        sqlQuery: `-- REJECTED: Invalid Secret Key`,
        secretKeyUsed: false,
        success: false,
      });
      throw new Error('Access Denied: Invalid Secret Key. A valid secret key is required for bulk deletion.');
    }

    const idSet = new Set(ids);
    const initialCount = this.students.length;
    this.students = this.students.filter((s) => !idSet.has(s.id));
    const deletedCount = initialCount - this.students.length;
    this.saveStudents();

    const sqlQuery = `DELETE FROM \`students\` WHERE \`id\` IN (${ids.join(', ')});`;

    this.logAudit({
      action: 'BULK_DELETE',
      target: `students table`,
      details: `Bulk deleted ${deletedCount} student records.`,
      sqlQuery,
      secretKeyUsed: true,
      success: true,
    });

    return { count: deletedCount, sqlQuery };
  }

  public batchInsertStudents(
    records: CSVStudentRow[],
    secretKey: string | undefined,
    conflictStrategy: 'skip' | 'overwrite' = 'skip'
  ): BatchImportResult {
    if (!this.verifySecretKey(secretKey)) {
      this.logAudit({
        action: 'IMPORT',
        target: 'students table',
        details: `Failed CSV batch-insert attempt for ${records.length} records: Invalid secret key.`,
        sqlQuery: `-- REJECTED: Invalid Secret Key for CSV batch import`,
        secretKeyUsed: false,
        success: false,
      });
      throw new Error('Access Denied: Invalid Secret Key. A valid secret key is strictly required to batch-insert student records.');
    }

    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];
    const validInsertedRows: Student[] = [];
    const validUpdatedRows: Student[] = [];

    const now = new Date().toISOString();

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 1;

      const trimmedId = (row.studentId || '').trim();
      const trimmedName = (row.fullName || '').trim();
      const trimmedEmail = (row.email || '').trim();

      if (!trimmedId) {
        errors.push(`Row #${rowNum}: Missing student ID.`);
        skippedCount++;
        continue;
      }
      if (!trimmedName) {
        errors.push(`Row #${rowNum} (${trimmedId}): Missing student name.`);
        skippedCount++;
        continue;
      }
      if (!trimmedEmail || !trimmedEmail.includes('@')) {
        errors.push(`Row #${rowNum} (${trimmedId}): Missing or invalid email address.`);
        skippedCount++;
        continue;
      }

      // Check existing by studentId or email
      const existingIndex = this.students.findIndex(
        (s) =>
          s.studentId.toLowerCase() === trimmedId.toLowerCase() ||
          s.email.toLowerCase() === trimmedEmail.toLowerCase()
      );

      const semNum = Math.min(8, Math.max(1, parseInt(String(row.semester || 1), 10) || 1));
      const gpaNum = Number(Math.min(4.0, Math.max(0.0, parseFloat(String(row.gpa ?? 3.0)) || 0.0)).toFixed(2));
      const validStatus = (['Active', 'On Leave', 'Graduated', 'Suspended'].includes(row.status as any)
        ? row.status
        : 'Active') as StudentStatus;

      if (existingIndex !== -1) {
        if (conflictStrategy === 'overwrite') {
          const existing = this.students[existingIndex];
          const updated: Student = {
            ...existing,
            studentId: trimmedId,
            fullName: trimmedName,
            email: trimmedEmail,
            phone: (row.phone || existing.phone || '+1 (555) 000-0000').trim(),
            department: (row.department || existing.department || 'General Engineering').trim(),
            semester: semNum,
            gpa: gpaNum,
            enrollmentDate: row.enrollmentDate || existing.enrollmentDate || now.substring(0, 10),
            status: validStatus,
            address: (row.address || existing.address || 'Campus Dormitory').trim(),
            emergencyContact: (row.emergencyContact || existing.emergencyContact || 'Guardian').trim(),
            updatedAt: now,
          };
          this.students[existingIndex] = updated;
          validUpdatedRows.push(updated);
          updatedCount++;
        } else {
          skippedCount++;
          errors.push(`Row #${rowNum} (${trimmedId}): Skipped (record already exists in MySQL database).`);
        }
      } else {
        const nextId = this.students.length > 0 ? Math.max(...this.students.map((s) => s.id)) + 1 : 1;
        const newStudent: Student = {
          id: nextId,
          studentId: trimmedId,
          fullName: trimmedName,
          email: trimmedEmail,
          phone: (row.phone || '+1 (555) 000-0000').trim(),
          department: (row.department || 'Computer Science').trim(),
          semester: semNum,
          gpa: gpaNum,
          enrollmentDate: row.enrollmentDate || now.substring(0, 10),
          status: validStatus,
          address: (row.address || 'Campus Dormitory Block B').trim(),
          emergencyContact: (row.emergencyContact || 'Guardian').trim(),
          createdAt: now,
          updatedAt: now,
        };
        this.students.push(newStudent);
        validInsertedRows.push(newStudent);
        insertedCount++;
      }
    }

    this.saveStudents();

    // Generate MySQL Batch INSERT / UPDATE Statements
    let sqlQuery = `-- MySQL Workbench Batch Import (${insertedCount} inserted, ${updatedCount} updated, ${skippedCount} skipped)\n`;
    if (validInsertedRows.length > 0) {
      sqlQuery += `INSERT INTO \`students\` (\`id\`, \`student_id\`, \`full_name\`, \`email\`, \`phone\`, \`department\`, \`semester\`, \`gpa\`, \`enrollment_date\`, \`status\`, \`address\`, \`emergency_contact\`, \`created_at\`, \`updated_at\`)\nVALUES\n`;
      sqlQuery += validInsertedRows
        .map(
          (s) =>
            `(${s.id}, '${escapeSQL(s.studentId)}', '${escapeSQL(s.fullName)}', '${escapeSQL(s.email)}', '${escapeSQL(s.phone)}', '${escapeSQL(s.department)}', ${s.semester}, ${s.gpa.toFixed(2)}, '${s.enrollmentDate}', '${s.status}', '${escapeSQL(s.address)}', '${escapeSQL(s.emergencyContact)}', NOW(), NOW())`
        )
        .join(',\n') + ';\n';
    }

    if (validUpdatedRows.length > 0) {
      sqlQuery += validUpdatedRows
        .map(
          (s) =>
            `UPDATE \`students\` SET \`full_name\`='${escapeSQL(s.fullName)}', \`email\`='${escapeSQL(s.email)}', \`department\`='${escapeSQL(s.department)}', \`gpa\`=${s.gpa.toFixed(2)}, \`updated_at\`=NOW() WHERE \`student_id\`='${escapeSQL(s.studentId)}';`
        )
        .join('\n') + '\n';
    }

    this.logAudit({
      action: 'IMPORT',
      target: 'students table',
      details: `Batch CSV import completed: ${insertedCount} inserted, ${updatedCount} updated, ${skippedCount} skipped out of ${records.length} records.`,
      sqlQuery,
      secretKeyUsed: true,
      success: true,
    });

    return {
      success: true,
      insertedCount,
      updatedCount,
      skippedCount,
      totalProcessed: records.length,
      errors,
      sqlQuery,
      message: `Batch import completed: ${insertedCount} inserted, ${updatedCount} updated, ${skippedCount} skipped.`,
    };
  }

  public resetDatabase(secretKey: string | undefined): { success: boolean; sqlQuery: string } {
    if (!this.verifySecretKey(secretKey)) {
      throw new Error('Access Denied: Invalid Secret Key. Resetting the database requires secret key authorization.');
    }

    this.students = [...INITIAL_STUDENTS];
    this.saveStudents();

    const sqlQuery = `TRUNCATE TABLE \`students\`;\n-- Re-seeded ${INITIAL_STUDENTS.length} standard records.`;

    this.logAudit({
      action: 'IMPORT',
      target: 'students table',
      details: 'Database was reset to default seed records.',
      sqlQuery,
      secretKeyUsed: true,
      success: true,
    });

    return { success: true, sqlQuery };
  }

  // MySQL Workbench Dump Generator
  public generateMySQLWorkbenchDump(): string {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    let sql = `-- ====================================================================
-- MySQL Workbench Forward Engineering / Database Export
-- Generated by: Streamlit Student Database Portal
-- Date: ${timestamp}
-- Schema: ${this.config.mysql.database}
-- Compatible with: MySQL 8.0 / MySQL Workbench 8.0+
-- ====================================================================

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: \`${this.config.mysql.database}\`
--
CREATE DATABASE /*!32312 IF NOT EXISTS*/ \`${this.config.mysql.database}\` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE \`${this.config.mysql.database}\`;

--
-- Table structure for table \`students\`
--
DROP TABLE IF EXISTS \`students\`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE \`students\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`student_id\` varchar(20) NOT NULL,
  \`full_name\` varchar(100) NOT NULL,
  \`email\` varchar(100) NOT NULL,
  \`phone\` varchar(25) DEFAULT NULL,
  \`department\` varchar(60) NOT NULL,
  \`semester\` int NOT NULL DEFAULT '1',
  \`gpa\` decimal(3,2) NOT NULL DEFAULT '0.00',
  \`enrollment_date\` date NOT NULL,
  \`status\` enum('Active','On Leave','Graduated','Suspended') NOT NULL DEFAULT 'Active',
  \`address\` text,
  \`emergency_contact\` varchar(100) DEFAULT NULL,
  \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uq_student_id\` (\`student_id\`),
  UNIQUE KEY \`uq_student_email\` (\`email\`),
  KEY \`idx_department\` (\`department\`),
  KEY \`idx_status\` (\`status\`),
  KEY \`idx_gpa\` (\`gpa\`)
) ENGINE=InnoDB AUTO_INCREMENT=${(this.students.length > 0 ? Math.max(...this.students.map((s) => s.id)) + 1 : 1)} DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table \`students\`
--
LOCK TABLES \`students\` WRITE;
/*!40000 ALTER TABLE \`students\` DISABLE KEYS */;
`;

    if (this.students.length > 0) {
      sql += `INSERT INTO \`students\` (\`id\`, \`student_id\`, \`full_name\`, \`email\`, \`phone\`, \`department\`, \`semester\`, \`gpa\`, \`enrollment_date\`, \`status\`, \`address\`, \`emergency_contact\`, \`created_at\`, \`updated_at\`) VALUES\n`;

      const valuesArr = this.students.map((s) => {
        return `(${s.id}, '${escapeSQL(s.studentId)}', '${escapeSQL(s.fullName)}', '${escapeSQL(s.email)}', '${escapeSQL(s.phone)}', '${escapeSQL(s.department)}', ${s.semester}, ${s.gpa.toFixed(2)}, '${s.enrollmentDate}', '${s.status}', '${escapeSQL(s.address)}', '${escapeSQL(s.emergencyContact)}', '${s.createdAt.replace('T', ' ').substring(0, 19)}', '${s.updatedAt.replace('T', ' ').substring(0, 19)}')`;
      });

      sql += valuesArr.join(',\n') + ';\n';
    }

    sql += `/*!40000 ALTER TABLE \`students\` ENABLE KEYS */;
UNLOCK TABLES;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on ${timestamp}
`;

    return sql;
  }

  // Interactive SQL Runner / Workbench Simulator
  public executeSQL(rawQuery: string): SQLQueryResult {
    const startTime = Date.now();
    const cleanQuery = rawQuery.trim();

    if (!cleanQuery) {
      return {
        success: false,
        query: rawQuery,
        executionTimeMs: 0,
        error: 'Empty query provided.',
      };
    }

    const lower = cleanQuery.toLowerCase();

    try {
      // 1. SHOW TABLES
      if (lower.startsWith('show tables') || lower === 'show tables;') {
        const rows = [
          { Tables_in_student_management_db: 'students' },
          { Tables_in_student_management_db: 'audit_logs' },
          { Tables_in_student_management_db: 'system_config' },
        ];
        return {
          success: true,
          query: cleanQuery,
          executionTimeMs: Date.now() - startTime,
          columns: ['Tables_in_student_management_db'],
          rows,
          rowsAffected: rows.length,
        };
      }

      // 2. DESCRIBE / EXPLAIN students
      if (lower.startsWith('describe students') || lower.startsWith('desc students') || lower.startsWith('explain students')) {
        const columns = ['Field', 'Type', 'Null', 'Key', 'Default', 'Extra'];
        const rows = [
          { Field: 'id', Type: 'int', Null: 'NO', Key: 'PRI', Default: 'NULL', Extra: 'auto_increment' },
          { Field: 'student_id', Type: 'varchar(20)', Null: 'NO', Key: 'UNI', Default: 'NULL', Extra: '' },
          { Field: 'full_name', Type: 'varchar(100)', Null: 'NO', Key: '', Default: 'NULL', Extra: '' },
          { Field: 'email', Type: 'varchar(100)', Null: 'NO', Key: 'UNI', Default: 'NULL', Extra: '' },
          { Field: 'phone', Type: 'varchar(25)', Null: 'YES', Key: '', Default: 'NULL', Extra: '' },
          { Field: 'department', Type: 'varchar(60)', Null: 'NO', Key: 'MUL', Default: 'NULL', Extra: '' },
          { Field: 'semester', Type: 'int', Null: 'NO', Key: '', Default: '1', Extra: '' },
          { Field: 'gpa', Type: 'decimal(3,2)', Null: 'NO', Key: 'MUL', Default: '0.00', Extra: '' },
          { Field: 'enrollment_date', Type: 'date', Null: 'NO', Key: '', Default: 'NULL', Extra: '' },
          { Field: 'status', Type: "enum('Active','On Leave','Graduated','Suspended')", Null: 'NO', Key: 'MUL', Default: 'Active', Extra: '' },
          { Field: 'address', Type: 'text', Null: 'YES', Key: '', Default: 'NULL', Extra: '' },
          { Field: 'emergency_contact', Type: 'varchar(100)', Null: 'YES', Key: '', Default: 'NULL', Extra: '' },
          { Field: 'created_at', Type: 'timestamp', Null: 'YES', Key: '', Default: 'CURRENT_TIMESTAMP', Extra: '' },
          { Field: 'updated_at', Type: 'timestamp', Null: 'YES', Key: '', Default: 'CURRENT_TIMESTAMP', Extra: 'DEFAULT_GENERATED on update CURRENT_TIMESTAMP' },
        ];
        return {
          success: true,
          query: cleanQuery,
          executionTimeMs: Date.now() - startTime,
          columns,
          rows,
          rowsAffected: rows.length,
        };
      }

      // 3. SELECT Queries on students
      if (lower.startsWith('select')) {
        let rows = this.students.map((s) => ({
          id: s.id,
          student_id: s.studentId,
          full_name: s.fullName,
          email: s.email,
          phone: s.phone,
          department: s.department,
          semester: s.semester,
          gpa: s.gpa,
          enrollment_date: s.enrollmentDate,
          status: s.status,
          address: s.address,
          emergency_contact: s.emergencyContact,
          created_at: s.createdAt,
          updated_at: s.updatedAt,
        }));

        // Handle COUNT(*) or Aggregates
        if (lower.includes('count(*)') && lower.includes('group by department')) {
          const counts: Record<string, number> = {};
          this.students.forEach((s) => {
            counts[s.department] = (counts[s.department] || 0) + 1;
          });
          const aggRows = Object.entries(counts).map(([dept, count]) => ({
            department: dept,
            'count(*)': count,
          }));
          return {
            success: true,
            query: cleanQuery,
            executionTimeMs: Date.now() - startTime,
            columns: ['department', 'count(*)'],
            rows: aggRows,
            rowsAffected: aggRows.length,
          };
        }

        if (lower.includes('count(*)')) {
          const aggRows = [{ 'count(*)': rows.length }];
          return {
            success: true,
            query: cleanQuery,
            executionTimeMs: Date.now() - startTime,
            columns: ['count(*)'],
            rows: aggRows,
            rowsAffected: 1,
          };
        }

        if (lower.includes('avg(gpa)')) {
          const avg = rows.reduce((acc, r) => acc + (r.gpa || 0), 0) / (rows.length || 1);
          const aggRows = [{ 'avg(gpa)': Number(avg.toFixed(2)) }];
          return {
            success: true,
            query: cleanQuery,
            executionTimeMs: Date.now() - startTime,
            columns: ['avg(gpa)'],
            rows: aggRows,
            rowsAffected: 1,
          };
        }

        // Basic WHERE filters support
        if (lower.includes('where')) {
          const wherePart = cleanQuery.substring(lower.indexOf('where') + 5).split(/order by|limit|;/i)[0].trim();
          
          if (wherePart.toLowerCase().includes('status =') || wherePart.toLowerCase().includes("status='")) {
            const match = wherePart.match(/status\s*=\s*['"]?([a-zA-Z\s]+)['"]?/i);
            if (match && match[1]) {
              const val = match[1].trim();
              rows = rows.filter((r) => r.status.toLowerCase() === val.toLowerCase());
            }
          }

          if (wherePart.toLowerCase().includes('department =') || wherePart.toLowerCase().includes("department='")) {
            const match = wherePart.match(/department\s*=\s*['"]?([^'"]+)['"]?/i);
            if (match && match[1]) {
              const val = match[1].trim();
              rows = rows.filter((r) => r.department.toLowerCase() === val.toLowerCase());
            }
          }

          if (wherePart.toLowerCase().includes('gpa >=')) {
            const match = wherePart.match(/gpa\s*>=\s*([0-9.]+)/i);
            if (match && match[1]) {
              const minGpa = parseFloat(match[1]);
              rows = rows.filter((r) => r.gpa >= minGpa);
            }
          } else if (wherePart.toLowerCase().includes('gpa >')) {
            const match = wherePart.match(/gpa\s*>\s*([0-9.]+)/i);
            if (match && match[1]) {
              const minGpa = parseFloat(match[1]);
              rows = rows.filter((r) => r.gpa > minGpa);
            }
          }

          if (wherePart.toLowerCase().includes('semester =')) {
            const match = wherePart.match(/semester\s*=\s*([0-9]+)/i);
            if (match && match[1]) {
              const sem = parseInt(match[1], 10);
              rows = rows.filter((r) => r.semester === sem);
            }
          }
        }

        // ORDER BY
        if (lower.includes('order by')) {
          const orderPart = cleanQuery.substring(lower.indexOf('order by') + 8).split(/limit|;/i)[0].trim();
          const isDesc = orderPart.toLowerCase().includes('desc');
          const col = orderPart.split(/\s+/)[0].replace(/[`',]/g, '').trim();
          if (col && rows.length > 0 && (col in rows[0])) {
            rows.sort((a: any, b: any) => {
              if (a[col] < b[col]) return isDesc ? 1 : -1;
              if (a[col] > b[col]) return isDesc ? -1 : 1;
              return 0;
            });
          }
        }

        // LIMIT
        if (lower.includes('limit')) {
          const match = lower.match(/limit\s+([0-9]+)/);
          if (match && match[1]) {
            const lim = parseInt(match[1], 10);
            rows = rows.slice(0, lim);
          }
        }

        const columns = rows.length > 0 ? Object.keys(rows[0]) : ['id', 'student_id', 'full_name', 'department', 'gpa', 'status'];

        return {
          success: true,
          query: cleanQuery,
          executionTimeMs: Date.now() - startTime,
          columns,
          rows,
          rowsAffected: rows.length,
        };
      }

      // 4. INSERT INTO students
      if (lower.startsWith('insert into')) {
        return {
          success: true,
          query: cleanQuery,
          executionTimeMs: Date.now() - startTime,
          rowsAffected: 1,
        };
      }

      // Default statement acknowledgement
      return {
        success: true,
        query: cleanQuery,
        executionTimeMs: Date.now() - startTime,
        rowsAffected: 1,
      };
    } catch (err: any) {
      return {
        success: false,
        query: cleanQuery,
        executionTimeMs: Date.now() - startTime,
        error: err.message || 'SQL execution failed.',
      };
    }
  }

  // Live MySQL Connection Test
  public async testLiveMySQLConnection(config: MySQLConfig): Promise<{ success: boolean; message: string; version?: string }> {
    try {
      const conn = await mysql.createConnection({
        host: config.host || 'localhost',
        port: Number(config.port) || 3306,
        user: config.user || 'root',
        password: config.password || '',
        database: config.database || 'student_management_db',
        connectTimeout: 4000,
      });

      const [rows] = await conn.execute('SELECT VERSION() as version');
      const version = Array.isArray(rows) && rows[0] ? (rows[0] as any).version : '8.0+';
      await conn.end();

      this.updateMySQLConfig({ ...config, connected: true, lastTested: new Date().toISOString() });
      return {
        success: true,
        message: `Successfully connected to MySQL Server (${version}) at ${config.host}:${config.port}!`,
        version,
      };
    } catch (err: any) {
      this.updateMySQLConfig({ ...config, connected: false, lastTested: new Date().toISOString() });
      return {
        success: false,
        message: `Connection failed: ${err.message || 'Host unreachable or incorrect credentials'}. Note: If your MySQL server runs on localhost of your machine, you can export and run the .sql script in MySQL Workbench directly.`,
      };
    }
  }
}

function escapeSQL(val: string): string {
  if (!val) return '';
  return val.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
    switch (char) {
      case '\0':
        return '\\0';
      case '\x08':
        return '\\b';
      case '\x09':
        return '\\t';
      case '\x1a':
        return '\\z';
      case '\n':
        return '\\n';
      case '\r':
        return '\\r';
      case '"':
      case "'":
      case '\\':
      case '%':
        return '\\' + char;
      default:
        return char;
    }
  });
}

export const dbService = new DatabaseService();
