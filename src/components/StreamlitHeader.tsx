import React from 'react';
import { RefreshCw, Sparkles, Shield, ShieldAlert, Database } from 'lucide-react';
import { triggerStreamlitBalloons } from '../utils/balloons.ts';

interface StreamlitHeaderProps {
  isRunning: boolean;
  onRerun: () => void;
  unlockedKey: string | null;
  onOpenSecretModal: () => void;
  onLockSession: () => void;
  totalStudents: number;
}

export const StreamlitHeader: React.FC<StreamlitHeaderProps> = ({
  isRunning,
  onRerun,
  unlockedKey,
  onOpenSecretModal,
  onLockSession,
  totalStudents,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#E6EAF1] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {/* Streamlit Top Red Accent Bar */}
      <div className="h-[3px] bg-gradient-to-r from-[#FF4B4B] via-[#FF7575] to-[#FF4B4B]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Left: Streamlit Identity & App Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold tracking-tight text-lg text-[#31333F]">
            {/* Streamlit Red Triangle Symbol */}
            <div className="w-6 h-6 rounded flex items-center justify-center bg-[#FF4B4B]/10 text-[#FF4B4B]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 19.5H22L12 2Z" />
              </svg>
            </div>
            <span className="hidden sm:inline">Streamlit</span>
            <span className="text-[#808495] font-normal text-sm">/ student_portal.py</span>
          </div>

          {/* Running / Ready indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-[#F0F2F6] text-[#555]">
            <span
              className={`w-2 h-2 rounded-full ${
                isRunning ? 'bg-[#FF4B4B] st-running-dot' : 'bg-[#00D4B2]'
              }`}
            />
            <span>{isRunning ? 'RUNNING...' : 'READY'}</span>
          </div>
        </div>

        {/* Right: Actions & Secret Key Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Secret Key Badge */}
          {unlockedKey ? (
            <button
              onClick={onLockSession}
              title="Session Authenticated with Secret Key. Click to lock."
              className="flex items-center gap-1.5 px-3 py-1 rounded border border-[#00D4B2]/40 bg-[#00D4B2]/10 text-[#008771] text-xs font-medium hover:bg-[#00D4B2]/20 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-[#008771]" />
              <span className="hidden md:inline">Admin Unlocked</span>
              <span className="text-[10px] underline ml-1">Lock</span>
            </button>
          ) : (
            <button
              onClick={onOpenSecretModal}
              title="Click to authenticate with Secret Key"
              className="flex items-center gap-1.5 px-3 py-1 rounded border border-[#FF4B4B]/30 bg-[#FF4B4B]/5 text-[#FF4B4B] text-xs font-medium hover:bg-[#FF4B4B]/10 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Secret Key Required</span>
              <span className="text-[10px] underline ml-1">Unlock</span>
            </button>
          )}

          {/* MySQL DB Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#555] bg-[#F8F9FB] border border-[#E6EAF1] px-2.5 py-1 rounded">
            <Database className="w-3.5 h-3.5 text-[#00618A]" />
            <span>MySQL Workbench:</span>
            <span className="font-mono text-[#00618A] font-semibold">student_management_db</span>
            <span className="bg-[#E6EAF1] text-[#555] px-1.5 py-0.2 rounded text-[11px] font-mono">
              {totalStudents} records
            </span>
          </div>

          {/* Balloons celebration button (Streamlit Easter Egg) */}
          <button
            onClick={() => triggerStreamlitBalloons()}
            title="Celebrate with Streamlit Balloons! 🎈"
            className="p-1.5 text-[#808495] hover:text-[#FF4B4B] hover:bg-[#F0F2F6] rounded transition-colors"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Rerun button: st.rerun() */}
          <button
            onClick={onRerun}
            disabled={isRunning}
            title="Rerun Streamlit Script (st.rerun)"
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium bg-[#F0F2F6] hover:bg-[#E6EAF1] text-[#31333F] transition-colors border border-[#D6DADE]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin text-[#FF4B4B]' : ''}`} />
            <span className="hidden sm:inline">Rerun</span>
          </button>
        </div>
      </div>
    </header>
  );
};
