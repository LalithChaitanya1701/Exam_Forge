import React, { useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { LogIn, UserPlus, Lock, Mail, User as UserIcon, BookOpen, AlertCircle, Sparkles } from 'lucide-react';

interface AuthPageProps {
  onAuthSuccess: (user: User) => void;
  onCancel: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onAuthSuccess,
  onCancel,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [targetExam, setTargetExam] = useState('Competitive Engineering & Medical CBTs');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        const user = await api.register(name, email, password, targetExam);
        onAuthSuccess(user);
      } else {
        const user = await api.login(email, password);
        onAuthSuccess(user);
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await api.login('alex@example.com', 'password123');
      onAuthSuccess(user);
    } catch {
      // If demo user wasn't registered yet, register and login
      try {
        const user = await api.register('Alex Turner', 'alex@example.com', 'password123', 'Engineering & Science CBT Exams');
        onAuthSuccess(user);
      } catch (err: unknown) {
        setError((err as Error).message || 'Demo login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-xl max-w-md w-full p-7 sm:p-9 transition-colors">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--c-sky)] to-[var(--c-navy)] text-white flex items-center justify-center font-bold text-lg mx-auto mb-3 shadow-sm">
            EF
          </div>
          <h2 className="font-serif text-2xl font-bold text-[var(--text)]">
            {isRegister ? 'Create an ExamForge Account' : 'Sign in to ExamForge'}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1.5">
            {isRegister
              ? 'Save your custom exams and access detailed test analytics anytime.'
              : 'Welcome back. Access your test history, solutions, and performance reports.'}
          </p>
        </div>

        {/* Demo Login Banner */}
        <div className="mb-6 p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between gap-3">
          <div className="text-xs">
            <span className="font-bold text-[var(--text)]">Quick Tester?</span>
            <span className="text-[var(--muted)] block">Instant access with 1-click</span>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[var(--c-navy)] text-white hover:brightness-110 shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Demo Login</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text)] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Turner"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-2 focus:outline-[var(--c-sky)]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text)] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-2 focus:outline-[var(--c-sky)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text)] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-2 focus:outline-[var(--c-sky)]"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text)] mb-1.5">
                Target Exam / Field
              </label>
              <div className="relative">
                <BookOpen className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="text"
                  placeholder="e.g. SAT, JEE, Medical, Civil Services"
                  value={targetExam}
                  onChange={e => setTargetExam(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-2 focus:outline-[var(--c-sky)]"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm text-white bg-[var(--c-navy)] hover:brightness-110 shadow-md active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {isRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            <span>{loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}</span>
          </button>
        </form>

        {/* Switch mode */}
        <div className="mt-6 text-center text-xs text-[var(--muted)]">
          {isRegister ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(false); setError(null); }}
                className="font-bold text-[var(--c-sky)] hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(true); setError(null); }}
                className="font-bold text-[var(--c-sky)] hover:underline cursor-pointer"
              >
                Register now
              </button>
            </span>
          )}
        </div>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-[var(--muted)] hover:text-[var(--text)] underline cursor-pointer"
          >
            Cancel and continue as guest
          </button>
        </div>
      </div>
    </div>
  );
};
