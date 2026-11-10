import React, { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, AlertCircle, CheckCircle, X } from 'lucide-react';
import { verifySecretKeyApi } from '../utils/api.ts';

interface SecretKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (key: string, persistSession: boolean) => void;
  actionTitle?: string;
  actionDescription?: string;
}

export const SecretKeyModal: React.FC<SecretKeyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  actionTitle = 'Admin Authorization Required',
  actionDescription = 'Enter the secret key to modify or delete student records in the MySQL database.',
}) => {
  const [keyInput, setKeyInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) {
      setErrorMsg('Please enter the secret key.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    try {
      const isValid = await verifySecretKeyApi(keyInput.trim());
      if (isValid) {
        onSuccess(keyInput.trim(), rememberSession);
        onClose();
        setKeyInput('');
      } else {
        setErrorMsg('Invalid Secret Key. Default key is ADMIN@2025');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error connecting to auth service.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUseDefault = () => {
    setKeyInput('ADMIN@2025');
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-lg shadow-xl border border-[#D6DADE] max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Streamlit Red Header Strip */}
        <div className="h-1 bg-[#FF4B4B]" />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FF4B4B]/10 flex items-center justify-center text-[#FF4B4B] shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#31333F]">{actionTitle}</h3>
                <p className="text-xs text-[#808495] mt-0.5">{actionDescription}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[#808495] hover:text-[#31333F] p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#31333F] mb-1">
                Admin Secret Key (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#808495]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoFocus
                  required
                  placeholder="Enter secret key..."
                  value={keyInput}
                  onChange={(e) => {
                    setKeyInput(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className="w-full pl-9 pr-10 py-2 text-sm border border-[#D6DADE] rounded bg-white text-[#31333F] focus:outline-none focus:ring-2 focus:ring-[#FF4B4B] focus:border-[#FF4B4B]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#808495] hover:text-[#31333F]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Quick default key helper */}
              <div className="mt-2 flex items-center justify-between text-xs text-[#808495]">
                <span>Default Key: <code className="bg-[#F0F2F6] px-1.5 py-0.5 rounded text-[#31333F] font-mono">ADMIN@2025</code></span>
                <button
                  type="button"
                  onClick={handleUseDefault}
                  className="text-[#FF4B4B] hover:underline font-medium"
                >
                  Fill Default
                </button>
              </div>
            </div>

            {/* Remember for Session Checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberSession"
                checked={rememberSession}
                onChange={(e) => setRememberSession(e.target.checked)}
                className="rounded border-[#D6DADE] text-[#FF4B4B] focus:ring-[#FF4B4B]"
              />
              <label htmlFor="rememberSession" className="text-xs text-[#555] cursor-pointer">
                Unlock admin session for current tab (Streamlit Session State)
              </label>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-2.5 rounded bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6EAF1]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-[#555] hover:text-[#31333F] hover:bg-[#F0F2F6] rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isVerifying}
                className="px-4 py-2 text-xs font-medium bg-[#FF4B4B] hover:bg-[#E03E3E] text-white rounded transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Authorize Action</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
