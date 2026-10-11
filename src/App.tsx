import React, { useState, useEffect, useCallback } from 'react';
import { ViewMode, Exam, Attempt, User } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { SetupView } from './components/SetupView';
import { ExamView } from './components/ExamView';
import { ProfileView } from './components/ProfileView';
import { LibraryView } from './components/LibraryView';
import { AuthPage } from './components/AuthPage';
import { formatQuestionsToText } from './utils/parser';

export default function App() {
  const [view, setView] = useState<ViewMode>('landing');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
  const [selectedAttempt, setSelectedAttempt] = useState<Attempt | null>(null);
  const [draftSetup, setDraftSetup] = useState<{
    name: string;
    duration: number;
    posMarks?: number;
    negMarks: number;
    raw: string;
  } | undefined>(undefined);

  // Initialize data, preferences, and session
  useEffect(() => {
    async function init() {
      try {
        const [prefs, me, examsList] = await Promise.all([
          api.getPrefs(),
          api.getMe(),
          api.getExams()
        ]);

        if (prefs) {
          setTheme(prefs.theme || 'light');
          document.documentElement.setAttribute('data-theme', prefs.theme || 'light');
        }

        if (me) {
          setCurrentUser(me);
        }

        setExams(examsList);

        const attemptsList = await api.getAttempts(me?.id);
        setAttempts(attemptsList);

        // Check URL parameters for direct exam link
        const params = new URLSearchParams(window.location.search);
        const examId = params.get('examId');
        if (examId) {
          const matched = examsList.find(e => e.id === examId);
          if (matched) {
            setCurrentExam(matched);
            setView('exam');
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }
    init();
  }, []);

  const handleToggleTheme = useCallback(async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    await api.savePrefs({ theme: nextTheme });
  }, [theme]);

  const handleAuthSuccess = async (user: User) => {
    setCurrentUser(user);
    const [userAttempts, userExams] = await Promise.all([
      api.getAttempts(user.id),
      api.getExams()
    ]);
    setAttempts(userAttempts);
    setExams(userExams);
    setView('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setSelectedAttempt(null);
    setView('landing');
  };

  const handleStartExam = (exam: Exam) => {
    setCurrentExam(exam);
    setView('exam');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinishExam = async (
    answers: Record<string, string>,
    marked: Record<string, boolean>,
    timeTakenSec: number
  ) => {
    if (!currentExam) return;

    try {
      const graded = await api.gradeExam(currentExam.id, answers, marked, timeTakenSec);
      setSelectedAttempt(graded);
      setAttempts(prev => [graded, ...prev.filter(a => a.id !== graded.id)]);
      setView('profile'); // Unified Profile keeps test history and report
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Grading failed:', err);
      // Fallback local scoring if network blips
      const q = currentExam.questions;
      let correct = 0;
      let wrong = 0;
      let unattempted = 0;
      let scoreObtained = 0;
      const bySection: Record<string, any> = {};

      q.forEach(qq => {
        const sec = qq.section || 'General';
        if (!bySection[sec]) bySection[sec] = { total: 0, correct: 0, wrong: 0, unattempted: 0, marks: 0, marksTotal: 0 };
        bySection[sec].total++;
        bySection[sec].marksTotal += qq.marks;
        const given = answers[qq.id];
        if (given == null) {
          unattempted++;
          bySection[sec].unattempted++;
        } else if (qq.answer && String(given).toUpperCase() === String(qq.answer).toUpperCase()) {
          correct++;
          scoreObtained += qq.marks;
          bySection[sec].correct++;
          bySection[sec].marks += qq.marks;
        } else if (!qq.answer) {
          // Question without answer key: do not penalize candidate
          unattempted++;
          bySection[sec].unattempted++;
        } else {
          wrong++;
          scoreObtained -= currentExam.negMarks;
          bySection[sec].wrong++;
          bySection[sec].marks -= currentExam.negMarks;
        }
      });

      const fallbackAttempt: Attempt = {
        id: `att-${Date.now()}`,
        userId: currentUser?.id,
        examId: currentExam.id,
        examTitle: currentExam.title,
        date: new Date().toISOString(),
        score: Math.round(scoreObtained * 100) / 100,
        total: currentExam.totalMarks,
        percentage: currentExam.totalMarks > 0 ? Math.round((scoreObtained / currentExam.totalMarks) * 1000) / 10 : 0,
        correct,
        wrong,
        unattempted,
        timeTakenSec,
        bySection,
        answers,
        marked,
        questionsSnapshot: currentExam.questions,
        posMarks: currentExam.posMarks,
        negMarks: currentExam.negMarks
      };

      setSelectedAttempt(fallbackAttempt);
      setAttempts(prev => [fallbackAttempt, ...prev]);
      setView('profile');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleRetakeAttempt = (att: Attempt) => {
    const match = exams.find(e => e.id === att.examId);
    if (match) {
      setCurrentExam(match);
      setView('exam');
    } else {
      const reconstructed: Exam = {
        id: att.examId,
        title: att.examTitle,
        duration: Math.max(10, Math.ceil(att.timeTakenSec / 60) + 10),
        posMarks: att.posMarks ?? att.questionsSnapshot?.[0]?.marks ?? 4,
        negMarks: att.negMarks ?? 0,
        sections: Object.keys(att.bySection),
        questions: att.questionsSnapshot,
        totalMarks: att.total,
        createdAt: new Date().toISOString()
      };
      setCurrentExam(reconstructed);
      setView('exam');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveToLibrary = async (exam: Exam) => {
    const saved = await api.saveExam(exam);
    setExams(prev => [saved, ...prev.filter(e => e.id !== saved.id)]);
  };

  const handleDeleteExam = async (id: string) => {
    await api.deleteExam(id);
    setExams(prev => prev.filter(e => e.id !== id));
  };

  const handleDeleteAttempt = async (id: string) => {
    await api.deleteAttempt(id);
    setAttempts(prev => prev.filter(a => a.id !== id));
    if (selectedAttempt?.id === id) {
      setSelectedAttempt(null);
    }
  };

  const handleEditExam = (exam: Exam) => {
    setDraftSetup({
      name: exam.title,
      duration: exam.duration,
      posMarks: exam.posMarks,
      negMarks: exam.negMarks,
      raw: formatQuestionsToText(exam.questions)
    });
    setView('setup');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateProfile = async (name: string, targetExam: string) => {
    const updated = await api.updateProfile(name, targetExam);
    setCurrentUser(updated);
  };

  const sampleExam = exams.find(e => e.isSample) || exams[0] || null;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] transition-colors">
      {/* Hide Top Navbar during an active high-stakes exam session */}
      {view !== 'exam' && (
        <Navbar
          currentView={view}
          onNavigate={(v: ViewMode) => {
            if (v === 'profile') {
              setSelectedAttempt(null); // return to history overview when clicking profile nav
            }
            setView(v);
          }}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          currentUser={currentUser}
        />
      )}

      {/* Main View Router */}
      <main className="flex-1 flex flex-col">
        {view === 'landing' && (
          <LandingPage
            onStartExam={handleStartExam}
            onNavigateCreate={() => setView('setup')}
            onNavigateAuth={() => setView('auth')}
            onNavigateProfile={() => setView('profile')}
            sampleExam={sampleExam}
            currentUser={currentUser}
          />
        )}

        {view === 'setup' && (
          <SetupView
            onStartExam={handleStartExam}
            onSaveToLibrary={handleSaveToLibrary}
            initialDraft={draftSetup}
          />
        )}

        {view === 'exam' && currentExam && (
          <ExamView
            exam={currentExam}
            onFinishExam={handleFinishExam}
            theme={theme}
            onToggleTheme={handleToggleTheme}
          />
        )}

        {view === 'library' && (
          <LibraryView
            exams={exams}
            onStartExam={handleStartExam}
            onEditExam={handleEditExam}
            onDeleteExam={handleDeleteExam}
            onNavigateCreate={() => setView('setup')}
          />
        )}

        {view === 'profile' && (
          <ProfileView
            user={currentUser}
            attempts={attempts}
            selectedAttempt={selectedAttempt}
            onSelectAttempt={setSelectedAttempt}
            onRetakeAttempt={handleRetakeAttempt}
            onDeleteAttempt={handleDeleteAttempt}
            onUpdateProfile={handleUpdateProfile}
            onLogout={handleLogout}
            onNavigateCreate={() => setView('setup')}
            onNavigateAuth={() => setView('auth')}
          />
        )}

        {view === 'auth' && (
          <AuthPage
            onAuthSuccess={handleAuthSuccess}
            onCancel={() => setView('landing')}
          />
        )}
      </main>
    </div>
  );
}
