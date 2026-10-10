import React, { useState } from 'react';
import { Attempt, User, Exam } from '../types';
import {
  User as UserIcon,
  LogOut,
  Mail,
  BookOpen,
  Award,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Clock,
  Printer,
  RotateCcw,
  Trash2,
  Eye,
  ArrowLeft,
  Search,
  Layers,
  Edit2,
  Check,
  PlusCircle,
  FileText
} from 'lucide-react';

interface ProfileViewProps {
  user: User | null;
  attempts: Attempt[];
  selectedAttempt: Attempt | null;
  onSelectAttempt: (attempt: Attempt | null) => void;
  onRetakeAttempt: (attempt: Attempt) => void;
  onDeleteAttempt: (id: string) => Promise<void>;
  onUpdateProfile: (name: string, targetExam: string) => Promise<void>;
  onLogout: () => void;
  onNavigateCreate: () => void;
  onNavigateAuth: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  attempts,
  selectedAttempt,
  onSelectAttempt,
  onRetakeAttempt,
  onDeleteAttempt,
  onUpdateProfile,
  onLogout,
  onNavigateCreate,
  onNavigateAuth,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || 'Candidate');
  const [examInput, setExamInput] = useState(user?.targetExam || 'General Competitive Tests');
  const [reportSubTab, setReportSubTab] = useState<'summary' | 'solutions'>('summary');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const pad = (n: number) => (n < 10 ? '0' : '') + n;
    return `${pad(m)}:${pad(s)}`;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateProfile(nameInput, examInput);
    setIsEditingProfile(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this test report record?')) {
      setDeletingId(id);
      try {
        await onDeleteAttempt(id);
        if (selectedAttempt?.id === id) {
          onSelectAttempt(null);
        }
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handlePrint = (att: Attempt) => {
    const printEl = document.getElementById('printSheet');
    if (!printEl) return;

    let html = `
      <div style="font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; color: #111;">
        <h1 style="font-size: 24px; margin-bottom: 4px; border-bottom: 2px solid #333; padding-bottom: 8px;">
          ${escapeHtml(att.examTitle)} — Scorecard &amp; Solutions
        </h1>
        <div style="font-size: 14px; color: #555; margin-bottom: 20px;">
          Student: ${escapeHtml(user?.name || 'Candidate')} | Date: ${new Date(att.date).toLocaleString()} | Time: ${formatTime(att.timeTakenSec)}
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; padding: 12px; background: #f4f4f4; border-radius: 8px;">
          <div><b>Score:</b> ${att.score} / ${att.total} (${att.percentage}%)</div>
          <div><b>Correct:</b> ${att.correct}</div>
          <div><b>Incorrect:</b> ${att.wrong}</div>
          <div><b>Unattempted:</b> ${att.unattempted}</div>
        </div>
        <hr style="margin-bottom: 24px; border: 0; border-top: 1px solid #ccc;" />
        <h2 style="font-size: 18px; margin-bottom: 16px;">Question Solutions &amp; Explanations</h2>
    `;

    att.questionsSnapshot.forEach((q, i) => {
      const given = att.answers[q.id];
      const isCorrect = given === q.answer;
      html += `
        <div class="p-q" style="page-break-inside: avoid; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 16px;">
          <p style="margin: 0 0 8px; font-weight: bold;">
            Q${i + 1}. [${escapeHtml(q.section)}] ${escapeHtml(q.text)} (${q.marks} Marks)
          </p>
          <div style="margin-left: 12px; margin-bottom: 8px;">
      `;

      q.options.forEach(opt => {
        let tag = '';
        let color = '#222';
        if (opt.label === q.answer) {
          tag = ' <b>(Correct Answer)</b>';
          color = '#2fa64b';
        } else if (opt.label === given && !isCorrect) {
          tag = ' <b>(Your Choice)</b>';
          color = '#d6483b';
        }
        html += `<div style="color: ${color}; margin-bottom: 4px;">${opt.label}) ${escapeHtml(opt.text)} ${tag}</div>`;
      });

      html += `</div>`;
      if (given == null) {
        html += `<p style="font-style: italic; color: #888; margin: 4px 0;">You did not attempt this question.</p>`;
      }
      if (q.explanation) {
        html += `<p style="margin: 6px 0; background: #f9f9f9; padding: 8px; border-left: 3px solid #2f5fd6; font-size: 13px;"><b>Explanation:</b> ${escapeHtml(q.explanation)}</p>`;
      }
      html += `</div>`;
    });

    html += `</div>`;
    printEl.innerHTML = html;
    window.print();
  };

  const escapeHtml = (str: string) => {
    return String(str || '').replace(/[&<>"']/g, c => {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c] || c;
    });
  };

  // Performance calculations
  const totalAttempts = attempts.length;
  const avgPercentage = totalAttempts > 0
    ? Math.round((attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / totalAttempts) * 10) / 10
    : 0;
  const highestScore = totalAttempts > 0
    ? Math.max(...attempts.map(a => a.score))
    : 0;
  const totalCorrectQuestions = attempts.reduce((sum, a) => sum + (a.correct || 0), 0);
  const totalQuestionsAttempted = attempts.reduce((sum, a) => sum + (a.correct || 0) + (a.wrong || 0), 0);

  const filteredAttempts = attempts.filter(a =>
    a.examTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-[920px] mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full animate-fade-in">
      {/* User Profile Card */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-[var(--shadow)] mb-8 transition-colors">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[var(--c-sky)] to-[var(--c-navy)] text-white flex items-center justify-center font-bold text-xl sm:text-2xl shadow-md shrink-0">
              {user ? user.name.slice(0, 2).toUpperCase() : 'EF'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-xl sm:text-2xl font-bold text-[var(--text)]">
                  {user ? user.name : 'Guest User'}
                </h1>
                {user && (
                  <button
                    onClick={() => {
                      setNameInput(user.name);
                      setExamInput(user.targetExam || '');
                      setIsEditingProfile(!isEditingProfile);
                    }}
                    className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                    title="Edit profile"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--muted)] mt-1">
                {user ? (
                  <>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{user.email}</span>
                    </span>
                    <span className="flex items-center gap-1 text-[var(--c-sky)] font-medium">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{user.targetExam || 'General CBT'}</span>
                    </span>
                  </>
                ) : (
                  <span>Sign in to save exams across all devices</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <button
                onClick={onLogout}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[var(--muted)] hover:text-red-500 bg-[var(--surface-2)] border border-[var(--border)] hover:bg-red-500/10 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                onClick={onNavigateAuth}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[var(--c-navy)] hover:brightness-110 shadow-xs transition-all cursor-pointer"
              >
                Sign In / Register
              </button>
            )}
          </div>
        </div>

        {/* Profile Edit Modal / Form */}
        {isEditingProfile && user && (
          <form onSubmit={handleSaveProfile} className="mt-6 pt-5 border-t border-[var(--border)] grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text)] mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-2 focus:outline-[var(--c-sky)]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text)] mb-1">
                Target Exam / Field
              </label>
              <input
                type="text"
                value={examInput}
                onChange={e => setExamInput(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-2 focus:outline-[var(--c-sky)]"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2 mt-1">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--border)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-[var(--c-navy)] hover:brightness-110 cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Profile</span>
              </button>
            </div>
          </form>
        )}

        {/* Overall KPI Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-[var(--border)]">
          <div>
            <div className="font-mono text-xl sm:text-2xl font-black text-[var(--text)]">{totalAttempts}</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mt-0.5">Tests Completed</div>
          </div>
          <div>
            <div className="font-mono text-xl sm:text-2xl font-black text-[var(--c-sky)]">{avgPercentage}%</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mt-0.5">Average Accuracy</div>
          </div>
          <div>
            <div className="font-mono text-xl sm:text-2xl font-black text-[var(--c-green-dot)]">{highestScore}</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mt-0.5">Top Score Marks</div>
          </div>
          <div>
            <div className="font-mono text-xl sm:text-2xl font-black text-[var(--c-purple)]">{totalCorrectQuestions} / {totalQuestionsAttempted}</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mt-0.5">Questions Solved</div>
          </div>
        </div>
      </div>

      {/* Main Content Area: Test History OR Active Detailed Report */}
      {selectedAttempt ? (
        /* Detailed Embedded Test Report */
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-[var(--shadow)] animate-fade-in transition-colors">
          {/* Top navigation inside report */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[var(--border)]">
            <button
              onClick={() => onSelectAttempt(null)}
              className="text-xs sm:text-sm font-bold text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Test Records</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setReportSubTab('summary')}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  reportSubTab === 'summary'
                    ? 'bg-[var(--c-navy)] text-white shadow-xs'
                    : 'bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--border)]'
                }`}
              >
                Score Summary
              </button>
              <button
                onClick={() => setReportSubTab('solutions')}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  reportSubTab === 'solutions'
                    ? 'bg-[var(--c-navy)] text-white shadow-xs'
                    : 'bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--border)]'
                }`}
              >
                Solutions Review
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--muted)]">
                Completed on {new Date(selectedAttempt.date).toLocaleDateString()} at {new Date(selectedAttempt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--text)] tracking-tight">
                {selectedAttempt.examTitle}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePrint(selectedAttempt)}
                className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-[var(--surface-2)] border border-[var(--border)] hover:bg-[var(--border)] text-[var(--text)] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Sheet</span>
              </button>

              <button
                onClick={() => onRetakeAttempt(selectedAttempt)}
                className="px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[var(--c-navy)] hover:brightness-110 shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake</span>
              </button>
            </div>
          </div>

          {reportSubTab === 'summary' ? (
            <div>
              {/* Scorecard KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
                <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl p-4 text-center">
                  <Award className="w-5 h-5 mx-auto text-amber-500 mb-1" />
                  <div className="text-xl font-serif font-black text-[var(--text)]">
                    {selectedAttempt.score} <span className="text-xs text-[var(--muted)] font-sans">/ {selectedAttempt.total}</span>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mt-1">Score</div>
                </div>

                <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl p-4 text-center">
                  <div className="text-xl font-serif font-black text-[var(--c-sky)]">
                    {selectedAttempt.percentage}%
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mt-1">Accuracy</div>
                </div>

                <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl p-4 text-center">
                  <CheckCircle2 className="w-5 h-5 mx-auto text-[var(--c-green-dot)] mb-1" />
                  <div className="text-xl font-serif font-black text-[var(--c-green-dot)]">{selectedAttempt.correct}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mt-1">Correct</div>
                </div>

                <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl p-4 text-center">
                  <XCircle className="w-5 h-5 mx-auto text-[var(--c-red-dot)] mb-1" />
                  <div className="text-xl font-serif font-black text-[var(--c-red-dot)]">{selectedAttempt.wrong}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mt-1">Wrong</div>
                </div>

                <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl p-4 text-center">
                  <MinusCircle className="w-5 h-5 mx-auto text-[var(--muted)] mb-1" />
                  <div className="text-xl font-serif font-black text-[var(--muted)]">{selectedAttempt.unattempted}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mt-1">Skipped</div>
                </div>

                <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl p-4 text-center">
                  <Clock className="w-5 h-5 mx-auto text-[var(--c-prev)] mb-1" />
                  <div className="text-xl font-mono font-bold text-[var(--text)]">
                    {formatTime(selectedAttempt.timeTakenSec)}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mt-1">Time Taken</div>
                </div>
              </div>

              {/* Section Breakdown Table */}
              <div className="border border-[var(--border)] rounded-2xl overflow-hidden mb-6">
                <div className="bg-[var(--surface-2)] px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[var(--c-sky)]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                    Section-wise Performance Breakdown
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-[var(--muted)] uppercase font-semibold text-[11px]">
                        <th className="py-2.5 px-4">Section</th>
                        <th className="py-2.5 px-4 text-center">Questions</th>
                        <th className="py-2.5 px-4 text-center text-[var(--c-green-dot)]">Correct</th>
                        <th className="py-2.5 px-4 text-center text-[var(--c-red-dot)]">Wrong</th>
                        <th className="py-2.5 px-4 text-center text-[var(--muted)]">Skipped</th>
                        <th className="py-2.5 px-4 text-right">Marks Scored</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(selectedAttempt.bySection).map(([secName, sec]) => (
                        <tr key={secName} className="border-b border-[var(--border)]/60 hover:bg-[var(--surface-2)]/60">
                          <td className="py-3 px-4 font-bold text-[var(--text)]">{secName}</td>
                          <td className="py-3 px-4 text-center font-mono">{sec.total}</td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-[var(--c-green-dot)]">{sec.correct}</td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-[var(--c-red-dot)]">{sec.wrong}</td>
                          <td className="py-3 px-4 text-center font-mono text-[var(--muted)]">{sec.unattempted}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[var(--text)]">
                            {sec.marks} <span className="text-[var(--muted)] text-xs">/ {sec.marksTotal}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* Solutions View */
            <div className="space-y-6">
              {selectedAttempt.questionsSnapshot.map((q, idx) => {
                const given = selectedAttempt.answers[q.id];
                const isCorrect = given === q.answer;
                const isSkipped = given == null;

                return (
                  <div
                    key={q.id}
                    className="border border-[var(--border)] rounded-2xl p-5 bg-[var(--surface-2)] transition-colors"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--surface)] border border-[var(--c-sky)] text-[var(--c-sky)]">
                        {q.section || 'General'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)]">
                        Question {idx + 1}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)]">
                        +{q.marks || 4} marks
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isSkipped
                            ? 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]'
                            : isCorrect
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'
                        }`}
                      >
                        {isSkipped ? 'Not Attempted' : isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>

                    <div className="text-base font-medium text-[var(--text)] mb-4 leading-relaxed">
                      {q.text}
                    </div>

                    <div className="flex flex-col gap-2 mb-4">
                      {q.options.map(opt => {
                        const isOfficialCorrect = opt.label === q.answer;
                        const isUserChoice = opt.label === given;

                        let optClass = 'border-[var(--border)] bg-[var(--surface)]';
                        let punchClass = 'border-[var(--muted)] text-[var(--muted)] bg-[var(--surface)]';

                        if (isOfficialCorrect) {
                          optClass = 'border-[var(--c-green-dot)] bg-[var(--c-green-dot)]/10 font-semibold';
                          punchClass = 'border-[var(--c-green-dot)] bg-[var(--c-green-dot)] text-white';
                        } else if (isUserChoice && !isCorrect) {
                          optClass = 'border-[var(--c-red-dot)] bg-[var(--c-red-dot)]/10';
                          punchClass = 'border-[var(--c-red-dot)] bg-[var(--c-red-dot)] text-white';
                        }

                        return (
                          <div
                            key={opt.label}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 text-sm transition-all ${optClass}`}
                          >
                            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-bold text-xs shrink-0 ${punchClass}`}>
                              {opt.label}
                            </div>
                            <div className="flex-1">{opt.text}</div>
                            {isOfficialCorrect && (
                              <span className="text-xs font-bold text-[var(--c-green-dot)] flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Correct Answer
                              </span>
                            )}
                            {isUserChoice && !isCorrect && (
                              <span className="text-xs font-bold text-[var(--c-red-dot)] flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" /> Your Answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs sm:text-sm leading-relaxed">
                        <span className="font-bold text-[var(--c-navy)] dark:text-[var(--c-sky)]">Explanation: </span>
                        <span className="text-[var(--text)]">{q.explanation}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Test History Table */
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-[var(--shadow)] transition-colors">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[var(--text)]">
                Completed Test History &amp; Reports
              </h2>
              <p className="text-xs sm:text-sm text-[var(--muted)]">
                Click any test to inspect its complete performance report and answer key.
              </p>
            </div>

            <button
              onClick={onNavigateCreate}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-[var(--c-navy)] hover:brightness-110 shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Test</span>
            </button>
          </div>

          {totalAttempts > 0 && (
            <div className="mb-5 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type="text"
                placeholder="Search past tests by title..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs sm:text-sm focus:outline-2 focus:outline-[var(--c-sky)] transition-all"
              />
            </div>
          )}

          {filteredAttempts.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-[var(--muted)] mb-3 opacity-40" />
              <h4 className="font-serif text-base font-bold text-[var(--text)] mb-1">
                {searchTerm ? 'No matching tests found' : 'No tests taken yet'}
              </h4>
              <p className="text-xs text-[var(--muted)] max-w-sm mx-auto mb-5">
                {searchTerm
                  ? 'Try a different search keyword.'
                  : 'Take a test to see your full reports, section scores, and explanation review here.'}
              </p>
              <button
                onClick={onNavigateCreate}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[var(--c-navy)] hover:brightness-110 shadow-xs transition-all cursor-pointer"
              >
                Launch an Exam Now →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto border border-[var(--border)] rounded-2xl">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-[var(--surface-2)] border-b border-[var(--border)] text-[var(--muted)] uppercase font-bold text-[11px] tracking-wider">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Test Title</th>
                    <th className="py-3 px-4">Date Taken</th>
                    <th className="py-3 px-4">Time Taken</th>
                    <th className="py-3 px-4">Score &amp; Accuracy</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]/60">
                  {filteredAttempts.map((att, i) => {
                    const dateObj = new Date(att.date);
                    return (
                      <tr
                        key={att.id}
                        onClick={() => onSelectAttempt(att)}
                        className="hover:bg-[var(--surface-2)]/60 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 font-mono text-[var(--muted)]">{i + 1}</td>
                        <td className="py-3 px-4 font-bold text-[var(--text)] group-hover:text-[var(--c-sky)] transition-colors">
                          {att.examTitle}
                        </td>
                        <td className="py-3 px-4 text-[var(--muted)] text-xs whitespace-nowrap">
                          {dateObj.toLocaleDateString()} at {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-[var(--muted)] whitespace-nowrap">
                          {formatTime(att.timeTakenSec)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-[var(--text)]">
                            {att.score} / {att.total}
                          </span>
                          <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-bold bg-[var(--surface-2)] border border-[var(--border)] text-[var(--c-sky)]">
                            {att.percentage}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => onSelectAttempt(att)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[var(--c-navy)] text-white hover:brightness-110 flex items-center gap-1 transition-all cursor-pointer"
                              title="View Full Report"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Report</span>
                            </button>

                            <button
                              onClick={() => onRetakeAttempt(att)}
                              className="p-1.5 rounded-lg text-xs font-semibold bg-[var(--surface-2)] hover:bg-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--border)] transition-colors cursor-pointer"
                              title="Retake Exam"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={e => handleDelete(att.id, e)}
                              disabled={deletingId === att.id}
                              className="p-1.5 rounded-lg text-xs text-[var(--muted)] hover:text-red-500 bg-[var(--surface-2)] hover:bg-red-500/10 border border-[var(--border)] transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
