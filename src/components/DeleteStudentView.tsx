import React, { useState, useEffect } from 'react';
import {
  UserX,
  AlertTriangle,
  CheckCircle,
  Copy,
  Check,
  AlertCircle,
  Database,
  Lock,
  Trash2,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { Student } from '../types/student.ts';
import { deleteStudentApi, resetDatabaseApi } from '../utils/api.ts';
import { StatusPill } from './StudentsDirectoryView.tsx';

interface DeleteStudentViewProps {
  students: Student[];
  preselectedStudent: Student | null;
  unlockedKey: string | null;
  onSuccess: () => void;
  onOpenSecretModal: () => void;
  onNavigateDirectory: () => void;
}

export const DeleteStudentView: React.FC<DeleteStudentViewProps> = ({
  students,
  preselectedStudent,
  unlockedKey,
  onSuccess,
  onOpenSecretModal,
  onNavigateDirectory,
}) => {
  const [selectedId, setSelectedId] = useState<number>(
    preselectedStudent?.id || (students.length > 0 ? students[0].id : 0)
  );

  const currentStudent = students.find((s) => s.id === selectedId);

  const [secretKeyInput, setSecretKeyInput] = useState<string>('');
  const [confirmed, setConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deletedQuery, setDeletedQuery] = useState<string | null>(null);
  const [deletedStudent, setDeletedStudent] = useState<Student | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [copiedQuery, setCopiedQuery] = useState(false);

  useEffect(() => {
    if (preselectedStudent) {
      setSelectedId(preselectedStudent.id);
    }
  }, [preselectedStudent]);

  useEffect(() => {
    setDeletedQuery(null);
    setDeletedStudent(null);
    setResetSuccess(null);
    setErrorMsg(null);
    setConfirmed(false);
  }, [selectedId]);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const effectiveKey = unlockedKey || secretKeyInput.trim();
    if (!effectiveKey) {
      setErrorMsg('Secret Key is strictly required to delete student records.');
      return;
    }

    if (!confirmed) {
      setErrorMsg('Please tick the confirmation checkbox to authorize deletion.');
      return;
    }

    setIsDeleting(true);

    try {
      const res = await deleteStudentApi(selectedId, effectiveKey);
      setDeletedQuery(res.sqlQuery);
      setDeletedStudent(res.deleted);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete student record.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetDatabase = async () => {
    const effectiveKey = unlockedKey || secretKeyInput.trim();
    if (!effectiveKey) {
      setErrorMsg('Secret Key is required to reset database.');
      return;
    }

    if (!window.confirm('Are you sure you want to restore the student database to default records?')) {
      return;
    }

    setIsResetting(true);
    setErrorMsg(null);

    try {
      const res = await resetDatabaseApi(effectiveKey);
      setResetSuccess(res.message);
      setDeletedQuery(res.sqlQuery);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset database.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleCopySQL = () => {
    if (deletedQuery) {
      navigator.clipboard.writeText(deletedQuery);
      setCopiedQuery(true);
      setTimeout(() => setCopiedQuery(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Title */}
      <div className="border-b border-[#E6EAF1] pb-3">
        <div className="flex items-center gap-1.5 text-xs font-mono text-[#808495]">
          <span>st.warning("Destructive Action")</span>
          <span>•</span>
          <span className="text-[#FF4B4B] font-semibold">🔐 Secret Key Gate</span>
        </div>
        <h2 className="text-2xl font-bold text-[#31333F] flex items-center gap-2">
          <UserX className="w-6 h-6 text-[#FF4B4B]" />
          <span>Delete Student Record</span>
        </h2>
        <p className="text-xs text-[#808495] mt-1">
          Permanently remove student enrollment from the MySQL Workbench database. Protected strictly by Secret Key verification.
        </p>
      </div>

      {/* Streamlit Warning Alert */}
      <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-sm text-amber-950">
            st.warning: Irreversible Database Mutation
          </div>
          <p className="mt-1 text-amber-800 leading-relaxed">
            Executing a DELETE statement permanently removes the selected student from the <code className="bg-white/80 px-1 py-0.5 rounded font-mono">students</code> table in MySQL Workbench. Ensure you have proper administrative clearance and the Secret Key.
          </p>
        </div>
      </div>

      {/* Success Notification & Executed SQL */}
      {deletedStudent && deletedQuery && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>Student Record Deleted Successfully from MySQL!</span>
            </div>
            <button
              onClick={onNavigateDirectory}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded flex items-center gap-1 shadow-xs"
            >
              <span>View in Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-emerald-800">
            Removed <strong>{deletedStudent.fullName}</strong> ({deletedStudent.studentId}) from <strong>{deletedStudent.department}</strong>.
          </p>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[#808495]">
              <span className="flex items-center gap-1 font-mono text-[#00618A]">
                <Database className="w-3 h-3" />
                Executed MySQL DELETE Statement:
              </span>
              <button
                onClick={handleCopySQL}
                className="flex items-center gap-1 text-[#31333F] hover:text-[#FF4B4B]"
              >
                {copiedQuery ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedQuery ? 'Copied!' : 'Copy SQL'}</span>
              </button>
            </div>
            <pre className="p-3 bg-[#1E1E1E] text-emerald-400 rounded text-xs font-mono overflow-x-auto whitespace-pre-wrap border border-gray-800">
              {deletedQuery}
            </pre>
          </div>
        </div>
      )}

      {/* Reset Database Success Notification */}
      {resetSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{resetSuccess}</span>
          </div>
          <button
            onClick={onNavigateDirectory}
            className="text-emerald-700 underline font-medium"
          >
            Go to Directory
          </button>
        </div>
      )}

      {/* Student Selector */}
      <div className="bg-white border border-[#E6EAF1] rounded-lg p-5 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#31333F] mb-1.5">
            Select Student Record to Delete (st.selectbox)
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(parseInt(e.target.value, 10))}
            className="w-full text-xs px-3 py-2 bg-white border border-[#D6DADE] rounded font-medium focus:ring-1 focus:ring-[#FF4B4B]"
          >
            {students.length === 0 ? (
              <option value="0">No students available in database</option>
            ) : (
              students.map((s) => (
                <option key={s.id} value={s.id}>
                  #{s.id} • {s.studentId} - {s.fullName} ({s.department}) - GPA: {s.gpa.toFixed(2)}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Selected Student Profile Preview */}
        {currentStudent && (
          <div className="p-4 bg-[#F8F9FB] border border-[#E6EAF1] rounded-lg space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-mono text-[#00618A] font-semibold">
                  {currentStudent.studentId}
                </span>
                <h4 className="text-base font-bold text-[#31333F]">{currentStudent.fullName}</h4>
                <p className="text-xs text-[#808495]">{currentStudent.email} • {currentStudent.phone}</p>
              </div>
              <StatusPill status={currentStudent.status} />
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-[#E6EAF1]">
              <div>
                <span className="text-[#808495] block text-[11px]">Department</span>
                <span className="font-semibold text-[#31333F]">{currentStudent.department}</span>
              </div>
              <div>
                <span className="text-[#808495] block text-[11px]">Semester</span>
                <span className="font-semibold text-[#31333F]">Semester {currentStudent.semester}</span>
              </div>
              <div>
                <span className="text-[#808495] block text-[11px]">CGPA</span>
                <span className="font-bold text-[#31333F]">{currentStudent.gpa.toFixed(2)} / 4.0</span>
              </div>
            </div>

            {/* SQL Query Preview */}
            <div className="pt-2">
              <span className="text-[11px] text-[#808495] block mb-1">Target MySQL Command:</span>
              <code className="block p-2 bg-[#1E1E1E] text-red-400 rounded text-xs font-mono">
                DELETE FROM `students` WHERE `id` = {currentStudent.id};
              </code>
            </div>
          </div>
        )}

        {/* Delete Form with Secret Key */}
        {currentStudent && (
          <form onSubmit={handleDelete} className="space-y-4 pt-2">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Secret Key Input if not unlocked */}
            {!unlockedKey ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-2">
                <label className="block text-xs font-bold text-red-950 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-red-700" />
                  <span>Enter Secret Key to Authorize Deletion <span className="text-red-500">*</span></span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    required
                    placeholder="Enter Secret Key..."
                    value={secretKeyInput}
                    onChange={(e) => setSecretKeyInput(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-red-300 rounded focus:ring-1 focus:ring-red-500"
                  />
                  <button
                    type="button"
                    onClick={() => setSecretKeyInput('ADMIN@2025')}
                    className="px-3 py-2 bg-white text-xs font-medium text-red-900 border border-red-300 rounded hover:bg-red-100 shrink-0"
                  >
                    Fill Default
                  </button>
                </div>
                <div className="flex justify-between items-center text-[11px] text-red-700">
                  <span>Default Key: <code className="font-mono bg-white px-1 py-0.5 rounded border border-red-200">ADMIN@2025</code></span>
                  <button
                    type="button"
                    onClick={onOpenSecretModal}
                    className="underline hover:text-red-900"
                  >
                    Unlock Session Instead
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center justify-between">
                <span>Session Key active: Deletion authorized for current admin.</span>
                <span className="font-mono font-bold text-[11px]">ACTIVE</span>
              </div>
            )}

            {/* Checkbox confirmation */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="deleteConfirm"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="rounded border-[#D6DADE] text-[#FF4B4B] focus:ring-[#FF4B4B]"
              />
              <label htmlFor="deleteConfirm" className="text-xs text-[#31333F] cursor-pointer font-medium">
                I confirm that I want to permanently delete this student record from the MySQL database.
              </label>
            </div>

            {/* Submit button */}
            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={isDeleting || !confirmed}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded transition-colors flex items-center gap-2 shadow-xs disabled:opacity-40"
              >
                {isDeleting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Executing DELETE...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Record Permanently</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Database Reset Section (Streamlit st.expander) */}
      <div className="border border-[#E6EAF1] bg-[#F8F9FB] rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-[#31333F] flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-[#808495]" />
              <span>Reset Database to Standard Seed Data</span>
            </h4>
            <p className="text-xs text-[#808495] mt-0.5">
              Restore the original 8 sample student records across all engineering departments. (Requires Secret Key).
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetDatabase}
            disabled={isResetting}
            className="px-3.5 py-1.5 bg-white hover:bg-gray-100 text-[#31333F] text-xs font-medium rounded border border-[#D6DADE] transition-colors flex items-center gap-1.5 shadow-xs shrink-0 disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-[#00618A] ${isResetting ? 'animate-spin' : ''}`} />
            <span>Reset to Default</span>
          </button>
        </div>
      </div>
    </div>
  );
};
