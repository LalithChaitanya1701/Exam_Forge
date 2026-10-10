import React from 'react';
import { Exam, User } from '../types';
import { Play, PlusCircle, CheckCircle, Clock, Award, FileText, ArrowRight, Shield, Zap, Printer, Users } from 'lucide-react';

interface LandingPageProps {
  onStartExam: (exam: Exam) => void;
  onNavigateCreate: () => void;
  onNavigateAuth: () => void;
  onNavigateProfile: () => void;
  sampleExam?: Exam | null;
  currentUser: User | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartExam,
  onNavigateCreate,
  onNavigateAuth,
  onNavigateProfile,
  sampleExam,
  currentUser,
}) => {
  return (
    <div className="w-full flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-[var(--border)] bg-gradient-to-b from-[var(--surface)] to-[var(--bg)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-xs font-semibold text-[var(--muted)] mb-6 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[var(--c-sky)]"></span>
            <span>Zero-friction MCQ to Computer-Based Test Simulator</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-black text-[var(--text)] tracking-tight leading-[1.15] mb-6">
            Turn Any Plain MCQ Text into a{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--c-sky)] to-[var(--c-navy)] dark:to-blue-400">
              Live CBT Exam
            </span>
          </h1>

          <p className="text-base sm:text-xl text-[var(--muted)] max-w-2xl mx-auto mb-9 leading-relaxed font-normal">
            Paste questions in clean text format. Get a full-fidelity computer-based exam simulator with section tabs, countdown timers, responsive question palettes, and deep solution analytics.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5 sm:gap-4 mb-12">
            <button
              onClick={onNavigateCreate}
              className="px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base text-white bg-[var(--c-navy)] hover:brightness-110 shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Create New Exam</span>
            </button>

            {sampleExam && (
              <button
                onClick={() => onStartExam(sampleExam)}
                className="px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base text-[var(--text)] bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--border)] shadow-sm hover:shadow active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current text-[var(--c-sky)]" />
                <span>Try Sample Diagnostic (60m)</span>
              </button>
            )}

            {!currentUser ? (
              <button
                onClick={onNavigateAuth}
                className="px-5 py-3.5 rounded-xl font-semibold text-sm sm:text-base text-[var(--muted)] hover:text-[var(--text)] bg-transparent hover:bg-[var(--surface-2)] border border-transparent hover:border-[var(--border)] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Sign In / Register</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onNavigateProfile}
                className="px-5 py-3.5 rounded-xl font-semibold text-sm sm:text-base text-[var(--c-sky)] bg-[var(--surface-2)] border border-[var(--border)] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>View Profile &amp; Reports</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-6 border-t border-[var(--border)] text-left">
            <div className="p-3">
              <div className="font-mono font-bold text-xl sm:text-2xl text-[var(--text)]">100%</div>
              <div className="text-xs text-[var(--muted)] font-medium">Text-Based Simplicity</div>
            </div>
            <div className="p-3">
              <div className="font-mono font-bold text-xl sm:text-2xl text-[var(--c-green-dot)]">5-State</div>
              <div className="text-xs text-[var(--muted)] font-medium">Palette Navigation</div>
            </div>
            <div className="p-3">
              <div className="font-mono font-bold text-xl sm:text-2xl text-[var(--c-sky)]">Instant</div>
              <div className="text-xs text-[var(--muted)] font-medium">Section Breakdown</div>
            </div>
            <div className="p-3">
              <div className="font-mono font-bold text-xl sm:text-2xl text-[var(--c-purple)]">PDF/Print</div>
              <div className="text-xs text-[var(--muted)] font-medium">Clean Solution Sheets</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-20 bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--text)] mb-3">
              Three Simple Steps to Exam Readiness
            </h2>
            <p className="text-sm text-[var(--muted)]">
              From raw notes or textbook exercises to a real testing environment in under a minute.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-[var(--c-prev)] flex items-center justify-center font-mono font-bold text-base mb-4">
                  01
                </div>
                <h3 className="font-serif text-lg font-bold text-[var(--text)] mb-2">
                  Paste Raw Questions
                </h3>
                <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed mb-4">
                  Use standard question blocks with simple tags: <code>Q:</code>, <code>A)</code> through <code>D)</code>, <code>Answer:</code>, and <code>---</code> dividers.
                </p>
              </div>
              <div className="bg-[var(--surface)] p-3 rounded-xl border border-[var(--border)] font-mono text-[11px] text-[var(--text)] opacity-90">
                <div>Section: Physics</div>
                <div>Q: SI unit of force?</div>
                <div>A) Joule &bull; B) Newton</div>
                <div>Answer: B</div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-[var(--c-green-dot)] flex items-center justify-center font-mono font-bold text-base mb-4">
                  02
                </div>
                <h3 className="font-serif text-lg font-bold text-[var(--text)] mb-2">
                  Take the Live CBT
                </h3>
                <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed mb-4">
                  Simulate high-stakes testing with countdown timers, audio chimes, keyboard shortcuts, and full color-coded question palette tracking.
                </p>
              </div>
              <div className="flex items-center gap-1.5 p-3 bg-[var(--surface)] rounded-xl border border-[var(--border)] justify-center">
                <span className="w-6 h-6 rounded bg-[var(--c-green-dot)] text-white text-[10px] font-bold flex items-center justify-center">1</span>
                <span className="w-6 h-6 rounded bg-[var(--c-red-dot)] text-white text-[10px] font-bold flex items-center justify-center">2</span>
                <span className="w-6 h-6 rounded bg-[var(--c-brown)] text-white text-[10px] font-bold flex items-center justify-center">3</span>
                <span className="w-6 h-6 rounded bg-[var(--c-purple)] text-white text-[10px] font-bold flex items-center justify-center">4</span>
                <span className="w-6 h-6 rounded bg-[var(--c-gray-dot)] text-white text-[10px] font-bold flex items-center justify-center">5</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-[var(--c-purple)] flex items-center justify-center font-mono font-bold text-base mb-4">
                  03
                </div>
                <h3 className="font-serif text-lg font-bold text-[var(--text)] mb-2">
                  Deep Analytics &amp; Reports
                </h3>
                <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed mb-4">
                  Get instant section breakdown tables, detailed step-by-step explanations, negative mark deductions, and exportable printable scorecards.
                </p>
              </div>
              <div className="p-3 bg-[var(--surface)] rounded-xl border border-[var(--border)] text-xs flex justify-between font-medium">
                <span>Score: <b className="text-[var(--c-green-dot)]">85%</b></span>
                <span>Physics: <b>4/4</b></span>
                <span>Math: <b>8/8</b></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-16 sm:py-20 bg-[var(--bg)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--text)] mb-3">
              Engineered for Serious Exam Takers
            </h2>
            <p className="text-sm text-[var(--muted)]">
              All the tools you need for competitive testing without clunky software or subscriptions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
              <Clock className="w-6 h-6 text-[var(--c-red)] mb-3" />
              <h4 className="font-bold text-sm text-[var(--text)] mb-1.5">Strict Timers &amp; Chimes</h4>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Automated countdown timer with warning pulses and chimes at 30, 20, 10, and 5 minutes remaining.
              </p>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
              <Shield className="w-6 h-6 text-[var(--c-sky)] mb-3" />
              <h4 className="font-bold text-sm text-[var(--text)] mb-1.5">Configurable Negative Marking</h4>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Supports exact deduction values (0.25, 1, or custom) to realistically simulate exams like JEE, NEET, and GRE.
              </p>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
              <Printer className="w-6 h-6 text-[var(--c-navy)] dark:text-blue-300 mb-3" />
              <h4 className="font-bold text-sm text-[var(--text)] mb-1.5">Print / PDF Solution Sheets</h4>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                One-click formatted print sheets containing all questions, selected choices, and official explanations.
              </p>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
              <Zap className="w-6 h-6 text-amber-500 mb-3" />
              <h4 className="font-bold text-sm text-[var(--text)] mb-1.5">Keyboard Shortcuts</h4>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Select options with 1–4 or A–D, navigate with arrow keys, and mark for review with a single keystroke.
              </p>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
              <FileText className="w-6 h-6 text-[var(--c-prev)] mb-3" />
              <h4 className="font-bold text-sm text-[var(--text)] mb-1.5">Section-Wise Partitioning</h4>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Organize tests into independent sections with live per-section scoring, jump navigation, and question counts.
              </p>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
              <Users className="w-6 h-6 text-[var(--c-purple)] mb-3" />
              <h4 className="font-bold text-sm text-[var(--text)] mb-1.5">Unified Profile &amp; History</h4>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Your attempts, past reports, and performance milestones stored neatly in your unified Profile dashboard.
              </p>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-14 bg-gradient-to-r from-[var(--c-navy)] to-[var(--c-navy-dark)] text-white rounded-3xl p-8 sm:p-12 text-center shadow-xl">
            <h3 className="font-serif text-2xl sm:text-3xl font-bold mb-3">
              Ready to test your knowledge?
            </h3>
            <p className="text-sm sm:text-base text-blue-200 max-w-lg mx-auto mb-6">
              Launch your exam simulator right now with zero setup.
            </p>
            <button
              onClick={onNavigateCreate}
              className="px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base bg-[var(--c-sky)] text-white hover:brightness-110 shadow-md active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Create an Exam Now</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
