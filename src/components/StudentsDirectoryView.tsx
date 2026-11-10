import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Trash2,
  Edit,
  Eye,
  CheckSquare,
  Square,
  ArrowUpDown,
  Lock,
  X,
  FileSpreadsheet,
  FileCode,
  Database,
  RefreshCw,
  UploadCloud,
} from 'lucide-react';
import { Student } from '../types/student.ts';

interface StudentsDirectoryViewProps {
  students: Student[];
  unlockedKey: string | null;
  onRefresh: () => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (student: Student) => void;
  onBulkDelete: (ids: number[]) => void;
  onNavigateAdd: () => void;
  onNavigateImport?: () => void;
}

export const StudentsDirectoryView: React.FC<StudentsDirectoryViewProps> = ({
  students,
  unlockedKey,
  onRefresh,
  onEditStudent,
  onDeleteStudent,
  onBulkDelete,
  onNavigateAdd,
  onNavigateImport,
}) => {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [semesterFilter, setSemesterFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState<keyof Student>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  // Departments list
  const departments = useMemo(() => {
    const set = new Set(students.map((s) => s.department));
    return ['All', ...Array.from(set)];
  }, [students]);

  // Filtered & Sorted students
  const filteredStudents = useMemo(() => {
    let result = [...students];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.studentId.toLowerCase().includes(q) ||
          s.fullName.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q) ||
          s.phone.toLowerCase().includes(q)
      );
    }

    if (deptFilter !== 'All') {
      result = result.filter((s) => s.department === deptFilter);
    }

    if (semesterFilter !== 'All') {
      result = result.filter((s) => s.semester === Number(semesterFilter));
    }

    if (statusFilter !== 'All') {
      result = result.filter((s) => s.status === statusFilter);
    }

    result.sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [students, search, deptFilter, semesterFilter, statusFilter, sortBy, sortOrder]);

  const handleSort = (column: keyof Student) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleToggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map((s) => s.id));
    }
  };

  // CSV Export
  const exportCSV = () => {
    const headers = ['ID', 'Student ID', 'Full Name', 'Email', 'Phone', 'Department', 'Semester', 'GPA', 'Enrollment Date', 'Status', 'Address', 'Emergency Contact'];
    const rows = filteredStudents.map((s) => [
      s.id,
      `"${s.studentId}"`,
      `"${s.fullName}"`,
      `"${s.email}"`,
      `"${s.phone}"`,
      `"${s.department}"`,
      s.semester,
      s.gpa,
      s.enrollmentDate,
      s.status,
      `"${s.address}"`,
      `"${s.emergencyContact}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `students_directory_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // JSON Export
  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredStudents, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `students_${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E6EAF1] gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#808495]">
            <span>st.dataframe(students)</span>
            <span>•</span>
            <span className="text-[#31333F] font-semibold">{filteredStudents.length} of {students.length} records</span>
          </div>
          <h2 className="text-xl font-bold text-[#31333F]">Student Records Directory</h2>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onRefresh}
            className="p-1.5 rounded border border-[#D6DADE] bg-white text-[#555] hover:bg-[#F0F2F6]"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={exportCSV}
            className="px-2.5 py-1.5 text-xs font-medium bg-white hover:bg-[#F0F2F6] text-[#31333F] rounded border border-[#D6DADE] flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>CSV</span>
          </button>

          <button
            onClick={exportJSON}
            className="px-2.5 py-1.5 text-xs font-medium bg-white hover:bg-[#F0F2F6] text-[#31333F] rounded border border-[#D6DADE] flex items-center gap-1.5"
          >
            <FileCode className="w-3.5 h-3.5 text-amber-600" />
            <span>JSON</span>
          </button>

          <a
            href="/api/mysql/export"
            download="student_management_workbench.sql"
            className="px-2.5 py-1.5 text-xs font-medium bg-[#00618A] hover:bg-[#004e70] text-white rounded flex items-center gap-1.5"
          >
            <Database className="w-3.5 h-3.5" />
            <span>MySQL Dump</span>
          </a>

          {onNavigateImport && (
            <button
              onClick={onNavigateImport}
              className="px-2.5 py-1.5 text-xs font-medium bg-[#9C27B0]/10 hover:bg-[#9C27B0]/20 text-[#9C27B0] rounded border border-[#9C27B0]/30 flex items-center gap-1.5 transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Import CSV</span>
            </button>
          )}

          <button
            onClick={onNavigateAdd}
            className="px-3 py-1.5 text-xs font-medium bg-[#FF4B4B] hover:bg-[#E03E3E] text-white rounded flex items-center gap-1.5 shadow-xs"
          >
            <span>+ Add Student</span>
          </button>
        </div>
      </div>

      {/* Streamlit Filter Widgets: st.selectbox & st.text_input */}
      <div className="bg-[#F8F9FB] border border-[#E6EAF1] rounded-lg p-3.5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div>
            <label className="block text-xs font-semibold text-[#555] mb-1">
              Search by Keyword
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#808495]" />
              <input
                type="text"
                placeholder="Name, ID, Email, Dept..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#D6DADE] rounded focus:outline-none focus:ring-1 focus:ring-[#FF4B4B]"
              />
            </div>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-xs font-semibold text-[#555] mb-1">
              Department (st.selectbox)
            </label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-white border border-[#D6DADE] rounded focus:outline-none focus:ring-1 focus:ring-[#FF4B4B]"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div>
            <label className="block text-xs font-semibold text-[#555] mb-1">
              Semester
            </label>
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-white border border-[#D6DADE] rounded focus:outline-none focus:ring-1 focus:ring-[#FF4B4B]"
            >
              <option value="All">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem.toString()}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-[#555] mb-1">
              Enrollment Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-white border border-[#D6DADE] rounded focus:outline-none focus:ring-1 focus:ring-[#FF4B4B]"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Graduated">Graduated</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Strip */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-2.5 bg-red-50 border border-red-200 rounded text-xs">
            <span className="text-red-900 font-medium">
              {selectedIds.length} students selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds([])}
                className="text-[#555] hover:text-[#000] px-2 py-1"
              >
                Clear
              </button>
              <button
                onClick={() => onBulkDelete(selectedIds)}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-medium flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected (Secret Key Required)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Streamlit Dataframe Table */}
      <div className="bg-white border border-[#E6EAF1] rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8F9FB] border-b border-[#E6EAF1] text-[#555] font-semibold">
                <th className="py-2.5 px-3 w-10 text-center">
                  <button
                    onClick={handleSelectAll}
                    className="text-[#808495] hover:text-[#31333F]"
                  >
                    {selectedIds.length === filteredStudents.length && filteredStudents.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-[#FF4B4B]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th
                  onClick={() => handleSort('id')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-[#F0F2F6] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>#</span>
                    <ArrowUpDown className="w-3 h-3 text-[#808495]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('studentId')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-[#F0F2F6] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Student ID</span>
                    <ArrowUpDown className="w-3 h-3 text-[#808495]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('fullName')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-[#F0F2F6] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Full Name</span>
                    <ArrowUpDown className="w-3 h-3 text-[#808495]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('department')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-[#F0F2F6] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Department</span>
                    <ArrowUpDown className="w-3 h-3 text-[#808495]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('semester')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-[#F0F2F6] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Sem</span>
                    <ArrowUpDown className="w-3 h-3 text-[#808495]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('gpa')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-[#F0F2F6] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>CGPA</span>
                    <ArrowUpDown className="w-3 h-3 text-[#808495]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-[#F0F2F6] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3 text-[#808495]" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-right">Actions (Secret Key)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6EAF1]">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#808495]">
                    No students match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const isSelected = selectedIds.includes(s.id);
                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-[#F8F9FB] transition-colors ${
                        isSelected ? 'bg-[#FF4B4B]/5' : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => handleToggleSelect(s.id)}
                          className="text-[#808495] hover:text-[#31333F]"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#FF4B4B]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-2 px-3 font-mono text-[#808495]">{s.id}</td>
                      <td className="py-2 px-3 font-mono font-medium text-[#00618A]">{s.studentId}</td>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-[#31333F]">{s.fullName}</div>
                        <div className="text-[11px] text-[#808495]">{s.email}</div>
                      </td>
                      <td className="py-2 px-3 text-[#555]">{s.department}</td>
                      <td className="py-2 px-3 font-mono font-medium text-[#31333F]">{s.semester}</td>
                      <td className="py-2 px-3 font-mono font-bold">
                        <span
                          className={
                            s.gpa >= 3.7
                              ? 'text-emerald-700'
                              : s.gpa >= 3.0
                              ? 'text-blue-700'
                              : 'text-amber-700'
                          }
                        >
                          {s.gpa.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <StatusPill status={s.status} />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingStudent(s)}
                            title="View Details"
                            className="p-1 rounded text-[#808495] hover:text-[#31333F] hover:bg-[#F0F2F6]"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditStudent(s)}
                            title="Modify Student (Requires Secret Key)"
                            className="p-1 rounded text-[#FFAA00] hover:text-[#cc8800] hover:bg-amber-50"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteStudent(s)}
                            title="Delete Student (Requires Secret Key)"
                            className="p-1 rounded text-[#FF4B4B] hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Details Inspection Modal */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-lg shadow-xl border border-[#D6DADE] max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="h-1 bg-[#FF4B4B]" />
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-mono text-[#00618A] font-semibold">
                    {viewingStudent.studentId}
                  </span>
                  <h3 className="text-lg font-bold text-[#31333F]">{viewingStudent.fullName}</h3>
                </div>
                <button
                  onClick={() => setViewingStudent(null)}
                  className="text-[#808495] hover:text-[#31333F]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div className="p-2.5 bg-[#F8F9FB] rounded border border-[#E6EAF1]">
                  <span className="text-[#808495] block mb-0.5">Department</span>
                  <span className="font-semibold text-[#31333F]">{viewingStudent.department}</span>
                </div>
                <div className="p-2.5 bg-[#F8F9FB] rounded border border-[#E6EAF1]">
                  <span className="text-[#808495] block mb-0.5">Current Semester</span>
                  <span className="font-semibold text-[#31333F]">Semester {viewingStudent.semester}</span>
                </div>
                <div className="p-2.5 bg-[#F8F9FB] rounded border border-[#E6EAF1]">
                  <span className="text-[#808495] block mb-0.5">Cumulative GPA</span>
                  <span className="font-bold text-[#31333F]">{viewingStudent.gpa.toFixed(2)} / 4.0</span>
                </div>
                <div className="p-2.5 bg-[#F8F9FB] rounded border border-[#E6EAF1]">
                  <span className="text-[#808495] block mb-0.5">Enrollment Status</span>
                  <StatusPill status={viewingStudent.status} />
                </div>
                <div className="p-2.5 bg-[#F8F9FB] rounded border border-[#E6EAF1] col-span-2">
                  <span className="text-[#808495] block mb-0.5">Email & Phone</span>
                  <span className="font-mono text-[#31333F]">{viewingStudent.email} • {viewingStudent.phone}</span>
                </div>
                <div className="p-2.5 bg-[#F8F9FB] rounded border border-[#E6EAF1] col-span-2">
                  <span className="text-[#808495] block mb-0.5">Campus Address</span>
                  <span className="text-[#31333F]">{viewingStudent.address}</span>
                </div>
                <div className="p-2.5 bg-[#F8F9FB] rounded border border-[#E6EAF1] col-span-2">
                  <span className="text-[#808495] block mb-0.5">Emergency Contact</span>
                  <span className="text-[#31333F]">{viewingStudent.emergencyContact}</span>
                </div>
              </div>

              {/* MySQL Query Equivalent preview */}
              <div className="p-2 bg-[#1E1E1E] text-emerald-400 rounded text-[11px] font-mono overflow-x-auto">
                <span className="text-gray-400">-- MySQL Workbench Representation:</span><br />
                SELECT * FROM `students` WHERE `id` = {viewingStudent.id};
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => {
                    const s = viewingStudent;
                    setViewingStudent(null);
                    onEditStudent(s);
                  }}
                  className="px-3 py-1.5 bg-[#FFAA00] hover:bg-[#e69900] text-white text-xs font-medium rounded flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Modify Record</span>
                </button>
                <button
                  onClick={() => setViewingStudent(null)}
                  className="px-3 py-1.5 bg-[#F0F2F6] text-[#31333F] text-xs font-medium rounded hover:bg-[#E6EAF1]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'Active':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800">
          ● Active
        </span>
      );
    case 'Graduated':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-800">
          Graduated
        </span>
      );
    case 'On Leave':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800">
          On Leave
        </span>
      );
    case 'Suspended':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-red-100 text-red-800">
          Suspended
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-800">
          {status}
        </span>
      );
  }
};
