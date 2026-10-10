import React, { useState, useMemo, useRef } from 'react';
import { Exam, ParseResult } from '../types';
import { parseMCQs, SAMPLE_MCQ_TEXT } from '../utils/parser';
import { Play, BookOpen, Upload, Download, CheckCircle, AlertTriangle, HelpCircle, Layers, CheckSquare } from 'lucide-react';

interface SetupViewProps {
  onStartExam: (exam: Exam) => void;
  onSaveToLibrary: (exam: Exam) => Promise<void>;
  initialDraft?: {
    name: string;
    duration: number;
    posMarks?: number;
    negMarks: number;
    raw: string;
  };
}

export const SetupView: React.FC<SetupViewProps> = ({
  onStartExam,
  onSaveToLibrary,
  initialDraft,
}) => {
  const [testName, setTestName] = useState(initialDraft?.name || 'Diagnostic Mock Test 01');
  const [duration, setDuration] = useState<number>(initialDraft?.duration || 60);
  const [posMarks, setPosMarks] = useState<number>(initialDraft?.posMarks ?? 4);
  const [negMarks, setNegMarks] = useState<number>(initialDraft?.negMarks ?? 1);
  const [rawText, setRawText] = useState<string>(initialDraft?.raw || SAMPLE_MCQ_TEXT);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseResult: ParseResult = useMemo(() => {
    return parseMCQs(rawText, posMarks);
  }, [rawText, posMarks]);

  const handleStartExam = () => {
    if (parseResult.questions.length === 0) return;

    const exam: Exam = {
      id: `exam-${Date.now()}`,
      title: testName.trim() || 'Untitled Exam',
      duration: Math.max(1, duration || 60),
      posMarks: Math.max(0.1, posMarks || 4),
      negMarks: Math.max(0, negMarks || 0),
      sections: parseResult.sections,
      questions: parseResult.questions,
      totalMarks: parseResult.totalMarks,
      createdAt: new Date().toISOString()
    };

    onStartExam(exam);
  };

  const handleSaveOnly = async () => {
    if (parseResult.questions.length === 0) return;
    setIsSaving(true);
    try {
      const exam: Exam = {
        id: `exam-${Date.now()}`,
        title: testName.trim() || 'Untitled Exam',
        duration: Math.max(1, duration || 60),
        posMarks: Math.max(0.1, posMarks || 4),
        negMarks: Math.max(0, negMarks || 0),
        sections: parseResult.sections,
        questions: parseResult.questions,
        totalMarks: parseResult.totalMarks,
        createdAt: new Date().toISOString()
      };
      await onSaveToLibrary(exam);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      if (text) {
        setRawText(text);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportText = () => {
    const blob = new Blob([rawText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${testName.replace(/[^a-zA-Z0-9]/g, '_') || 'exam'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[920px] mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full animate-fade-in">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)] mb-2">
          Create CBT Exam from Text
        </h1>
        <p className="text-[var(--muted)] text-sm sm:text-base leading-relaxed max-w-2xl">
          Paste your questions in standard text format below, set duration, positive marks per question, and negative marking penalty to start a live computer-based test with timed sections, responsive question palettes, and instant reports.
        </p>
      </div>

      {/* Settings Card */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow)] p-5 sm:p-7 mb-6 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Exam Configuration
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--border)]">
            Auto-scored
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text)] mb-2">
              Test Name
            </label>
            <input
              type="text"
              className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-2 focus:outline-[var(--c-sky)] transition-all"
              placeholder="e.g. Mock Test 01 / Unit Exam"
              value={testName}
              onChange={e => setTestName(e.target.value)}
            />
            <small className="block text-[11px] text-[var(--muted)] mt-1.5">
              Title of your exam test
            </small>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text)] mb-2">
              Duration (minutes)
            </label>
            <input
              type="number"
              min={1}
              max={360}
              className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm font-medium font-mono focus:outline-2 focus:outline-[var(--c-sky)] transition-all"
              value={duration}
              onChange={e => setDuration(Math.max(1, parseInt(e.target.value, 10) || 1))}
            />
            <small className="block text-[11px] text-[var(--muted)] mt-1.5">
              Alerts at 30, 20, 10 &amp; 5m left
            </small>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text)] mb-2 text-[var(--c-green-dot)] flex items-center gap-1">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Positive Marks</span>
            </label>
            <input
              type="number"
              min={0.25}
              step={0.5}
              className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm font-medium font-mono focus:outline-2 focus:outline-[var(--c-sky)] transition-all"
              value={posMarks}
              onChange={e => setPosMarks(Math.max(0.25, parseFloat(e.target.value) || 1))}
            />
            <small className="block text-[11px] text-[var(--muted)] mt-1.5">
              Marks for each correct answer (e.g. 4 or 1)
            </small>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text)] mb-2 text-[var(--c-red-dot)]">
              Negative Marking
            </label>
            <input
              type="number"
              min={0}
              step={0.25}
              className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm font-medium font-mono focus:outline-2 focus:outline-[var(--c-sky)] transition-all"
              value={negMarks}
              onChange={e => setNegMarks(Math.max(0, parseFloat(e.target.value) || 0))}
            />
            <small className="block text-[11px] text-[var(--muted)] mt-1.5">
              Penalty per wrong answer (0 for none)
            </small>
          </div>
        </div>
      </div>

      {/* Question Editor Card */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow)] p-5 sm:p-7 mb-6 transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[var(--c-sky)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Questions &amp; Structure
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 text-xs rounded-lg bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--border)] flex items-center gap-1 cursor-pointer transition-colors"
              title="Upload text file"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.md,.json"
              className="hidden"
            />
            <button
              onClick={handleExportText}
              className="px-2.5 py-1 text-xs rounded-lg bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--border)] flex items-center gap-1 cursor-pointer transition-colors"
              title="Export raw text"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Syntax guide box */}
        <div className="bg-[var(--surface-2)] border border-dashed border-[var(--border)] rounded-xl p-3.5 text-xs text-[var(--muted)] leading-relaxed mb-4">
          <div className="flex items-center justify-between gap-2 font-bold text-[var(--text)] mb-1">
            <div className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-[var(--c-sky)]" />
              <span>Format Guide</span>
            </div>
            <span className="text-[11px] font-mono text-[var(--c-green-dot)] bg-[var(--surface)] px-2 py-0.5 rounded border border-[var(--border)]">
              Auto +{posMarks} marks / question
            </span>
          </div>
          Separate questions with <code className="bg-[var(--surface)] px-1.5 py-0.5 rounded font-mono text-[var(--text)]">---</code>. Format per question:
          <div className="mt-1 font-mono text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5 text-[var(--text)] opacity-90">
            <span>• Section: Physics (optional, defaults to General)</span>
            <span>• Q: What is the speed of light?</span>
            <span>• A) 3x10^8 m/s</span>
            <span>• B) 3x10^6 m/s ...</span>
            <span>• Answer: A</span>
            <span className="sm:col-span-2">• Explanation: Light travels at ~300,000 km/s in vacuum.</span>
          </div>
        </div>

        {/* Text Area */}
        <textarea
          rows={14}
          value={rawText}
          onChange={e => setRawText(e.target.value)}
          placeholder={`Section: General\nQ: Question text?\nA) Option A\nB) Option B\nC) Option C\nD) Option D\nAnswer: A\nExplanation: Because...\n---\n(Next question)`}
          className="w-full font-mono text-xs sm:text-sm leading-relaxed p-4 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl focus:outline-2 focus:outline-[var(--c-sky)] transition-all resize-y"
        />

        {/* Button toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-[var(--border)]">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setRawText(SAMPLE_MCQ_TEXT)}
              className="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--border)] transition-colors cursor-pointer"
            >
              Load Sample Questions
            </button>
            <button
              onClick={() => setRawText('')}
              className="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[var(--muted)] hover:text-red-500 transition-colors cursor-pointer"
            >
              Clear Editor
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSaveOnly}
              disabled={parseResult.questions.length === 0 || isSaving}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--border)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4 text-[var(--muted)]" />
                  <span>Save to Library</span>
                </>
              )}
            </button>

            <button
              onClick={handleStartExam}
              disabled={parseResult.questions.length === 0}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[var(--c-navy)] text-white hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Begin Exam →</span>
            </button>
          </div>
        </div>

        {/* Live parse summary */}
        {rawText.trim() && (
          <div
            className={`mt-4 p-4 rounded-xl text-xs sm:text-sm border transition-all ${
              parseResult.questions.length > 0
                ? 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text)]'
                : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
            }`}
          >
            {parseResult.questions.length > 0 ? (
              <div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-medium">
                  <span>
                    Detected <b>{parseResult.questions.length}</b> question{parseResult.questions.length === 1 ? '' : 's'}
                  </span>
                  <span>
                    Across <b>{parseResult.sections.length}</b> section{parseResult.sections.length === 1 ? '' : 's'} (
                    <span className="text-[var(--c-sky)]">{parseResult.sections.join(', ')}</span>)
                  </span>
                  <span>
                    Scoring: <b className="text-[var(--c-green-dot)]">+{posMarks}</b>
                    {negMarks > 0 ? <span className="text-[var(--c-red-dot)]"> / -{negMarks}</span> : ''}
                  </span>
                  <span>
                    Total Marks: <b>{parseResult.totalMarks}</b>
                  </span>
                </div>
                {parseResult.errors.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-[var(--border)] text-amber-600 dark:text-amber-400 text-xs flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <div>
                      {parseResult.errors.map((err, i) => (
                        <div key={i}>{err}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>No valid questions found. Check your formatting (ensure questions have options and an answer).</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
