import React, { useState, useEffect, useRef } from 'react';
import { Exam, Question } from '../types';
import { playChime } from '../utils/parser';
import { Sun, Moon, Maximize2, AlertCircle, ChevronLeft, ChevronRight, Bookmark, Check, HelpCircle } from 'lucide-react';

interface ExamViewProps {
  exam: Exam;
  onFinishExam: (answers: Record<string, string>, marked: Record<string, boolean>, timeTakenSec: number) => void;
  soundEnabled: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const ExamView: React.FC<ExamViewProps> = ({
  exam,
  onFinishExam,
  soundEnabled,
  theme,
  onToggleTheme,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeSection, setActiveSection] = useState<string>(exam.sections[0] || 'General');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const [visited, setVisited] = useState<Record<string, boolean>>({ [exam.questions[0]?.id]: true });
  const [timeLeftSec, setTimeLeftSec] = useState<number>(exam.duration * 60);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const alertsFiredRef = useRef<Record<number, boolean>>({});
  const startTimeRef = useRef<number>(Date.now());

  // Toast auto-hide
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Main countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeftSec(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (soundEnabled) playChime(440, 0.6);
          setToastMessage('Time is up! Submitting your test automatically...');
          setTimeout(() => handleFinalSubmit(true), 1200);
          return 0;
        }

        const next = prev - 1;
        const thresholds = [30 * 60, 20 * 60, 10 * 60, 5 * 60, 1 * 60];
        thresholds.forEach(t => {
          if (next === t && t < exam.duration * 60 && !alertsFiredRef.current[t]) {
            alertsFiredRef.current[t] = true;
            if (soundEnabled) playChime(780, 0.35);
            setToastMessage(`⏰ ${Math.round(t / 60)} minute${t === 60 ? '' : 's'} remaining!`);
          }
        });

        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [exam.duration, soundEnabled]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSubmitModal) return;

      const q = exam.questions[currentIndex];
      if (!q) return;

      if (e.key === 'ArrowRight' && currentIndex < exam.questions.length - 1) {
        goToQuestion(currentIndex + 1);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        goToQuestion(currentIndex - 1);
      } else if (e.key.toLowerCase() === 'm') {
        toggleMark();
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (q.options[idx]) {
          selectAnswer(q.id, q.options[idx].label);
        }
      } else if (['a', 'b', 'c', 'd'].includes(e.key.toLowerCase())) {
        const label = e.key.toUpperCase();
        if (q.options.some(o => o.label === label)) {
          selectAnswer(q.id, label);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, exam.questions, showSubmitModal]);

  const currentQ: Question = exam.questions[currentIndex];

  const goToQuestion = (idx: number) => {
    if (idx < 0 || idx >= exam.questions.length) return;
    setCurrentIndex(idx);
    const targetQ = exam.questions[idx];
    setVisited(prev => ({ ...prev, [targetQ.id]: true }));
    if (targetQ.section) {
      setActiveSection(targetQ.section);
    }
  };

  const jumpToSection = (sec: string) => {
    setActiveSection(sec);
    const firstIdx = exam.questions.findIndex(q => q.section === sec);
    if (firstIdx !== -1) {
      goToQuestion(firstIdx);
    }
  };

  const selectAnswer = (qid: string, label: string) => {
    setAnswers(prev => {
      // Toggle if already selected
      if (prev[qid] === label) {
        const copy = { ...prev };
        delete copy[qid];
        return copy;
      }
      return { ...prev, [qid]: label };
    });
  };

  const toggleMark = () => {
    if (!currentQ) return;
    setMarked(prev => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }));
  };

  const clearCurrentResponse = () => {
    if (!currentQ) return;
    setAnswers(prev => {
      const copy = { ...prev };
      delete copy[currentQ.id];
      return copy;
    });
  };

  const handleFinalSubmit = (auto = false) => {
    setShowSubmitModal(false);
    const timeTaken = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
    onFinishExam(answers, marked, timeTaken);
  };

  const getQuestionStatus = (q: Question) => {
    const isAnswered = answers[q.id] != null;
    const isMarked = Boolean(marked[q.id]);
    const isVisited = Boolean(visited[q.id]);

    if (isMarked) return isAnswered ? 'marked-ans' : 'marked-un';
    if (isAnswered) return 'answered';
    if (isVisited) return 'unanswered';
    return 'not-visited';
  };

  const formatTimer = (totalSec: number) => {
    const sec = Math.max(0, totalSec);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const pad = (n: number) => (n < 10 ? '0' : '') + n;
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };

  const isLowTime = timeLeftSec <= 5 * 60;
  const isLastQuestion = currentIndex === exam.questions.length - 1;
  const isMarkedCurrent = Boolean(marked[currentQ?.id]);

  // Modal stats
  const answeredCount = Object.keys(answers).length;
  const unattemptedCount = exam.questions.length - answeredCount;
  const markedCount = Object.values(marked).filter(Boolean).length;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] transition-colors">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 bg-[var(--c-navy)] text-white px-5 py-2.5 rounded-xl shadow-xl font-medium text-sm flex items-center gap-2 animate-bounce">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Exam Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 bg-[var(--surface)] border-b border-[var(--border)] shadow-xs">
        {/* Section Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 flex-1 min-w-[200px] no-scrollbar">
          {exam.sections.map(sec => {
            const isActive = activeSection === sec;
            const countInSection = exam.questions.filter(q => q.section === sec).length;
            return (
              <button
                key={sec}
                onClick={() => jumpToSection(sec)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[var(--c-sky)] border-[var(--c-sky)] text-white shadow-xs'
                    : 'border-[var(--c-sky)] text-[var(--c-sky)] bg-transparent hover:bg-[var(--c-sky)]/10'
                }`}
              >
                <span>{sec}</span>
                <span className="ml-1.5 text-[11px] opacity-80">({countInSection})</span>
              </button>
            );
          })}
        </div>

        {/* Right Header items */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onToggleTheme}
            className="w-9 h-9 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>

          {/* Countdown timer */}
          <div
            className={`font-mono font-bold text-base sm:text-xl px-3.5 py-1.5 rounded-xl border-2 flex items-center justify-center min-w-[100px] tracking-wider transition-all ${
              isLowTime
                ? 'bg-red-500/10 border-[var(--c-red)] text-[var(--c-red)] animate-timer-pulse shadow-md'
                : 'bg-red-500/5 border-[var(--c-red)] text-[var(--c-red)]'
            }`}
            title="Time Remaining"
          >
            <span>{formatTimer(timeLeftSec)}</span>
          </div>

          <button
            onClick={() => {
              try {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {});
                } else {
                  document.exitFullscreen().catch(() => {});
                }
              } catch {}
            }}
            className="w-9 h-9 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer hidden sm:flex"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Question Palette Row */}
      <section className="bg-[var(--surface)] border-b border-[var(--border)] px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Number buttons scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full sm:max-w-2xl no-scrollbar">
          {exam.questions.map((q, idx) => {
            const st = getQuestionStatus(q);
            const isCurrent = idx === currentIndex;

            let bgClass = 'bg-[var(--c-gray-dot)] text-white';
            if (st === 'answered') bgClass = 'bg-[var(--c-green-dot)] text-white';
            else if (st === 'unanswered') bgClass = 'bg-[var(--c-red-dot)] text-white';
            else if (st === 'marked-un') bgClass = 'bg-[var(--c-brown)] text-white';
            else if (st === 'marked-ans') bgClass = 'bg-[var(--c-purple)] text-white';

            return (
              <button
                key={q.id}
                onClick={() => goToQuestion(idx)}
                className={`w-8 h-8 min-w-[32px] rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${bgClass} ${
                  isCurrent ? 'ring-2 ring-[var(--text)] ring-offset-2 ring-offset-[var(--surface)] scale-105 font-extrabold shadow-sm' : 'hover:opacity-90'
                }`}
                title={`Q${idx + 1}: ${st}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-[var(--muted)] flex-wrap ml-auto">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[var(--c-gray-dot)] inline-block" />
            <span>Not visited</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[var(--c-green-dot)] inline-block" />
            <span>Answered</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[var(--c-red-dot)] inline-block" />
            <span>Unanswered</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[var(--c-brown)] inline-block" />
            <span>Marked</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[var(--c-purple)] inline-block" />
            <span>Marked &amp; Ans</span>
          </span>
        </div>
      </section>

      {/* Main Question Body */}
      <main className="flex-1 flex flex-col justify-between overflow-y-auto">
        <div className="max-w-[820px] mx-auto px-4 sm:px-6 py-8 w-full">
          {currentQ ? (
            <div>
              {/* Question Meta badges */}
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--surface-2)] border border-[var(--c-sky)] text-[var(--c-sky)]">
                  {currentQ.section || 'General'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--surface-2)] border border-[var(--border)] text-[var(--muted)]">
                  Question {currentIndex + 1} of {exam.questions.length}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--surface-2)] border border-[var(--border)] text-[var(--muted)]">
                  +{currentQ.marks || exam.posMarks || 4} marks
                  {exam.negMarks > 0 && <span className="text-[var(--c-red)] ml-1">(-{exam.negMarks})</span>}
                </span>
                {isMarkedCurrent && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[var(--c-brown)] text-white flex items-center gap-1">
                    <Bookmark className="w-3 h-3 fill-white" />
                    <span>Review</span>
                  </span>
                )}
              </div>

              {/* Question Text */}
              <div className="text-lg sm:text-xl font-medium leading-relaxed text-[var(--text)] mb-8 whitespace-pre-wrap select-text">
                {currentQ.text}
              </div>

              {/* Options */}
              <div className="flex flex-col gap-3">
                {currentQ.options.map(opt => {
                  const isSelected = answers[currentQ.id] === opt.label;
                  return (
                    <button
                      key={opt.label}
                      onClick={() => selectAnswer(currentQ.id, opt.label)}
                      className={`flex items-center gap-3.5 p-3.5 sm:p-4 rounded-xl border-2 text-left transition-all cursor-pointer group ${
                        isSelected
                          ? 'border-[var(--c-navy)] dark:border-[var(--c-sky)] bg-[var(--c-navy)]/5 dark:bg-[var(--c-sky)]/10 shadow-xs'
                          : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--c-sky)]'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-[var(--c-navy)] dark:bg-[var(--c-sky)] border-[var(--c-navy)] dark:border-[var(--c-sky)] text-white shadow-xs'
                            : 'border-[var(--muted)] text-[var(--muted)] bg-[var(--surface)] group-hover:border-[var(--c-sky)]'
                        }`}
                      >
                        {opt.label}
                      </div>
                      <div className="text-sm sm:text-base font-normal text-[var(--text)] flex-1 leading-snug">
                        {opt.text}
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[var(--c-navy)] dark:text-[var(--c-sky)] shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Clear response link if answered */}
              {answers[currentQ.id] && (
                <div className="mt-3 text-right">
                  <button
                    onClick={clearCurrentResponse}
                    className="text-xs text-[var(--muted)] hover:text-[var(--c-red)] underline cursor-pointer"
                  >
                    Clear selection
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-[var(--muted)]">No question available.</div>
          )}
        </div>
      </main>

      {/* Sticky Exam Footer */}
      <footer className="sticky bottom-0 z-30 bg-[var(--surface)] border-t border-[var(--border)] px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="text-xs text-[var(--muted)] hidden md:block">
          Keyboard: <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)] font-mono">1-4</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)] font-mono">A-D</kbd> to select &bull; <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)] font-mono">&larr;</kbd> <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)] font-mono">&rarr;</kbd> to navigate
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap ml-auto">
          {!isLastQuestion && (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="text-xs sm:text-sm font-semibold text-[var(--muted)] hover:text-[var(--c-pink)] underline px-2 py-1.5 transition-colors cursor-pointer mr-1"
            >
              Submit early
            </button>
          )}

          <button
            onClick={toggleMark}
            className={`px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition-all cursor-pointer flex items-center gap-1.5 ${
              isMarkedCurrent ? 'bg-[var(--c-purple)] hover:brightness-110' : 'bg-[var(--c-brown)] hover:brightness-110'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 fill-white" />
            <span>{isMarkedCurrent ? 'Unmark Review' : 'Mark for Review'}</span>
          </button>

          <button
            onClick={() => goToQuestion(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[var(--c-prev)] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <button
            onClick={() => goToQuestion(currentIndex + 1)}
            disabled={isLastQuestion}
            className="px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[var(--c-next)] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {isLastQuestion && (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[var(--c-pink)] hover:brightness-110 shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>End Test</span>
            </button>
          )}
        </div>
      </footer>

      {/* End Test Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl max-w-md w-full p-6 transition-colors">
            <h4 className="font-serif text-lg sm:text-xl font-bold text-[var(--text)] mb-2">
              Ready to submit your exam?
            </h4>
            <p className="text-sm text-[var(--muted)] mb-5 leading-relaxed">
              Once submitted, you cannot change your answers. Check your progress breakdown below:
            </p>

            <div className="grid grid-cols-3 gap-2 p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] mb-6 text-center">
              <div>
                <div className="text-lg font-mono font-bold text-[var(--c-green-dot)]">{answeredCount}</div>
                <div className="text-[11px] text-[var(--muted)] uppercase font-semibold">Answered</div>
              </div>
              <div>
                <div className="text-lg font-mono font-bold text-[var(--c-red-dot)]">{unattemptedCount}</div>
                <div className="text-[11px] text-[var(--muted)] uppercase font-semibold">Unattempted</div>
              </div>
              <div>
                <div className="text-lg font-mono font-bold text-[var(--c-purple)]">{markedCount}</div>
                <div className="text-[11px] text-[var(--muted)] uppercase font-semibold">Marked</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-[var(--text)] bg-[var(--surface-2)] border border-[var(--border)] hover:bg-[var(--border)] transition-colors cursor-pointer"
              >
                Keep Testing
              </button>
              <button
                onClick={() => handleFinalSubmit(false)}
                className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-[var(--c-pink)] hover:brightness-110 shadow-md transition-all cursor-pointer"
              >
                Yes, Submit Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
