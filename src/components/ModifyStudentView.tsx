import React, { useState, useEffect } from 'react';
import {
  Edit,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  Copy,
  Check,
  AlertCircle,
  Database,
  Lock,
  ArrowRight,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { Student, StudentFormData, StudentStatus } from '../types/student.ts';
import { updateStudentApi } from '../utils/api.ts';
import { triggerStreamlitBalloons } from '../utils/balloons.ts';

const DEPARTMENTS = [
  'Computer Science',
  'Data Science',
  'Information Technology',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Business Analytics',
];

interface ModifyStudentViewProps {
  students: Student[];
  preselectedStudent: Student | null;
  unlockedKey: string | null;
  onSuccess: () => void;
  onOpenSecretModal: () => void;
  onNavigateDirectory: () => void;
}

export const ModifyStudentView: React.FC<ModifyStudentViewProps> = ({
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

  const [formData, setFormData] = useState<StudentFormData>({
    studentId: '',
    fullName: '',
    email: '',
    phone: '',
    department: 'Computer Science',
    semester: 1,
    gpa: 0,
    enrollmentDate: '',
    status: 'Active',
    address: '',
    emergencyContact: '',
  });

  const [secretKeyInput, setSecretKeyInput] = useState<string>('');
  const [remark, setRemark] = useState<string>('Standard administrative record update');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [updatedSqlQuery, setUpdatedSqlQuery] = useState<string | null>(null);
  const [updatedStudentRecord, setUpdatedStudentRecord] = useState<Student | null>(null);
  const [copiedQuery, setCopiedQuery] = useState(false);

  // Sync form when student changes
  useEffect(() => {
    if (currentStudent) {
      setFormData({
        studentId: currentStudent.studentId,
        fullName: currentStudent.fullName,
        email: currentStudent.email,
        phone: currentStudent.phone,
        department: currentStudent.department,
        semester: currentStudent.semester,
        gpa: currentStudent.gpa,
        enrollmentDate: currentStudent.enrollmentDate,
        status: currentStudent.status,
        address: currentStudent.address,
        emergencyContact: currentStudent.emergencyContact,
      });
      setUpdatedSqlQuery(null);
      setUpdatedStudentRecord(null);
      setErrorMsg(null);
    }
  }, [currentStudent]);

  // If preselectedStudent changes from props
  useEffect(() => {
    if (preselectedStudent) {
      setSelectedId(preselectedStudent.id);
    }
  }, [preselectedStudent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const effectiveKey = unlockedKey || secretKeyInput.trim();
    if (!effectiveKey) {
      setErrorMsg('Secret Key is strictly required to modify student records. Please enter the secret key.');
      return;
    }

    if (!formData.fullName.trim() || !formData.email.trim()) {
      setErrorMsg('Full Name and Email are mandatory.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await updateStudentApi(selectedId, formData, effectiveKey, remark);
      triggerStreamlitBalloons();
      setUpdatedSqlQuery(res.sqlQuery);
      setUpdatedStudentRecord(res.student);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update student record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopySQL = () => {
    if (updatedSqlQuery) {
      navigator.clipboard.writeText(updatedSqlQuery);
      setCopiedQuery(true);
      setTimeout(() => setCopiedQuery(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Title */}
      <div className="border-b border-[#E6EAF1] pb-3">
        <div className="flex items-center gap-1.5 text-xs font-mono text-[#808495]">
          <span>st.form("modify_student"):</span>
          <span>•</span>
          <span className="text-[#FFAA00] font-semibold">🔐 Secret Key Protected</span>
        </div>
        <h2 className="text-2xl font-bold text-[#31333F] flex items-center gap-2">
          <Edit className="w-6 h-6 text-[#FFAA00]" />
          <span>Modify Student Record</span>
        </h2>
        <p className="text-xs text-[#808495] mt-1">
          Select a student, edit their credentials or academic standings, and verify with your Secret Key to apply changes directly to the MySQL database.
        </p>
      </div>

      {/* Secret Key Status Strip */}
      <div
        className={`p-3.5 rounded-lg border text-xs flex items-center justify-between ${
          unlockedKey
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {unlockedKey ? (
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          )}
          <div>
            <span className="font-bold">
              {unlockedKey ? 'Admin Privileges Active' : 'Secret Key Verification Required'}
            </span>
            <p className="text-[11px] opacity-80 mt-0.5">
              {unlockedKey
                ? 'Your session is unlocked. Changes will be authorized automatically.'
                : 'Enter your Secret Key below or unlock in the sidebar to authorize modifications.'}
            </p>
          </div>
        </div>

        {!unlockedKey && (
          <button
            type="button"
            onClick={onOpenSecretModal}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-medium shrink-0 shadow-xs"
          >
            Unlock Session
          </button>
        )}
      </div>

      {/* Success Notification & Generated SQL */}
      {updatedStudentRecord && updatedSqlQuery && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>Student Record Updated Successfully in MySQL Database!</span>
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
            Updated record for <strong>{updatedStudentRecord.fullName}</strong> ({updatedStudentRecord.studentId}). Audit trail recorded.
          </p>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[#808495]">
              <span className="flex items-center gap-1 font-mono text-[#00618A]">
                <Database className="w-3 h-3" />
                Executed MySQL UPDATE Statement:
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
              {updatedSqlQuery}
            </pre>
          </div>
        </div>
      )}

      {/* Student Selector: st.selectbox */}
      <div className="bg-[#F8F9FB] border border-[#E6EAF1] rounded-lg p-4 space-y-2">
        <label className="block text-xs font-semibold text-[#31333F]">
          Select Student to Modify (st.selectbox)
        </label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(parseInt(e.target.value, 10))}
          className="w-full text-xs px-3 py-2 bg-white border border-[#D6DADE] rounded font-medium focus:ring-1 focus:ring-[#FF4B4B]"
        >
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.studentId} • {s.fullName} ({s.department}) - GPA: {s.gpa.toFixed(2)} [{s.status}]
            </option>
          ))}
        </select>
      </div>

      {/* Form */}
      {currentStudent && (
        <form onSubmit={handleSubmit} className="bg-white border border-[#E6EAF1] rounded-lg p-6 shadow-xs space-y-6">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Student ID (Read Only or Modifiable) */}
            <div>
              <label className="block text-xs font-semibold text-[#31333F] mb-1">
                Student ID / Roll No
              </label>
              <input
                type="text"
                required
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-[#D6DADE] rounded font-mono font-medium focus:ring-1 focus:ring-[#FF4B4B]"
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-[#31333F] mb-1">
                Full Legal Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-[#D6DADE] rounded focus:ring-1 focus:ring-[#FF4B4B]"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#31333F] mb-1">
                University Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-[#D6DADE] rounded font-mono focus:ring-1 focus:ring-[#FF4B4B]"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-[#31333F] mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-[#D6DADE] rounded font-mono focus:ring-1 focus:ring-[#FF4B4B]"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-[#31333F] mb-1">
                Academic Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-[#D6DADE] rounded focus:ring-1 focus:ring-[#FF4B4B]"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Semester (Slider style) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-[#31333F]">
                  Current Semester
                </label>
                <span className="text-xs font-mono font-bold text-[#FFAA00]">
                  Semester {formData.semester}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value, 10) })}
                className="w-full accent-[#FFAA00] cursor-pointer"
              />
            </div>

            {/* GPA */}
            <div>
              <label className="block text-xs font-semibold text-[#31333F] mb-1">
                Cumulative GPA (0.00 - 4.00)
              </label>
              <input
                type="number"
                min="0.00"
                max="4.00"
                step="0.01"
                value={formData.gpa}
                onChange={(e) => setFormData({ ...formData, gpa: parseFloat(e.target.value) || 0 })}
                className="w-full text-xs px-3 py-2 border border-[#D6DADE] rounded font-mono font-bold focus:ring-1 focus:ring-[#FF4B4B]"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-[#31333F] mb-1">
                Enrollment Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as StudentStatus })}
                className="w-full text-xs px-3 py-2 border border-[#D6DADE] rounded focus:ring-1 focus:ring-[#FF4B4B]"
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Graduated">Graduated</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>

            {/* Emergency Contact */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#31333F] mb-1">
                Emergency Contact
              </label>
              <input
                type="text"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-[#D6DADE] rounded focus:ring-1 focus:ring-[#FF4B4B]"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#31333F] mb-1">
                Address
              </label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-[#D6DADE] rounded focus:ring-1 focus:ring-[#FF4B4B]"
              />
            </div>

            {/* Modification Remark / Reason */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#31333F] mb-1">
                Audit Reason for Modification (Logged into MySQL Audit Trail)
              </label>
              <input
                type="text"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="e.g. GPA grade adjustment after Semester 6 re-exam"
                className="w-full text-xs px-3 py-2 border border-[#D6DADE] rounded focus:ring-1 focus:ring-[#FF4B4B]"
              />
            </div>
          </div>

          {/* Inline Secret Key Input if session is not unlocked */}
          {!unlockedKey && (
            <div className="p-4 bg-amber-50/70 border border-amber-300 rounded-lg space-y-2">
              <label className="block text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>Enter Admin Secret Key to Authorize Modification <span className="text-red-500">*</span></span>
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  required
                  placeholder="Enter Secret Key..."
                  value={secretKeyInput}
                  onChange={(e) => setSecretKeyInput(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-amber-300 rounded focus:ring-1 focus:ring-[#FF4B4B]"
                />
                <button
                  type="button"
                  onClick={() => setSecretKeyInput('ADMIN@2025')}
                  className="px-3 py-2 bg-white text-xs font-medium text-amber-900 border border-amber-300 rounded hover:bg-amber-100 shrink-0"
                >
                  Fill Default
                </button>
              </div>
              <p className="text-[11px] text-amber-800">
                Default key: <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-200">ADMIN@2025</code>
              </p>
            </div>
          )}

          {/* Submit */}
          <div className="pt-4 border-t border-[#E6EAF1] flex items-center justify-between">
            <span className="text-xs text-[#808495] flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-[#00618A]" />
              Executes: <code className="font-mono text-[#00618A]">UPDATE students WHERE id = {selectedId}</code>
            </span>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#FFAA00] hover:bg-[#e69900] text-white text-xs font-bold rounded transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Executing UPDATE...</span>
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4" />
                  <span>Update Record in MySQL Database</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
