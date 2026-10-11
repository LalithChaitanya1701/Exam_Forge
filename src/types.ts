export interface User {
  id: string;
  email: string;
  name: string;
  targetExam?: string;
  createdAt: string;
}

export interface QuestionOption {
  label: string;
  text: string;
}

export interface Question {
  id: string;
  section: string;
  text: string;
  options: QuestionOption[];
  answer: string | null;
  marks: number;
  explanation: string;
}

export interface Exam {
  id: string;
  userId?: string;
  title: string;
  duration: number; // in minutes
  posMarks: number; // marks per correct answer
  negMarks: number; // penalty per wrong answer
  sections: string[];
  questions: Question[];
  totalMarks: number;
  createdAt: string;
  isSample?: boolean;
}

export interface SectionBreakdown {
  total: number;
  correct: number;
  wrong: number;
  unattempted: number;
  marks: number;
  marksTotal: number;
}

export interface Attempt {
  id: string;
  userId?: string;
  examId: string;
  examTitle: string;
  date: string;
  score: number;
  total: number;
  percentage: number;
  correct: number;
  wrong: number;
  unattempted: number;
  timeTakenSec: number;
  bySection: Record<string, SectionBreakdown>;
  answers: Record<string, string>;
  marked: Record<string, boolean>;
  questionsSnapshot: Question[];
}

export interface UserPrefs {
  theme: 'light' | 'dark';
  fontSize: 'normal' | 'large';
}

export type ViewMode = 'landing' | 'setup' | 'exam' | 'profile' | 'library' | 'auth';

export interface ParseResult {
  questions: Question[];
  sections: string[];
  errors: string[];
  totalMarks: number;
}
