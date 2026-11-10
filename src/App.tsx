/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { StreamlitHeader } from './components/StreamlitHeader.tsx';
import { StreamlitSidebar, NavPage } from './components/StreamlitSidebar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { StudentsDirectoryView } from './components/StudentsDirectoryView.tsx';
import { AddStudentView } from './components/AddStudentView.tsx';
import { ModifyStudentView } from './components/ModifyStudentView.tsx';
import { DeleteStudentView } from './components/DeleteStudentView.tsx';
import { ImportDataView } from './components/ImportDataView.tsx';
import { MySQLWorkbenchStudio } from './components/MySQLWorkbenchStudio.tsx';
import { AuditLogView } from './components/AuditLogView.tsx';
import { SecretKeyModal } from './components/SecretKeyModal.tsx';
import { Student } from './types/student.ts';
import { fetchStudents, bulkDeleteStudentsApi } from './utils/api.ts';
import { triggerStreamlitBalloons } from './utils/balloons.ts';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<NavPage>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [unlockedKey, setUnlockedKey] = useState<string | null>(null);
  const [preselectedStudent, setPreselectedStudent] = useState<Student | null>(null);

  // Secret Modal State
  const [secretModalOpen, setSecretModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title?: string;
    description?: string;
    onAuthorize?: (key: string) => void;
  }>({});

  // Toast notifications (st.toast)
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const loadStudents = useCallback(async () => {
    try {
      const data = await fetchStudents();
      setStudents(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch student records', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Streamlit rerun simulation (st.rerun)
  const handleRerun = () => {
    setIsRunning(true);
    loadStudents().finally(() => {
      setTimeout(() => {
        setIsRunning(false);
        showToast('App re-executed successfully (st.rerun)', 'info');
      }, 400);
    });
  };

  const handleEditStudent = (student: Student) => {
    setPreselectedStudent(student);
    setCurrentPage('modify');
  };

  const handleDeleteStudent = (student: Student) => {
    setPreselectedStudent(student);
    setCurrentPage('delete');
  };

  const handleBulkDelete = (ids: number[]) => {
    if (unlockedKey) {
      if (window.confirm(`Are you sure you want to delete ${ids.length} selected students?`)) {
        executeBulkDelete(ids, unlockedKey);
      }
    } else {
      setModalConfig({
        title: 'Bulk Deletion Authorization',
        description: `Enter the secret key to delete ${ids.length} student records from the database.`,
        onAuthorize: (key) => executeBulkDelete(ids, key),
      });
      setSecretModalOpen(true);
    }
  };

  const executeBulkDelete = async (ids: number[], key: string) => {
    try {
      const res = await bulkDeleteStudentsApi(ids, key);
      showToast(res.message, 'success');
      loadStudents();
    } catch (err: any) {
      showToast(err.message || 'Bulk delete failed', 'error');
    }
  };

  const handleOpenSecretModal = (config?: { title?: string; description?: string; onAuthorize?: (key: string) => void }) => {
    setModalConfig(config || {});
    setSecretModalOpen(true);
  };

  const handleSecretModalSuccess = (key: string, persistSession: boolean) => {
    if (persistSession) {
      setUnlockedKey(key);
      showToast('Admin session unlocked! Modification & Deletion privileges active.', 'success');
    }
    if (modalConfig.onAuthorize) {
      modalConfig.onAuthorize(key);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#31333F] flex flex-col font-sans selection:bg-[#FF4B4B] selection:text-white">
      {/* Streamlit Top App Header */}
      <StreamlitHeader
        isRunning={isRunning || loading}
        onRerun={handleRerun}
        unlockedKey={unlockedKey}
        onOpenSecretModal={() => handleOpenSecretModal()}
        onLockSession={() => {
          setUnlockedKey(null);
          showToast('Admin session locked.', 'info');
        }}
        totalStudents={students.length}
      />

      {/* Main Layout: Streamlit Sidebar + Main App Canvas */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Streamlit Sidebar (st.sidebar) */}
        <StreamlitSidebar
          currentPage={currentPage}
          onSelectPage={(page) => {
            setCurrentPage(page);
            if (page !== 'modify' && page !== 'delete') {
              setPreselectedStudent(null);
            }
          }}
          unlockedKey={unlockedKey}
          onSetUnlockedKey={setUnlockedKey}
          onOpenSecretModal={() => handleOpenSecretModal()}
          totalStudents={students.length}
        />

        {/* Main Content Pane */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* Toast Notification (st.toast) */}
          {toast && (
            <div
              className={`mb-4 p-3 rounded-lg border text-xs flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-150 ${
                toast.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : toast.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              <div className="flex items-center gap-2">
                {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
                {toast.type === 'info' && <Info className="w-4 h-4 text-blue-600" />}
                <span className="font-medium">{toast.message}</span>
              </div>
              <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Views */}
          {currentPage === 'dashboard' && (
            <DashboardView
              students={students}
              unlockedKey={unlockedKey}
              onNavigate={(page) => setCurrentPage(page)}
              onOpenSecretModal={() => handleOpenSecretModal()}
            />
          )}

          {currentPage === 'directory' && (
            <StudentsDirectoryView
              students={students}
              unlockedKey={unlockedKey}
              onRefresh={loadStudents}
              onEditStudent={handleEditStudent}
              onDeleteStudent={handleDeleteStudent}
              onBulkDelete={handleBulkDelete}
              onNavigateAdd={() => setCurrentPage('add')}
              onNavigateImport={() => setCurrentPage('import')}
            />
          )}

          {currentPage === 'add' && (
            <AddStudentView
              onSuccess={() => {
                loadStudents();
                showToast('Student record added to MySQL database!', 'success');
              }}
              onNavigateDirectory={() => setCurrentPage('directory')}
            />
          )}

          {currentPage === 'modify' && (
            <ModifyStudentView
              students={students}
              preselectedStudent={preselectedStudent}
              unlockedKey={unlockedKey}
              onSuccess={() => {
                loadStudents();
                showToast('Student record updated in MySQL database!', 'success');
              }}
              onOpenSecretModal={() => handleOpenSecretModal()}
              onNavigateDirectory={() => setCurrentPage('directory')}
            />
          )}

          {currentPage === 'delete' && (
            <DeleteStudentView
              students={students}
              preselectedStudent={preselectedStudent}
              unlockedKey={unlockedKey}
              onSuccess={() => {
                loadStudents();
                showToast('Record deleted from MySQL database.', 'info');
              }}
              onOpenSecretModal={() => handleOpenSecretModal()}
              onNavigateDirectory={() => setCurrentPage('directory')}
            />
          )}

          {currentPage === 'import' && (
            <ImportDataView
              existingStudents={students}
              unlockedKey={unlockedKey}
              onSuccess={() => {
                loadStudents();
                showToast('Batch CSV records committed to MySQL database!', 'success');
              }}
              onNavigateDirectory={() => setCurrentPage('directory')}
              onOpenSecretModal={() => handleOpenSecretModal()}
            />
          )}

          {currentPage === 'mysql_workbench' && <MySQLWorkbenchStudio />}

          {currentPage === 'audit' && <AuditLogView />}
        </main>
      </div>

      {/* Secret Key Modal Gate */}
      <SecretKeyModal
        isOpen={secretModalOpen}
        onClose={() => setSecretModalOpen(false)}
        onSuccess={handleSecretModalSuccess}
        actionTitle={modalConfig.title}
        actionDescription={modalConfig.description}
      />
    </div>
  );
}
