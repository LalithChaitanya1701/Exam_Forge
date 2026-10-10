import React, { useState } from 'react';
import { Exam } from '../types';
import { BookOpen, Play, Edit3, Trash2, Share2, Clock, Check, PlusCircle, Search, Layers, ShieldAlert } from 'lucide-react';

interface LibraryViewProps {
  exams: Exam[];
  onStartExam: (exam: Exam) => void;
  onEditExam: (exam: Exam) => void;
  onDeleteExam: (id: string) => Promise<void>;
  onNavigateCreate: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  exams,
  onStartExam,
  onEditExam,
  onDeleteExam,
  onNavigateCreate,
}) => {
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredExams = exams.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.sections.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  const handleShare = (exam: Exam, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = new URL(window.location.href);
    url.searchParams.set('examId', exam.id);
    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopiedId(exam.id);
      setTimeout(() => setCopiedId(null), 2500);
    }).catch(() => {});
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this exam from the library?')) {
      setDeletingId(id);
      try {
        await onDeleteExam(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="max-w-[920px] mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--text)] tracking-tight mb-2">
            Exam &amp; Test Library
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Explore ready-to-take exams stored in your database, copy direct launch links, or duplicate and edit them.
          </p>
        </div>

        <button
          onClick={onNavigateCreate}
          className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[var(--c-navy)] hover:brightness-110 shadow-md transition-all cursor-pointer flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Test</span>
        </button>
      </div>

      {/* Search Input */}
      {exams.length > 0 && (
        <div className="mb-6 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Search exams by title or section..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm focus:outline-2 focus:outline-[var(--c-sky)] transition-all shadow-xs"
          />
        </div>
      )}

      {/* Grid of Exams */}
      {filteredExams.length === 0 ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center shadow-[var(--shadow)]">
          <BookOpen className="w-12 h-12 mx-auto text-[var(--muted)] mb-3 opacity-50" />
          <h3 className="font-serif text-lg font-bold text-[var(--text)] mb-1">
            {search ? 'No exams matched your search' : 'No exams in library yet'}
          </h3>
          <p className="text-sm text-[var(--muted)] max-w-sm mx-auto mb-6">
            Create an exam using the editor or load the sample diagnostic test.
          </p>
          <button
            onClick={onNavigateCreate}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[var(--c-navy)] hover:brightness-110 shadow-md transition-all cursor-pointer"
          >
            Create Exam Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredExams.map(exam => (
            <div
              key={exam.id}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-[var(--shadow)] flex flex-col justify-between hover:border-[var(--c-sky)] transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <h3 className="font-serif text-lg font-bold text-[var(--text)] leading-snug group-hover:text-[var(--c-sky)] transition-colors">
                    {exam.title}
                  </h3>
                  {exam.isSample && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                      Sample
                    </span>
                  )}
                </div>

                {/* Badges / specs */}
                <div className="flex flex-wrap items-center gap-2 mb-3.5 text-xs text-[var(--muted)]">
                  <span className="flex items-center gap-1 bg-[var(--surface-2)] px-2.5 py-1 rounded-lg border border-[var(--border)] font-mono">
                    <Clock className="w-3.5 h-3.5 text-[var(--c-sky)]" />
                    <span>{exam.duration} mins</span>
                  </span>
                  <span className="bg-[var(--surface-2)] px-2.5 py-1 rounded-lg border border-[var(--border)] font-mono">
                    {exam.questions.length} questions
                  </span>
                  <span className="bg-[var(--surface-2)] text-[var(--c-green-dot)] px-2.5 py-1 rounded-lg border border-[var(--border)] font-mono font-bold">
                    +{exam.posMarks || 4} pos
                  </span>
                  {exam.negMarks > 0 && (
                    <span className="bg-red-500/10 text-[var(--c-red)] px-2.5 py-1 rounded-lg border border-red-500/20 font-mono flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>-{exam.negMarks} neg</span>
                    </span>
                  )}
                </div>

                {/* Section tags */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {exam.sections.map(s => (
                    <span
                      key={s}
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--border)]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                <div className="flex items-center gap-1">
                  <button
                    onClick={e => handleShare(exam, e)}
                    className="p-2 rounded-xl text-xs text-[var(--muted)] hover:text-[var(--text)] bg-[var(--surface-2)] hover:bg-[var(--border)] border border-[var(--border)] transition-colors cursor-pointer flex items-center gap-1"
                    title="Copy Shareable Link"
                  >
                    {copiedId === exam.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[11px] text-emerald-500 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="text-[11px] hidden sm:inline">Share</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onEditExam(exam)}
                    className="p-2 rounded-xl text-xs text-[var(--muted)] hover:text-[var(--text)] bg-[var(--surface-2)] hover:bg-[var(--border)] border border-[var(--border)] transition-colors cursor-pointer flex items-center gap-1"
                    title="Edit or Fork"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span className="text-[11px] hidden sm:inline">Edit</span>
                  </button>

                  {!exam.isSample && (
                    <button
                      onClick={e => handleDelete(exam.id, e)}
                      disabled={deletingId === exam.id}
                      className="p-2 rounded-xl text-xs text-[var(--muted)] hover:text-red-500 bg-[var(--surface-2)] hover:bg-red-500/10 border border-[var(--border)] transition-colors cursor-pointer"
                      title="Delete Exam"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => onStartExam(exam)}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-[var(--c-navy)] hover:brightness-110 shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Take Test →</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
