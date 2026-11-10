import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Database,
  Lock,
  Copy,
  Check,
  ArrowRight,
  RefreshCw,
  X,
  FileCheck,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { CSVStudentRow, BatchImportResult, Student } from '../types/student.ts';
import { batchImportStudentsApi } from '../utils/api.ts';
import { triggerStreamlitBalloons } from '../utils/balloons.ts';

interface ImportDataViewProps {
  existingStudents: Student[];
  unlockedKey: string | null;
  onSuccess: () => void;
  onNavigateDirectory: () => void;
  onOpenSecretModal: () => void;
}

export const ImportDataView: React.FC<ImportDataViewProps> = ({
  existingStudents,
  unlockedKey,
  onSuccess,
  onNavigateDirectory,
  onOpenSecretModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<CSVStudentRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [conflictStrategy, setConflictStrategy] = useState<'skip' | 'overwrite'>('skip');
  const [secretKeyInput, setSecretKeyInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<BatchImportResult | null>(null);
  const [copiedQuery, setCopiedQuery] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Sample CSV template content
  const sampleCsvContent = `student_id,full_name,email,phone,department,semester,gpa,enrollment_date,status,address,emergency_contact
STU-2025-101,Maya Patel,maya.patel@university.edu,+1 (555) 321-4567,Computer Science,2,3.88,2024-08-15,Active,Campus Hall 4A,Suresh Patel (+1 555-999-1111)
STU-2025-102,Lucas Silva,lucas.silva@university.edu,+1 (555) 432-5678,Data Science,4,3.75,2023-08-20,Active,88 University Ave,Ana Silva (+1 555-888-2222)
STU-2025-103,Olivia Taylor,olivia.t@university.edu,+1 (555) 543-6789,Mechanical Engineering,6,3.60,2022-08-22,Active,14 Elm St Apt 2,Robert Taylor (+1 555-777-3333)
STU-2025-104,Rohan Gupta,rohan.gupta@university.edu,+1 (555) 654-7890,Electronics & Communication,3,3.42,2023-01-10,On Leave,32 College St,Vikram Gupta (+1 555-666-4444)
STU-2025-105,Fatima Al-Mansoor,fatima.m@university.edu,+1 (555) 765-8901,Business Analytics,1,3.95,2025-01-15,Active,Campus Dorm C,Tariq Al-Mansoor (+1 555-555-7777)`;

  const handleDownloadSample = () => {
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'students_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // CSV text parsing
  const parseCSVText = (text: string) => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length < 2) {
      setParseErrors(['CSV file must contain a header row and at least one student data row.']);
      setParsedRows([]);
      return;
    }

    // Helper to split CSV row respecting quotes
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^"|"$/g, ''));
      return result;
    };

    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/[\s_-]/g, ''));

    // Map headers to field names
    const getHeaderIdx = (keys: string[]): number => {
      return headers.findIndex((h) => keys.includes(h));
    };

    const idIdx = getHeaderIdx(['studentid', 'id', 'rollno', 'roll', 'matriculationno']);
    const nameIdx = getHeaderIdx(['fullname', 'name', 'studentname']);
    const emailIdx = getHeaderIdx(['email', 'emailaddress', 'mail']);
    const phoneIdx = getHeaderIdx(['phone', 'phonenumber', 'contact', 'mobile']);
    const deptIdx = getHeaderIdx(['department', 'dept', 'major', 'program', 'branch']);
    const semIdx = getHeaderIdx(['semester', 'sem', 'currentsemester', 'term']);
    const gpaIdx = getHeaderIdx(['gpa', 'cgpa', 'grade', 'score']);
    const dateIdx = getHeaderIdx(['enrollmentdate', 'date', 'enrolleddate', 'admissiondate']);
    const statusIdx = getHeaderIdx(['status', 'enrollmentstatus', 'state']);
    const addrIdx = getHeaderIdx(['address', 'campusaddress', 'residence']);
    const emergIdx = getHeaderIdx(['emergencycontact', 'emergency', 'guardian', 'parentcontact']);

    if (idIdx === -1 && nameIdx === -1 && emailIdx === -1) {
      setParseErrors(['Unable to recognize standard CSV columns. Please include "student_id", "full_name", and "email".']);
      setParsedRows([]);
      return;
    }

    const rows: CSVStudentRow[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values = parseCSVLine(line);

      const studentId = idIdx !== -1 && values[idIdx] ? values[idIdx] : `STU-2025-${100 + i}`;
      const fullName = nameIdx !== -1 && values[nameIdx] ? values[nameIdx] : '';
      const email = emailIdx !== -1 && values[emailIdx] ? values[emailIdx] : '';
      const phone = phoneIdx !== -1 && values[phoneIdx] ? values[phoneIdx] : '+1 (555) 000-0000';
      const department = deptIdx !== -1 && values[deptIdx] ? values[deptIdx] : 'Computer Science';
      const semester = semIdx !== -1 && values[semIdx] ? parseInt(values[semIdx], 10) || 1 : 1;
      const gpa = gpaIdx !== -1 && values[gpaIdx] ? parseFloat(values[gpaIdx]) || 3.0 : 3.0;
      const enrollmentDate = dateIdx !== -1 && values[dateIdx] ? values[dateIdx] : new Date().toISOString().substring(0, 10);
      const status = statusIdx !== -1 && values[statusIdx] ? values[statusIdx] : 'Active';
      const address = addrIdx !== -1 && values[addrIdx] ? values[addrIdx] : 'Campus Dormitory Block B';
      const emergencyContact = emergIdx !== -1 && values[emergIdx] ? values[emergIdx] : 'Guardian Contact';

      if (!fullName) {
        errors.push(`Row #${i}: Missing full name`);
      }
      if (!email || !email.includes('@')) {
        errors.push(`Row #${i}: Invalid email address "${email}"`);
      }

      rows.push({
        studentId,
        fullName,
        email,
        phone,
        department,
        semester,
        gpa,
        enrollmentDate,
        status,
        address,
        emergencyContact,
      });
    }

    setParsedRows(rows);
    setParseErrors(errors);
  };

  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + ' KB');
    setSubmitError(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      parseCSVText(content);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    setFileName(null);
    setFileSize(null);
    setParsedRows([]);
    setParseErrors([]);
    setSubmitError(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmitBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const effectiveKey = unlockedKey || secretKeyInput.trim();
    if (!effectiveKey) {
      setSubmitError('Secret Key is strictly required to batch-insert records into the MySQL database.');
      return;
    }

    if (parsedRows.length === 0) {
      setSubmitError('No valid rows found in CSV file.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await batchImportStudentsApi(parsedRows, effectiveKey, conflictStrategy);
      setImportResult(res);
      triggerStreamlitBalloons();
      onSuccess();
    } catch (err: any) {
      setSubmitError(err.message || 'Batch import failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopySQL = () => {
    if (importResult?.sqlQuery) {
      navigator.clipboard.writeText(importResult.sqlQuery);
      setCopiedQuery(true);
      setTimeout(() => setCopiedQuery(false), 2000);
    }
  };

  // Calculate conflict counts
  const conflictCount = parsedRows.filter((row) =>
    existingStudents.some(
      (s) =>
        s.studentId.toLowerCase() === row.studentId.toLowerCase() ||
        s.email.toLowerCase() === row.email.toLowerCase()
    )
  ).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Streamlit Title Block */}
      <div className="border-b border-[#E6EAF1] pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#808495]">
              <span>st.file_uploader("Upload CSV", type=['csv'])</span>
              <span>•</span>
              <span className="text-[#9C27B0] font-semibold">Batch Database Insert</span>
            </div>
            <h2 className="text-2xl font-bold text-[#31333F] flex items-center gap-2">
              <UploadCloud className="w-6 h-6 text-[#9C27B0]" />
              <span>Import Student Records (CSV)</span>
            </h2>
            <p className="text-xs text-[#808495] mt-1">
              Upload a CSV file to batch-insert student records into the MySQL Workbench database. Strict authentication with Secret Key required.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadSample}
            className="px-3 py-1.5 bg-[#F0F2F6] hover:bg-[#E6EAF1] text-[#31333F] text-xs font-medium rounded border border-[#D6DADE] flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5 text-[#00618A]" />
            <span>Download CSV Template</span>
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {importResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-bold text-emerald-950 text-sm">
                  Batch Insert Succeeded! (st.success)
                </h4>
                <p className="text-xs text-emerald-800">
                  {importResult.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1 bg-white hover:bg-emerald-100 text-emerald-800 text-xs font-medium rounded border border-emerald-300"
              >
                Upload Another File
              </button>
              <button
                type="button"
                onClick={onNavigateDirectory}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded flex items-center gap-1 shadow-xs"
              >
                <span>View Directory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-white p-2.5 rounded border border-emerald-200 text-center">
              <span className="text-[#808495] block text-[11px]">Inserted</span>
              <span className="text-base font-bold text-emerald-700">{importResult.insertedCount}</span>
            </div>
            <div className="bg-white p-2.5 rounded border border-emerald-200 text-center">
              <span className="text-[#808495] block text-[11px]">Updated</span>
              <span className="text-base font-bold text-amber-700">{importResult.updatedCount}</span>
            </div>
            <div className="bg-white p-2.5 rounded border border-emerald-200 text-center">
              <span className="text-[#808495] block text-[11px]">Skipped</span>
              <span className="text-base font-bold text-gray-600">{importResult.skippedCount}</span>
            </div>
          </div>

          {/* Executed Batch SQL Block */}
          {importResult.sqlQuery && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-[#808495]">
                <span className="flex items-center gap-1 font-mono text-[#00618A]">
                  <Database className="w-3.5 h-3.5" />
                  Executed MySQL Batch Statement:
                </span>
                <button
                  type="button"
                  onClick={handleCopySQL}
                  className="flex items-center gap-1 text-[#31333F] hover:text-[#FF4B4B]"
                >
                  {copiedQuery ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedQuery ? 'Copied!' : 'Copy Batch SQL'}</span>
                </button>
              </div>
              <pre className="p-3 bg-[#1E1E1E] text-emerald-400 rounded text-xs font-mono overflow-x-auto whitespace-pre-wrap border border-gray-800 max-h-48">
                {importResult.sqlQuery}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Streamlit File Uploader Box: st.file_uploader */}
      <div className="bg-white border border-[#E6EAF1] rounded-lg p-6 shadow-xs space-y-4">
        <label className="block text-xs font-semibold text-[#31333F] uppercase tracking-wider">
          Upload CSV Dataset (st.file_uploader)
        </label>

        {!fileName ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragActive
                ? 'border-[#9C27B0] bg-[#9C27B0]/5'
                : 'border-[#D6DADE] hover:border-[#9C27B0] hover:bg-[#F8F9FB]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv,text/plain"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-[#9C27B0]/10 text-[#9C27B0] flex items-center justify-center mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-[#31333F]">
              Drag and drop your CSV file here, or <span className="text-[#9C27B0] underline">browse</span>
            </p>
            <p className="text-xs text-[#808495] mt-1">
              Supports CSV files with columns: <code className="bg-[#F0F2F6] px-1 py-0.5 rounded font-mono">student_id</code>, <code className="bg-[#F0F2F6] px-1 py-0.5 rounded font-mono">full_name</code>, <code className="bg-[#F0F2F6] px-1 py-0.5 rounded font-mono">email</code>, <code className="bg-[#F0F2F6] px-1 py-0.5 rounded font-mono">department</code>, <code className="bg-[#F0F2F6] px-1 py-0.5 rounded font-mono">gpa</code>
            </p>
          </div>
        ) : (
          <div className="p-4 bg-[#F8F9FB] border border-[#E6EAF1] rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-[#31333F]">{fileName}</span>
                <p className="text-[11px] text-[#808495]">{fileSize} • {parsedRows.length} rows detected</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-[#808495] hover:text-[#FF4B4B] rounded hover:bg-white transition-colors"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Parsing Error Messages */}
        {parseErrors.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
              <span>CSV Notice ({parseErrors.length} warnings):</span>
            </div>
            <ul className="list-disc list-inside text-[11px] text-amber-800 pl-1 max-h-24 overflow-y-auto">
              {parseErrors.slice(0, 5).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
              {parseErrors.length > 5 && <li>...and {parseErrors.length - 5} more issues</li>}
            </ul>
          </div>
        )}
      </div>

      {/* CSV Data Preview Table (st.dataframe) */}
      {parsedRows.length > 0 && (
        <div className="bg-white border border-[#E6EAF1] rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E6EAF1] pb-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-[#808495]">
                <span>st.dataframe(preview)</span>
                <span>•</span>
                <span className="text-[#31333F] font-bold">{parsedRows.length} Records Loaded</span>
              </div>
              <h3 className="text-base font-bold text-[#31333F]">Data Preview & Conflict Analysis</h3>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-2 text-xs">
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                {parsedRows.length - conflictCount} New
              </span>
              {conflictCount > 0 && (
                <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-medium">
                  {conflictCount} Existing in DB
                </span>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto max-h-80 border border-[#E6EAF1] rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F8F9FB] sticky top-0 border-b border-[#E6EAF1] text-[#555] font-semibold">
                <tr>
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">Student ID</th>
                  <th className="py-2 px-3">Full Name</th>
                  <th className="py-2 px-3">Email</th>
                  <th className="py-2 px-3">Department</th>
                  <th className="py-2 px-3">Sem</th>
                  <th className="py-2 px-3">GPA</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">DB Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EAF1] font-mono">
                {parsedRows.map((row, idx) => {
                  const isExisting = existingStudents.some(
                    (s) =>
                      s.studentId.toLowerCase() === row.studentId.toLowerCase() ||
                      s.email.toLowerCase() === row.email.toLowerCase()
                  );
                  return (
                    <tr key={idx} className={`hover:bg-[#F8F9FB] ${isExisting ? 'bg-amber-50/40' : ''}`}>
                      <td className="py-2 px-3 text-[#808495]">{idx + 1}</td>
                      <td className="py-2 px-3 font-semibold text-[#00618A]">{row.studentId}</td>
                      <td className="py-2 px-3 font-sans font-medium text-[#31333F]">{row.fullName}</td>
                      <td className="py-2 px-3 text-[#555]">{row.email}</td>
                      <td className="py-2 px-3 font-sans text-[#555]">{row.department}</td>
                      <td className="py-2 px-3 text-[#31333F]">{row.semester}</td>
                      <td className="py-2 px-3 font-bold text-emerald-700">
                        {typeof row.gpa === 'number' ? row.gpa.toFixed(2) : row.gpa}
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-[11px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-sans">
                          {row.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        {isExisting ? (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-sans font-medium">
                            Existing
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-sans font-medium">
                            New
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Conflict Resolution Strategy (st.radio) */}
          <div className="bg-[#F8F9FB] border border-[#E6EAF1] rounded-lg p-4 space-y-2">
            <label className="block text-xs font-semibold text-[#31333F]">
              Conflict Resolution for Duplicate Records (st.radio)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label
                onClick={() => setConflictStrategy('skip')}
                className={`p-3 rounded-lg border cursor-pointer flex items-start gap-2.5 transition-colors ${
                  conflictStrategy === 'skip'
                    ? 'border-[#9C27B0] bg-[#9C27B0]/5 text-[#31333F]'
                    : 'border-[#D6DADE] bg-white text-[#555]'
                }`}
              >
                <input
                  type="radio"
                  name="conflictStrategy"
                  checked={conflictStrategy === 'skip'}
                  onChange={() => setConflictStrategy('skip')}
                  className="mt-0.5 accent-[#9C27B0]"
                />
                <div>
                  <span className="font-bold block">Skip Existing Records (Default)</span>
                  <span className="text-[11px] text-[#808495]">
                    Only insert brand new student records. Existing IDs/emails will be ignored.
                  </span>
                </div>
              </label>

              <label
                onClick={() => setConflictStrategy('overwrite')}
                className={`p-3 rounded-lg border cursor-pointer flex items-start gap-2.5 transition-colors ${
                  conflictStrategy === 'overwrite'
                    ? 'border-[#9C27B0] bg-[#9C27B0]/5 text-[#31333F]'
                    : 'border-[#D6DADE] bg-white text-[#555]'
                }`}
              >
                <input
                  type="radio"
                  name="conflictStrategy"
                  checked={conflictStrategy === 'overwrite'}
                  onChange={() => setConflictStrategy('overwrite')}
                  className="mt-0.5 accent-[#9C27B0]"
                />
                <div>
                  <span className="font-bold block">Update / Overwrite Existing (Upsert)</span>
                  <span className="text-[11px] text-[#808495]">
                    Existing records matching Student ID or Email will be overwritten with the new CSV values.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Secret Key Authorization Gate */}
          <form onSubmit={handleSubmitBatch} className="space-y-4 pt-2">
            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {!unlockedKey ? (
              <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-lg space-y-2">
                <label className="block text-xs font-bold text-purple-950 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-purple-700" />
                  <span>Enter Secret Key to Authorize Batch Insert <span className="text-red-500">*</span></span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    required
                    placeholder="Enter Secret Key..."
                    value={secretKeyInput}
                    onChange={(e) => setSecretKeyInput(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-purple-300 rounded focus:ring-1 focus:ring-[#9C27B0]"
                  />
                  <button
                    type="button"
                    onClick={() => setSecretKeyInput('ADMIN@2025')}
                    className="px-3 py-2 bg-white text-xs font-medium text-purple-900 border border-purple-300 rounded hover:bg-purple-100 shrink-0"
                  >
                    Fill Default
                  </button>
                </div>
                <div className="flex justify-between items-center text-[11px] text-purple-800">
                  <span>Default Key: <code className="font-mono bg-white px-1 py-0.5 rounded border border-purple-200">ADMIN@2025</code></span>
                  <button
                    type="button"
                    onClick={onOpenSecretModal}
                    className="underline hover:text-purple-950"
                  >
                    Unlock Session Instead
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium">Admin Session Authenticated: Ready to batch-commit {parsedRows.length} records.</span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                  AUTHORIZED
                </span>
              </div>
            )}

            {/* Commit Button */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-[#808495] flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-[#00618A]" />
                Target: <code className="font-mono text-[#00618A]">students</code> table in MySQL Workbench
              </span>

              <button
                type="submit"
                disabled={isSubmitting || parsedRows.length === 0}
                className="px-6 py-2.5 bg-[#9C27B0] hover:bg-[#831fa8] text-white text-xs font-bold rounded transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Committing to MySQL...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Batch Insert ({parsedRows.length}) into MySQL Database</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
