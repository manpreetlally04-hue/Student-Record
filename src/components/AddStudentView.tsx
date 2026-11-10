import React, { useState } from 'react';
import {
  UserPlus,
  CheckCircle,
  Copy,
  Check,
  AlertCircle,
  Database,
  Wand2,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { StudentFormData, StudentStatus } from '../types/student.ts';
import { addStudentApi } from '../utils/api.ts';
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

interface AddStudentViewProps {
  onSuccess: () => void;
  onNavigateDirectory: () => void;
}

export const AddStudentView: React.FC<AddStudentViewProps> = ({
  onSuccess,
  onNavigateDirectory,
}) => {
  const [formData, setFormData] = useState<StudentFormData>({
    studentId: `STU-2025-${Math.floor(100 + Math.random() * 900)}`,
    fullName: '',
    email: '',
    phone: '+1 (555) 000-0000',
    department: 'Computer Science',
    semester: 1,
    gpa: 3.50,
    enrollmentDate: new Date().toISOString().substring(0, 10),
    status: 'Active',
    address: 'Campus Dormitory Block B',
    emergencyContact: 'Parent / Guardian (+1 555-111-2233)',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastInsertedQuery, setLastInsertedQuery] = useState<string | null>(null);
  const [lastInsertedStudent, setLastInsertedStudent] = useState<any | null>(null);
  const [copiedQuery, setCopiedQuery] = useState(false);

  const handleGenerateId = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    setFormData((prev) => ({ ...prev, studentId: `STU-2025-${randomNum}` }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    if (!formData.studentId.trim()) {
      setErrorMsg('Student ID is required.');
      return;
    }
    if (!formData.fullName.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMsg('Valid university email address is required.');
      return;
    }
    if (formData.gpa < 0 || formData.gpa > 4.0) {
      setErrorMsg('GPA must be between 0.00 and 4.00.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await addStudentApi(formData);
      triggerStreamlitBalloons();
      setLastInsertedQuery(res.sqlQuery);
      setLastInsertedStudent(res.student);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add student record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopySQL = () => {
    if (lastInsertedQuery) {
      navigator.clipboard.writeText(lastInsertedQuery);
      setCopiedQuery(true);
      setTimeout(() => setCopiedQuery(false), 2000);
    }
  };

  const handleResetForm = () => {
    setLastInsertedQuery(null);
    setLastInsertedStudent(null);
    setFormData({
      studentId: `STU-2025-${Math.floor(100 + Math.random() * 900)}`,
      fullName: '',
      email: '',
      phone: '+1 (555) 000-0000',
      department: 'Computer Science',
      semester: 1,
      gpa: 3.50,
      enrollmentDate: new Date().toISOString().substring(0, 10),
      status: 'Active',
      address: 'Campus Dormitory Block B',
      emergencyContact: 'Parent / Guardian (+1 555-111-2233)',
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Title */}
      <div className="border-b border-[#E6EAF1] pb-3">
        <div className="flex items-center gap-1.5 text-xs font-mono text-[#808495]">
          <span>with st.form("add_student"):</span>
          <span>•</span>
          <span className="text-[#00D4B2] font-semibold">Ready for MySQL INSERT</span>
        </div>
        <h2 className="text-2xl font-bold text-[#31333F] flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-[#00D4B2]" />
          <span>Add New Student Record</span>
        </h2>
        <p className="text-xs text-[#808495] mt-1">
          Enter student demographic, academic, and contact information. On submit, this will be saved and executed as a MySQL Workbench DML command.
        </p>
      </div>

      {/* Success Notification & Generated SQL */}
      {lastInsertedStudent && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>Student Record Created Successfully! (st.success)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetForm}
                className="px-3 py-1 bg-white hover:bg-emerald-100 text-emerald-800 text-xs font-medium rounded border border-emerald-300"
              >
                + Add Another
              </button>
              <button
                onClick={onNavigateDirectory}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded flex items-center gap-1 shadow-xs"
              >
                <span>View in Directory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <p className="text-xs text-emerald-800">
            Recorded <strong>{lastInsertedStudent.fullName}</strong> ({lastInsertedStudent.studentId}) in <strong>{lastInsertedStudent.department}</strong>.
          </p>

          {/* MySQL SQL Block */}
          {lastInsertedQuery && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-[#808495]">
                <span className="flex items-center gap-1 font-mono text-[#00618A]">
                  <Database className="w-3 h-3" />
                  Executed MySQL Statement:
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
                {lastInsertedQuery}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Streamlit Form: st.form */}
      <form onSubmit={handleSubmit} className="bg-white border border-[#E6EAF1] rounded-lg p-6 shadow-xs space-y-6">
        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Student ID */}
          <div>
            <label className="block text-xs font-semibold text-[#31333F] mb-1">
              Student ID / Roll No <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                placeholder="STU-2025-001"
                className="w-full text-xs px-3 py-2 border border-[#D6DADE] rounded font-mono font-medium focus:ring-1 focus:ring-[#FF4B4B]"
              />
              <button
                type="button"
                onClick={handleGenerateId}
                title="Generate Unique Roll Number"
                className="px-2.5 py-2 bg-[#F0F2F6] hover:bg-[#E6EAF1] text-[#31333F] text-xs font-medium rounded border border-[#D6DADE] flex items-center gap-1 shrink-0"
              >
                <Wand2 className="w-3.5 h-3.5 text-[#00618A]" />
                <span className="hidden sm:inline">Auto</span>
              </button>
            </div>
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
              placeholder="e.g. Alexander Hamilton"
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
              placeholder="student@university.edu"
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
              placeholder="+1 (555) 123-4567"
              className="w-full text-xs px-3 py-2 border border-[#D6DADE] rounded font-mono focus:ring-1 focus:ring-[#FF4B4B]"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-semibold text-[#31333F] mb-1">
              Academic Department (st.selectbox) <span className="text-red-500">*</span>
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
                Current Semester (st.slider)
              </label>
              <span className="text-xs font-mono font-bold text-[#FF4B4B]">
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
              className="w-full accent-[#FF4B4B] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#808495] font-mono mt-0.5">
              <span>Sem 1</span>
              <span>Sem 4</span>
              <span>Sem 8</span>
            </div>
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

          {/* Enrollment Date */}
          <div>
            <label className="block text-xs font-semibold text-[#31333F] mb-1">
              Enrollment Date
            </label>
            <input
              type="date"
              value={formData.enrollmentDate}
              onChange={(e) => setFormData({ ...formData, enrollmentDate: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-[#D6DADE] rounded font-mono focus:ring-1 focus:ring-[#FF4B4B]"
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
          <div>
            <label className="block text-xs font-semibold text-[#31333F] mb-1">
              Emergency Contact & Phone
            </label>
            <input
              type="text"
              value={formData.emergencyContact}
              onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
              placeholder="Name & Relationship (+1 555-000-0000)"
              className="w-full text-xs px-3 py-2 border border-[#D6DADE] rounded focus:ring-1 focus:ring-[#FF4B4B]"
            />
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[#31333F] mb-1">
              Permanent / Campus Address
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Street, Building, City, State, ZIP"
              className="w-full text-xs px-3 py-2 border border-[#D6DADE] rounded focus:ring-1 focus:ring-[#FF4B4B]"
            />
          </div>
        </div>

        {/* Submit Button (st.form_submit_button) */}
        <div className="pt-4 border-t border-[#E6EAF1] flex items-center justify-between">
          <span className="text-xs text-[#808495] flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-[#00618A]" />
            Target: <code className="font-mono text-[#00618A]">students</code> table
          </span>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-[#FF4B4B] hover:bg-[#E03E3E] text-white text-xs font-bold rounded transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Executing INSERT...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Submit & Insert into MySQL (st.form_submit_button)</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
