import React from 'react';
import {
  Users,
  Award,
  GraduationCap,
  Database,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Search,
  Code2,
  Download,
  ArrowUpRight,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { Student } from '../types/student.ts';
import { NavPage } from './StreamlitSidebar.tsx';
import { triggerStreamlitBalloons } from '../utils/balloons.ts';

interface DashboardViewProps {
  students: Student[];
  unlockedKey: string | null;
  onNavigate: (page: NavPage) => void;
  onOpenSecretModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  unlockedKey,
  onNavigate,
  onOpenSecretModal,
}) => {
  const total = students.length;
  const activeCount = students.filter((s) => s.status === 'Active').length;
  const graduatedCount = students.filter((s) => s.status === 'Graduated').length;
  const onLeaveCount = students.filter((s) => s.status === 'On Leave').length;
  const suspendedCount = students.filter((s) => s.status === 'Suspended').length;

  const avgGpa = total > 0 ? (students.reduce((sum, s) => sum + s.gpa, 0) / total).toFixed(2) : '0.00';
  const highAchievers = students.filter((s) => s.gpa >= 3.75).length;

  // Department counts
  const deptCounts: Record<string, number> = {};
  students.forEach((s) => {
    deptCounts[s.department] = (deptCounts[s.department] || 0) + 1;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Streamlit Title Block */}
      <div className="border-b border-[#E6EAF1] pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#808495] mb-1">
              <span>st.title</span>
              <span>•</span>
              <span className="text-[#FF4B4B] font-semibold">MySQL Workbench Connected</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#31333F]">
              Student Database Management Portal
            </h1>
            <p className="text-sm text-[#808495] mt-1">
              Interactive portal for university student records with secret-key guarded modification, deletion, and MySQL Workbench sync.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => triggerStreamlitBalloons()}
              className="px-3 py-1.5 bg-[#FF4B4B]/10 hover:bg-[#FF4B4B]/20 text-[#FF4B4B] rounded text-xs font-medium flex items-center gap-1.5 transition-colors border border-[#FF4B4B]/30"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>st.balloons()</span>
            </button>
            <a
              href="/api/mysql/export"
              download="student_management_workbench.sql"
              className="px-3 py-1.5 bg-[#00618A] hover:bg-[#004e70] text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export MySQL Dump</span>
            </a>
          </div>
        </div>
      </div>

      {/* Streamlit Metric Row: st.metric */}
      <div className="space-y-2">
        <div className="text-xs font-mono text-[#808495]"># st.columns(5) metrics</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Metric 1: Total Students */}
          <div className="bg-white border border-[#E6EAF1] rounded-lg p-4 shadow-xs hover:border-[#D6DADE] transition-all">
            <div className="flex items-center justify-between text-[#808495] text-xs font-medium mb-1">
              <span>Total Enrolled</span>
              <Users className="w-3.5 h-3.5 text-[#1E88E5]" />
            </div>
            <div className="text-2xl font-bold text-[#31333F] tracking-tight">{total}</div>
            <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-0.5">
              <span>↑ +2 this semester</span>
            </div>
          </div>

          {/* Metric 2: Average GPA */}
          <div className="bg-white border border-[#E6EAF1] rounded-lg p-4 shadow-xs hover:border-[#D6DADE] transition-all">
            <div className="flex items-center justify-between text-[#808495] text-xs font-medium mb-1">
              <span>Average CGPA</span>
              <Award className="w-3.5 h-3.5 text-[#FFAA00]" />
            </div>
            <div className="text-2xl font-bold text-[#31333F] tracking-tight">
              {avgGpa} <span className="text-xs text-[#808495] font-normal">/ 4.0</span>
            </div>
            <div className="text-xs text-emerald-600 font-semibold mt-1">
              <span>↑ Top Dean's List ({highAchievers})</span>
            </div>
          </div>

          {/* Metric 3: Active Status */}
          <div className="bg-white border border-[#E6EAF1] rounded-lg p-4 shadow-xs hover:border-[#D6DADE] transition-all">
            <div className="flex items-center justify-between text-[#808495] text-xs font-medium mb-1">
              <span>Active Students</span>
              <GraduationCap className="w-3.5 h-3.5 text-[#00D4B2]" />
            </div>
            <div className="text-2xl font-bold text-[#31333F] tracking-tight">
              {activeCount} <span className="text-xs text-[#808495] font-normal">({total > 0 ? Math.round((activeCount / total) * 100) : 0}%)</span>
            </div>
            <div className="text-xs text-[#808495] mt-1">
              <span>{graduatedCount} Grad • {onLeaveCount} Leave</span>
            </div>
          </div>

          {/* Metric 4: MySQL Database */}
          <div className="bg-white border border-[#E6EAF1] rounded-lg p-4 shadow-xs hover:border-[#D6DADE] transition-all">
            <div className="flex items-center justify-between text-[#808495] text-xs font-medium mb-1">
              <span>MySQL Workbench</span>
              <Database className="w-3.5 h-3.5 text-[#00618A]" />
            </div>
            <div className="text-sm font-bold text-[#00618A] truncate font-mono mt-1">
              student_management_db
            </div>
            <div className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>DDL & Data Synced</span>
            </div>
          </div>

          {/* Metric 5: Secret Key Security */}
          <div className="bg-white border border-[#E6EAF1] rounded-lg p-4 shadow-xs hover:border-[#D6DADE] transition-all col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-[#808495] text-xs font-medium mb-1">
              <span>Secret Gate</span>
              {unlockedKey ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5 text-[#FF4B4B]" />
              )}
            </div>
            <div className={`text-base font-bold tracking-tight ${unlockedKey ? 'text-emerald-700' : 'text-[#FF4B4B]'}`}>
              {unlockedKey ? 'Unlocked' : 'Locked'}
            </div>
            <div className="mt-1">
              {unlockedKey ? (
                <span className="text-[11px] text-emerald-600">Session Verified</span>
              ) : (
                <button
                  onClick={onOpenSecretModal}
                  className="text-[11px] text-[#FF4B4B] underline font-medium hover:text-[#E03E3E]"
                >
                  Enter Key to Edit/Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Streamlit Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Add Record */}
        <div
          onClick={() => onNavigate('add')}
          className="group cursor-pointer bg-white border border-[#E6EAF1] hover:border-[#00D4B2] rounded-lg p-5 shadow-xs transition-all hover:shadow-md"
        >
          <div className="w-10 h-10 rounded-lg bg-[#00D4B2]/10 text-[#00D4B2] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <UserPlus className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#31333F] group-hover:text-[#00D4B2] transition-colors">
              Add Record
            </h3>
            <ArrowUpRight className="w-4 h-4 text-[#808495] group-hover:text-[#00D4B2]" />
          </div>
          <p className="text-xs text-[#808495] mt-1.5 leading-relaxed">
            Standard admission form with instant MySQL <code className="bg-[#F0F2F6] px-1 py-0.5 rounded text-[11px]">INSERT</code> query.
          </p>
        </div>

        {/* Card 2: Batch Import CSV */}
        <div
          onClick={() => onNavigate('import')}
          className="group cursor-pointer bg-white border border-[#E6EAF1] hover:border-[#9C27B0] rounded-lg p-5 shadow-xs transition-all hover:shadow-md"
        >
          <div className="w-10 h-10 rounded-lg bg-[#9C27B0]/10 text-[#9C27B0] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#31333F] group-hover:text-[#9C27B0] transition-colors">
              Import CSV
            </h3>
            <ArrowUpRight className="w-4 h-4 text-[#808495] group-hover:text-[#9C27B0]" />
          </div>
          <p className="text-xs text-[#808495] mt-1.5 leading-relaxed">
            Batch-insert student records from CSV into MySQL after secret key authentication.
          </p>
        </div>

        {/* Card 3: Directory & Filter */}
        <div
          onClick={() => onNavigate('directory')}
          className="group cursor-pointer bg-white border border-[#E6EAF1] hover:border-[#1E88E5] rounded-lg p-5 shadow-xs transition-all hover:shadow-md"
        >
          <div className="w-10 h-10 rounded-lg bg-[#1E88E5]/10 text-[#1E88E5] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Search className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#31333F] group-hover:text-[#1E88E5] transition-colors">
              Directory Grid
            </h3>
            <ArrowUpRight className="w-4 h-4 text-[#808495] group-hover:text-[#1E88E5]" />
          </div>
          <p className="text-xs text-[#808495] mt-1.5 leading-relaxed">
            <code className="bg-[#F0F2F6] px-1 py-0.5 rounded text-[11px]">st.dataframe</code> grid with sorting, filters, and CSV/JSON export.
          </p>
        </div>

        {/* Card 4: MySQL Workbench Studio */}
        <div
          onClick={() => onNavigate('mysql_workbench')}
          className="group cursor-pointer bg-white border border-[#E6EAF1] hover:border-[#00618A] rounded-lg p-5 shadow-xs transition-all hover:shadow-md"
        >
          <div className="w-10 h-10 rounded-lg bg-[#00618A]/10 text-[#00618A] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Code2 className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#31333F] group-hover:text-[#00618A] transition-colors">
              MySQL Studio
            </h3>
            <ArrowUpRight className="w-4 h-4 text-[#808495] group-hover:text-[#00618A]" />
          </div>
          <p className="text-xs text-[#808495] mt-1.5 leading-relaxed">
            Run raw SQL queries, explore schema DDL, and download Workbench dump.
          </p>
        </div>
      </div>

      {/* Department Breakdown & Status Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <div className="bg-white border border-[#E6EAF1] rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#31333F]">Department Distribution</h3>
            <span className="text-xs text-[#808495] font-mono">{Object.keys(deptCounts).length} Departments</span>
          </div>

          <div className="space-y-3">
            {Object.entries(deptCounts).map(([dept, count]) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={dept} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-[#31333F]">{dept}</span>
                    <span className="text-[#808495] font-mono">{count} students ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-[#F0F2F6] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FF4B4B] to-[#FFAA00] rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security & Secret Key Specs */}
        <div className="bg-white border border-[#E6EAF1] rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-[#31333F] flex items-center gap-2">
                <span>Secret Key Security Enforcement</span>
              </h3>
              <span className="text-[11px] bg-red-100 text-red-700 font-mono font-semibold px-2 py-0.5 rounded">
                Strict ABAC Mode
              </span>
            </div>
            <p className="text-xs text-[#808495] leading-relaxed mb-4">
              All <code className="bg-[#F0F2F6] px-1 py-0.5 rounded font-mono text-[#FF4B4B]">UPDATE</code> and <code className="bg-[#F0F2F6] px-1 py-0.5 rounded font-mono text-[#FF4B4B]">DELETE</code> operations on student records require cryptographic verification of the secret admin key before mutating the MySQL workbench database.
            </p>

            <div className="bg-[#F8F9FB] border border-[#E6EAF1] rounded p-3 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#808495]">Status:</span>
                <span className={`font-semibold ${unlockedKey ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {unlockedKey ? 'Session Authenticated' : 'Locked (Prompt on Action)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#808495]">Default Key:</span>
                <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#D6DADE]">ADMIN@2025</code>
              </div>
              <div className="flex justify-between">
                <span className="text-[#808495]">Scope:</span>
                <span>Individual Edit, Delete, Bulk Delete, Reset</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E6EAF1] flex items-center justify-between">
            <span className="text-xs text-[#808495]">Need to manage or rotate secret key?</span>
            <button
              onClick={onOpenSecretModal}
              className="text-xs font-medium text-[#FF4B4B] hover:underline"
            >
              Verify / Change Key →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
