import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Database,
  History,
  Key,
  Download,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Server,
  UploadCloud,
} from 'lucide-react';
import { verifySecretKeyApi, changeSecretKeyApi } from '../utils/api.ts';

export type NavPage =
  | 'dashboard'
  | 'directory'
  | 'add'
  | 'modify'
  | 'delete'
  | 'import'
  | 'mysql_workbench'
  | 'audit';

interface StreamlitSidebarProps {
  currentPage: NavPage;
  onSelectPage: (page: NavPage) => void;
  unlockedKey: string | null;
  onSetUnlockedKey: (key: string | null) => void;
  onOpenSecretModal: () => void;
  totalStudents: number;
}

export const StreamlitSidebar: React.FC<StreamlitSidebarProps> = ({
  currentPage,
  onSelectPage,
  unlockedKey,
  onSetUnlockedKey,
  onOpenSecretModal,
  totalStudents,
}) => {
  const [showKeyManager, setShowKeyManager] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [oldKey, setOldKey] = useState('');
  const [newKey, setNewKey] = useState('');
  const [keyError, setKeyError] = useState<string | null>(null);
  const [keySuccess, setKeySuccess] = useState<string | null>(null);

  const handleQuickUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError(null);
    setKeySuccess(null);
    if (!inputKey.trim()) return;

    try {
      const valid = await verifySecretKeyApi(inputKey.trim());
      if (valid) {
        onSetUnlockedKey(inputKey.trim());
        setKeySuccess('Admin session unlocked!');
        setInputKey('');
      } else {
        setKeyError('Invalid Secret Key. Default is ADMIN@2025');
      }
    } catch (err: any) {
      setKeyError(err.message || 'Verification failed');
    }
  };

  const handleChangeKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError(null);
    setKeySuccess(null);
    if (!oldKey.trim() || !newKey.trim()) return;

    try {
      const res = await changeSecretKeyApi(oldKey.trim(), newKey.trim());
      setKeySuccess(res.message);
      if (unlockedKey) {
        onSetUnlockedKey(newKey.trim());
      }
      setOldKey('');
      setNewKey('');
    } catch (err: any) {
      setKeyError(err.message || 'Failed to update key');
    }
  };

  const navItems: { id: NavPage; label: string; icon: React.ReactNode; requiresKey?: boolean; badge?: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard & Metrics',
      icon: <LayoutDashboard className="w-4 h-4 text-[#FF4B4B]" />,
    },
    {
      id: 'directory',
      label: 'Students Directory',
      icon: <Users className="w-4 h-4 text-[#1E88E5]" />,
      badge: `${totalStudents}`,
    },
    {
      id: 'add',
      label: 'Add Student Record',
      icon: <UserPlus className="w-4 h-4 text-[#00D4B2]" />,
    },
    {
      id: 'modify',
      label: 'Modify Student',
      icon: <UserCheck className="w-4 h-4 text-[#FFAA00]" />,
      requiresKey: true,
    },
    {
      id: 'delete',
      label: 'Delete Record',
      icon: <UserX className="w-4 h-4 text-[#FF4B4B]" />,
      requiresKey: true,
    },
    {
      id: 'import',
      label: 'Batch Import CSV',
      icon: <UploadCloud className="w-4 h-4 text-[#9C27B0]" />,
      requiresKey: true,
      badge: 'CSV',
    },
    {
      id: 'mysql_workbench',
      label: 'MySQL Workbench & SQL',
      icon: <Database className="w-4 h-4 text-[#00618A]" />,
      badge: 'SQL',
    },
    {
      id: 'audit',
      label: 'SQL Audit Log',
      icon: <History className="w-4 h-4 text-[#7C4DFF]" />,
    },
  ];

  return (
    <aside className="w-full md:w-72 bg-[#F8F9FB] border-r border-[#E6EAF1] flex flex-col justify-between shrink-0 p-4 min-h-[calc(100vh-3.5rem)]">
      <div className="space-y-6">
        {/* Streamlit Sidebar Brand */}
        <div className="pb-3 border-b border-[#E6EAF1]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#808495]">
              Streamlit Sidebar
            </span>
            <span className="text-[10px] bg-[#E6EAF1] text-[#555] px-1.5 py-0.5 rounded font-mono">
              st.sidebar
            </span>
          </div>
          <h2 className="text-base font-bold text-[#31333F] mt-1 flex items-center gap-2">
            <span>Student Record Portal</span>
          </h2>
          <p className="text-xs text-[#808495] mt-0.5">
            Interactive CRUD & MySQL Workbench Sync
          </p>
        </div>

        {/* Navigation Menu */}
        <div>
          <label className="block text-xs font-semibold text-[#808495] uppercase tracking-wider mb-2">
            Navigation (st.radio)
          </label>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectPage(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded transition-all text-left ${
                    isActive
                      ? 'bg-[#FF4B4B]/10 text-[#FF4B4B] font-semibold shadow-xs border-l-3 border-[#FF4B4B]'
                      : 'text-[#31333F] hover:bg-[#F0F2F6] hover:text-[#000]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.requiresKey && (
                      <span
                        title="Protected with Secret Key"
                        className="text-[#808495] hover:text-[#FF4B4B]"
                      >
                        <Lock className="w-3 h-3" />
                      </span>
                    )}
                    {item.badge && (
                      <span
                        className={`text-[11px] font-mono px-1.5 py-0.2 rounded ${
                          isActive
                            ? 'bg-[#FF4B4B] text-white font-bold'
                            : 'bg-[#E6EAF1] text-[#555]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Secret Key Security Section */}
        <div className="pt-2 border-t border-[#E6EAF1]">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-[#808495] uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-[#FFAA00]" />
              <span>Admin Security</span>
            </label>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                unlockedKey
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {unlockedKey ? 'AUTHENTICATED' : 'LOCKED'}
            </span>
          </div>

          {unlockedKey ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded p-2.5 text-xs text-emerald-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Session Active
                </span>
                <button
                  onClick={() => onSetUnlockedKey(null)}
                  className="text-emerald-700 hover:text-emerald-900 font-semibold underline text-[11px]"
                >
                  Lock
                </button>
              </div>
              <p className="text-[11px] text-emerald-700 leading-tight">
                Modify & Delete privileges unlocked for this session.
              </p>
            </div>
          ) : (
            <form onSubmit={handleQuickUnlock} className="space-y-2">
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter Secret Key..."
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-[#D6DADE] rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#FF4B4B] focus:border-[#FF4B4B]"
                />
              </div>
              <button
                type="submit"
                className="w-full py-1 px-2.5 bg-[#31333F] hover:bg-black text-white text-xs font-medium rounded transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Unlock className="w-3 h-3 text-[#FFAA00]" />
                <span>Unlock Privileges</span>
              </button>
              <div className="flex items-center justify-between text-[11px] text-[#808495] pt-1">
                <span>Default: <code className="bg-[#E6EAF1] px-1 py-0.5 rounded text-[#31333F] font-mono">ADMIN@2025</code></span>
                <button
                  type="button"
                  onClick={onOpenSecretModal}
                  className="text-[#FF4B4B] hover:underline"
                >
                  Key Help
                </button>
              </div>
            </form>
          )}

          {keyError && (
            <p className="text-[11px] text-red-600 mt-1.5 bg-red-50 p-1.5 rounded border border-red-200">
              {keyError}
            </p>
          )}
          {keySuccess && (
            <p className="text-[11px] text-emerald-700 mt-1.5 bg-emerald-50 p-1.5 rounded border border-emerald-200">
              {keySuccess}
            </p>
          )}

          {/* Change Secret Key Collapsible */}
          <div className="mt-2.5">
            <button
              onClick={() => setShowKeyManager(!showKeyManager)}
              className="w-full flex items-center justify-between text-xs text-[#555] hover:text-[#31333F] py-1"
            >
              <span className="flex items-center gap-1">
                {showKeyManager ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                Change Secret Key
              </span>
            </button>

            {showKeyManager && (
              <form onSubmit={handleChangeKey} className="mt-2 p-2.5 bg-white border border-[#E6EAF1] rounded space-y-2 text-xs">
                <div>
                  <label className="block text-[11px] text-[#555] mb-0.5">Current Key</label>
                  <input
                    type="password"
                    required
                    value={oldKey}
                    onChange={(e) => setOldKey(e.target.value)}
                    placeholder="Current Secret Key"
                    className="w-full px-2 py-1 text-xs border border-[#D6DADE] rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#555] mb-0.5">New Key (min 4 chars)</label>
                  <input
                    type="password"
                    required
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="New Secret Key"
                    className="w-full px-2 py-1 text-xs border border-[#D6DADE] rounded"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-1 text-xs bg-[#FF4B4B] text-white rounded font-medium hover:bg-[#E03E3E]"
                >
                  Update Secret Key
                </button>
              </form>
            )}
          </div>
        </div>

        {/* MySQL Workbench Quick Widget */}
        <div className="pt-2 border-t border-[#E6EAF1] space-y-2">
          <label className="block text-xs font-semibold text-[#808495] uppercase tracking-wider flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-[#00618A]" />
            <span>MySQL Workbench Target</span>
          </label>
          <div className="p-2.5 bg-white border border-[#E6EAF1] rounded text-xs space-y-1.5">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#808495]">Database:</span>
              <span className="font-mono font-semibold text-[#00618A]">student_management_db</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#808495]">Port:</span>
              <span className="font-mono text-[#555]">3306 (Standard)</span>
            </div>
            <a
              href="/api/mysql/export"
              download="student_management_workbench.sql"
              className="mt-2 w-full py-1.5 px-2 bg-[#F0F2F6] hover:bg-[#E6EAF1] text-[#31333F] rounded text-xs font-medium flex items-center justify-center gap-1.5 border border-[#D6DADE] transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#00618A]" />
              <span>Download .sql Script</span>
            </a>
          </div>
        </div>
      </div>

      {/* Streamlit Version & Footnote */}
      <div className="pt-4 border-t border-[#E6EAF1] text-[11px] text-[#808495] flex items-center justify-between">
        <span>Streamlit v1.38.0</span>
        <span className="flex items-center gap-1">
          Python 3.11 <ExternalLink className="w-3 h-3" />
        </span>
      </div>
    </aside>
  );
};
