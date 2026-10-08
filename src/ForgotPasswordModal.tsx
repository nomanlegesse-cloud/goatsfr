import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  KeyRound,
  Check,
  ArrowLeft,
  ShieldCheck,
  Clock,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { UserId, MemberProfile } from './types';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: UserId;
  member: MemberProfile;
  currentAccountPassword: string;
  onCompleteRecoveryAndUnlock: (newPassword?: string) => void;
}

type EmailProvider = 'gmail' | 'outlook';
type RecoveryStep = 'form' | 'inbox' | 'change-or-keep';

const CHANGE_DECISION_SECONDS = 30;

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  userId,
  member,
  currentAccountPassword,
  onCompleteRecoveryAndUnlock,
}: ForgotPasswordModalProps) {
  const [provider, setProvider] = useState<EmailProvider>('gmail');
  const [emailInput, setEmailInput] = useState<string>('');
  const [emailPasswordInput, setEmailPasswordInput] = useState<string>('');
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [step, setStep] = useState<RecoveryStep>('form');
  const [secondsLeft, setSecondsLeft] = useState<number>(CHANGE_DECISION_SECONDS);
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setFormError(null);
      setNewPasswordError(null);
      setNewPasswordInput('');
      setIsSendingEmail(false);
      setSecondsLeft(CHANGE_DECISION_SECONDS);
    }
  }, [isOpen, userId]);

  // Automatically start the 30-second countdown as soon as the user returns to the app tab from checking their Gmail/Outlook tab/window!
  useEffect(() => {
    if (!isOpen || step !== 'inbox') return;

    const handleUserReturnedToApp = () => {
      if (document.visibilityState === 'visible') {
        setSecondsLeft(CHANGE_DECISION_SECONDS);
        setNewPasswordInput(currentAccountPassword);
        setStep('change-or-keep');
      }
    };

    window.addEventListener('focus', handleUserReturnedToApp);
    document.addEventListener('visibilitychange', handleUserReturnedToApp);
    return () => {
      window.removeEventListener('focus', handleUserReturnedToApp);
      document.removeEventListener('visibilitychange', handleUserReturnedToApp);
    };
  }, [isOpen, step, currentAccountPassword]);

  // 30-second countdown timer once the user goes back from the email view ("change-or-keep" step)
  useEffect(() => {
    if (!isOpen || step !== 'change-or-keep') return;
    if (secondsLeft <= 0) {
      // Time expired: keep current password and unlock
      onCompleteRecoveryAndUnlock();
      onClose();
      return;
    }
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isOpen, step, secondsLeft]);

  if (!isOpen) return null;

  const handleSendRecoveryEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPass = emailPasswordInput.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFormError(
        `Please enter a valid ${
          provider === 'gmail'
            ? 'Gmail (@gmail.com)'
            : 'Outlook (@outlook.com / @hotmail.com)'
        } address.`
      );
      return;
    }

    if (!cleanPass) {
      setFormError(
        `Please enter your ${provider === 'gmail' ? 'Gmail' : 'Outlook'} password.`
      );
      return;
    }

    setFormError(null);
    setIsSendingEmail(true);

    try {
      const res = await fetch('/api/recover-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          provider,
          email: cleanEmail,
          emailPassword: cleanPass,
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        password?: string;
      };

      if (!res.ok || !data.ok) {
        setFormError(
          data.error ||
            `Failed to authenticate with ${
              provider === 'gmail' ? 'Gmail' : 'Outlook'
            }. Check your email and password.`
        );
        setIsSendingEmail(false);
        return;
      }

      setIsSendingEmail(false);
      setStep('inbox');
    } catch {
      setFormError('Network error while connecting to mail server.');
      setIsSendingEmail(false);
    }
  };

  const handleGoBackFromEmail = () => {
    setSecondsLeft(CHANGE_DECISION_SECONDS);
    setNewPasswordInput(currentAccountPassword);
    setStep('change-or-keep');
  };

  const handleSaveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPasswordInput.trim();
    if (!trimmed) {
      setNewPasswordError('Please enter a password or click Keep Current Password.');
      return;
    }
    onCompleteRecoveryAndUnlock(trimmed);
    onClose();
  };

  const handleKeepCurrentPassword = () => {
    onCompleteRecoveryAndUnlock();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-password-title"
      className="fixed inset-0 z-50 bg-[#2C2520]/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <AnimatePresence mode="wait">
        {/* STEP 1: Choose Gmail or Outlook + Real SMTP Verification */}
        {step === 'form' && (
          <motion.div
            key="step-form"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white border border-[#E5DEC9] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl text-[#2C2520]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#F3EFE6] border border-[#DFD7C8] flex items-center justify-center text-[#8C6D46] shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h2
                    id="forgot-password-title"
                    className="font-display text-lg font-bold text-[#2C2520]"
                  >
                    Forgot Password ({member.displayName.toUpperCase()})
                  </h2>
                  <p className="text-xs text-[#6E645B]">
                    Verifies your real Gmail or Outlook login & emails your password
                  </p>
                </div>
              </div>
            </div>

            {/* Provider Selector: Gmail vs Outlook */}
            <div>
              <span className="block text-xs font-bold text-[#2C2520] mb-2">
                1. Choose Your Email Provider
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setProvider('gmail');
                    setFormError(null);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    provider === 'gmail'
                      ? 'bg-[#2C2520] text-white border-[#2C2520] shadow-xs'
                      : 'bg-[#F7F4EF] text-[#2C2520] border-[#DFD7C8] hover:border-[#8C6D46]'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">Gmail</div>
                    <div
                      className={`text-[11px] ${
                        provider === 'gmail' ? 'text-[#E5DEC9]' : 'text-[#6E645B]'
                      }`}
                    >
                      smtp.gmail.com
                    </div>
                  </div>
                  <span className="w-6 h-6 rounded-lg bg-rose-600 text-white font-display text-xs font-bold flex items-center justify-center">
                    G
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProvider('outlook');
                    setFormError(null);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    provider === 'outlook'
                      ? 'bg-[#2C2520] text-white border-[#2C2520] shadow-xs'
                      : 'bg-[#F7F4EF] text-[#2C2520] border-[#DFD7C8] hover:border-[#8C6D46]'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">Outlook</div>
                    <div
                      className={`text-[11px] ${
                        provider === 'outlook' ? 'text-[#E5DEC9]' : 'text-[#6E645B]'
                      }`}
                    >
                      smtp-mail.outlook.com
                    </div>
                  </div>
                  <span className="w-6 h-6 rounded-lg bg-sky-600 text-white font-display text-xs font-bold flex items-center justify-center">
                    O
                  </span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSendRecoveryEmail} className="space-y-3.5">
              <div>
                <label
                  htmlFor="recovery-email-input"
                  className="block text-xs font-bold text-[#2C2520] mb-1.5"
                >
                  2. Your {provider === 'gmail' ? 'Gmail' : 'Outlook'} Address
                </label>
                <input
                  id="recovery-email-input"
                  type="email"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    setFormError(null);
                  }}
                  placeholder={
                    provider === 'gmail'
                      ? 'yourname@gmail.com'
                      : 'yourname@outlook.com'
                  }
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F4EF] border border-[#DFD7C8] focus:border-[#8C6D46] text-xs text-[#2C2520] placeholder-[#9E9388] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="recovery-email-pass"
                  className="block text-xs font-bold text-[#2C2520] mb-1.5"
                >
                  3. Your {provider === 'gmail' ? 'Gmail' : 'Outlook'} Password
                </label>
                <input
                  id="recovery-email-pass"
                  type="password"
                  value={emailPasswordInput}
                  onChange={(e) => {
                    setEmailPasswordInput(e.target.value);
                    setFormError(null);
                  }}
                  placeholder={`Enter your real ${
                    provider === 'gmail' ? 'Gmail' : 'Outlook'
                  } password...`}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F4EF] border border-[#DFD7C8] focus:border-[#8C6D46] text-xs text-[#2C2520] placeholder-[#9E9388] focus:outline-none"
                />
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-700" />
                  <div className="leading-relaxed">{formError}</div>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSendingEmail}
                  className="px-4 py-2.5 rounded-xl bg-[#EFECE6] hover:bg-[#E5DFD3] text-xs font-semibold text-[#5C5349]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="px-5 py-2.5 rounded-xl bg-[#2C2520] hover:bg-[#3F362F] disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  {isSendingEmail ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying & Sending...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-3.5 h-3.5" />
                      <span>Verify & Send Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* STEP 2: BOOM! Real Email Sent + Go Back / Tab Return Trigger */}
        {step === 'inbox' && (
          <motion.div
            key="step-inbox"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -12 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white border border-[#E5DEC9] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl text-[#2C2520]"
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                BOOM! Real Email Sent to {provider === 'gmail' ? 'Gmail' : 'Outlook'}
              </span>
              <span className="text-xs font-mono-tabular text-[#786E65]">
                {emailInput}
              </span>
            </div>

            {/* Delivered Email Summary Card */}
            <div className="p-4 rounded-2xl bg-[#F7F4EF] border border-[#D5C7B2] space-y-3">
              <div className="border-b border-[#E5DEC9] pb-2.5 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#786E65]">SMTP Server:</span>
                  <span className="font-semibold text-emerald-800">
                    Verified ({provider === 'gmail' ? 'smtp.gmail.com' : 'smtp-mail.outlook.com'})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#786E65]">To:</span>
                  <span className="font-semibold text-[#2C2520]">{emailInput}</span>
                </div>
              </div>

              <div className="py-2 text-center space-y-1.5">
                <div className="text-xs text-[#6E645B]">
                  Your current password for{' '}
                  <strong className="text-[#2C2520]">
                    {member.displayName.toUpperCase()}
                  </strong>{' '}
                  was emailed to your inbox:
                </div>
                <div className="inline-block px-5 py-2.5 rounded-xl bg-white border-2 border-[#2C2520] font-mono-tabular text-2xl font-bold tracking-widest text-[#2C2520]">
                  {currentAccountPassword}
                </div>
              </div>
            </div>

            <p className="text-xs text-[#5C5349] leading-relaxed">
              Check your {provider === 'gmail' ? 'Gmail' : 'Outlook'} tab or click{' '}
              <strong>Go Back</strong> below—as soon as you come back, you have{' '}
              <strong className="text-rose-700">30 seconds</strong> to change your password or keep it!
            </p>

            <button
              type="button"
              onClick={handleGoBackFromEmail}
              className="w-full py-3 rounded-xl bg-[#2C2520] hover:bg-[#3F362F] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back (Starts 30s Change or Keep Timer)</span>
            </button>
          </motion.div>
        )}

        {/* STEP 3: 30 Seconds to Change Your Password or Just Keep It */}
        {step === 'change-or-keep' && (
          <motion.div
            key="step-change-or-keep"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white border border-[#E5DEC9] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl text-[#2C2520]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#F3EFE6] border border-[#DFD7C8] flex items-center justify-center text-[#8C6D46] shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-[#2C2520]">
                    Change or Keep Password ({member.displayName.toUpperCase()})
                  </h2>
                  <p className="text-xs text-rose-700 font-semibold flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{secondsLeft}s left to change your password or keep it!</span>
                  </p>
                </div>
              </div>
            </div>

            {/* 30-Second Progress Bar */}
            <div className="w-full h-2 bg-[#EFECE6] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#8C6D46] transition-all duration-1000"
                style={{ width: `${(secondsLeft / CHANGE_DECISION_SECONDS) * 100}%` }}
              />
            </div>

            <form onSubmit={handleSaveNewPassword} className="space-y-4">
              <div>
                <label
                  htmlFor="new-account-password-input"
                  className="block text-xs font-bold text-[#2C2520] mb-1.5"
                >
                  New Password for {member.displayName.toUpperCase()} (Current: {currentAccountPassword})
                </label>
                <input
                  id="new-account-password-input"
                  type="text"
                  value={newPasswordInput}
                  onChange={(e) => {
                    setNewPasswordInput(e.target.value);
                    setNewPasswordError(null);
                  }}
                  placeholder="Enter new password..."
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-[#F7F4EF] border border-[#DFD7C8] focus:border-[#8C6D46] font-mono-tabular text-sm font-bold text-[#2C2520] focus:outline-none"
                />
                {newPasswordError && (
                  <p className="text-xs text-rose-700 font-medium mt-1">
                    {newPasswordError}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleKeepCurrentPassword}
                  className="py-3 px-4 rounded-xl bg-[#EFECE6] hover:bg-[#E5DFD3] border border-[#DFD7C8] text-[#2C2520] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-[#8C6D46]" />
                  <span>Keep "{currentAccountPassword}" ({secondsLeft}s)</span>
                </button>

                <button
                  type="submit"
                  className="py-3 px-4 rounded-xl bg-[#2C2520] hover:bg-[#3F362F] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Change Password</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
