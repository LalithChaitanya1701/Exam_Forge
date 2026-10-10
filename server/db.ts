import fs from 'node:fs/promises';
import path from 'node:path';

export interface User {
  id: string;
  email: string;
  name: string;
  password: string; // stored for demo authentication
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
  answer: string;
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
  soundEnabled: boolean;
  fontSize: 'normal' | 'large';
}

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const EXAMS_FILE = path.join(DATA_DIR, 'exams.json');
const ATTEMPTS_FILE = path.join(DATA_DIR, 'attempts.json');
const PREFS_FILE = path.join(DATA_DIR, 'prefs.json');

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function atomicWrite(filePath: string, data: unknown) {
  await ensureDataDir();
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  const content = JSON.stringify(data, null, 2);
  await fs.writeFile(tempPath, content, 'utf-8');
  await fs.rename(tempPath, filePath);
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      await atomicWrite(filePath, fallback);
      return fallback;
    }
    console.error(`Error reading ${filePath}:`, err);
    return fallback;
  }
}

const DEFAULT_DEMO_USER: User = {
  id: 'usr-demo-01',
  email: 'alex@example.com',
  name: 'Alex Turner',
  password: 'password123',
  targetExam: 'Engineering & Science CBT Exams',
  createdAt: new Date().toISOString()
};

const DEFAULT_SAMPLE_EXAM: Exam = {
  id: 'sample-01',
  title: 'General Science & Math Diagnostic (Sample)',
  duration: 60,
  posMarks: 4,
  negMarks: 1,
  sections: ['Physics', 'Chemistry', 'Mathematics'],
  totalMarks: 24,
  createdAt: new Date().toISOString(),
  isSample: true,
  questions: [
    {
      id: 'q1',
      section: 'Physics',
      text: 'What is the SI unit of force?',
      options: [
        { label: 'A', text: 'Joule' },
        { label: 'B', text: 'Newton' },
        { label: 'C', text: 'Watt' },
        { label: 'D', text: 'Pascal' }
      ],
      answer: 'B',
      marks: 4,
      explanation: 'The SI unit of force is the Newton (N), defined as the force needed to accelerate 1 kg of mass at 1 m/s².'
    },
    {
      id: 'q2',
      section: 'Physics',
      text: 'Which of these is a vector quantity?',
      options: [
        { label: 'A', text: 'Mass' },
        { label: 'B', text: 'Speed' },
        { label: 'C', text: 'Velocity' },
        { label: 'D', text: 'Energy' }
      ],
      answer: 'C',
      marks: 4,
      explanation: 'Velocity has both magnitude and direction, making it a vector quantity, unlike speed which is scalar.'
    },
    {
      id: 'q3',
      section: 'Chemistry',
      text: 'What is the atomic number of Carbon?',
      options: [
        { label: 'A', text: '6' },
        { label: 'B', text: '12' },
        { label: 'C', text: '8' },
        { label: 'D', text: '14' }
      ],
      answer: 'A',
      marks: 4,
      explanation: 'Carbon has 6 protons in its nucleus, giving it an atomic number of 6.'
    },
    {
      id: 'q4',
      section: 'Chemistry',
      text: 'Which gas is most abundant in Earth’s atmosphere?',
      options: [
        { label: 'A', text: 'Oxygen' },
        { label: 'B', text: 'Carbon Dioxide' },
        { label: 'C', text: 'Nitrogen' },
        { label: 'D', text: 'Argon' }
      ],
      answer: 'C',
      marks: 4,
      explanation: 'Nitrogen makes up approximately 78% of Earth’s atmosphere by volume.'
    },
    {
      id: 'q5',
      section: 'Mathematics',
      text: 'What is the value of π rounded to two decimal places?',
      options: [
        { label: 'A', text: '3.12' },
        { label: 'B', text: '3.14' },
        { label: 'C', text: '3.16' },
        { label: 'D', text: '3.18' }
      ],
      answer: 'B',
      marks: 4,
      explanation: 'Pi is approximately 3.14159, which rounds to 3.14 to two decimal places.'
    },
    {
      id: 'q6',
      section: 'Mathematics',
      text: 'Solve for x: 2x + 6 = 14',
      options: [
        { label: 'A', text: '2' },
        { label: 'B', text: '4' },
        { label: 'C', text: '6' },
        { label: 'D', text: '8' }
      ],
      answer: 'B',
      marks: 4,
      explanation: 'Subtract 6 from both sides: 2x = 8. Divide by 2: x = 4.'
    }
  ]
};

export const db = {
  // Users
  async getUsers(): Promise<User[]> {
    const users = await readJsonFile<User[]>(USERS_FILE, [DEFAULT_DEMO_USER]);
    if (users.length === 0) {
      await atomicWrite(USERS_FILE, [DEFAULT_DEMO_USER]);
      return [DEFAULT_DEMO_USER];
    }
    return users;
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async getUserById(id: string): Promise<User | null> {
    const users = await this.getUsers();
    return users.find(u => u.id === id) || null;
  },

  async createUser(user: User): Promise<User> {
    const users = await this.getUsers();
    users.push(user);
    await atomicWrite(USERS_FILE, users);
    return user;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const users = await this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...updates };
    await atomicWrite(USERS_FILE, users);
    return users[idx];
  },

  // Exams
  async getExams(): Promise<Exam[]> {
    const exams = await readJsonFile<Exam[]>(EXAMS_FILE, [DEFAULT_SAMPLE_EXAM]);
    if (exams.length === 0) {
      await atomicWrite(EXAMS_FILE, [DEFAULT_SAMPLE_EXAM]);
      return [DEFAULT_SAMPLE_EXAM];
    }
    return exams;
  },

  async getExamById(id: string): Promise<Exam | null> {
    const exams = await this.getExams();
    return exams.find(e => e.id === id) || null;
  },

  async saveExam(exam: Exam): Promise<Exam> {
    const exams = await this.getExams();
    const index = exams.findIndex(e => e.id === exam.id);
    if (index >= 0) {
      exams[index] = exam;
    } else {
      exams.unshift(exam);
    }
    await atomicWrite(EXAMS_FILE, exams);
    return exam;
  },

  async deleteExam(id: string): Promise<boolean> {
    const exams = await this.getExams();
    const filtered = exams.filter(e => e.id !== id);
    if (filtered.length !== exams.length) {
      await atomicWrite(EXAMS_FILE, filtered);
      return true;
    }
    return false;
  },

  // Attempts
  async getAttempts(userId?: string): Promise<Attempt[]> {
    const attempts = await readJsonFile<Attempt[]>(ATTEMPTS_FILE, []);
    if (userId) {
      return attempts.filter(a => !a.userId || a.userId === userId);
    }
    return attempts;
  },

  async getAttemptById(id: string): Promise<Attempt | null> {
    const attempts = await readJsonFile<Attempt[]>(ATTEMPTS_FILE, []);
    return attempts.find(a => a.id === id) || null;
  },

  async saveAttempt(attempt: Attempt): Promise<Attempt> {
    const attempts = await readJsonFile<Attempt[]>(ATTEMPTS_FILE, []);
    const index = attempts.findIndex(a => a.id === attempt.id);
    if (index >= 0) {
      attempts[index] = attempt;
    } else {
      attempts.unshift(attempt);
    }
    await atomicWrite(ATTEMPTS_FILE, attempts);
    return attempt;
  },

  async deleteAttempt(id: string): Promise<boolean> {
    const attempts = await readJsonFile<Attempt[]>(ATTEMPTS_FILE, []);
    const filtered = attempts.filter(a => a.id !== id);
    if (filtered.length !== attempts.length) {
      await atomicWrite(ATTEMPTS_FILE, filtered);
      return true;
    }
    return false;
  },

  // Preferences
  async getPrefs(): Promise<UserPrefs> {
    return await readJsonFile<UserPrefs>(PREFS_FILE, {
      theme: 'light',
      soundEnabled: true,
      fontSize: 'normal'
    });
  },

  async savePrefs(prefs: Partial<UserPrefs>): Promise<UserPrefs> {
    const current = await this.getPrefs();
    const updated = { ...current, ...prefs };
    await atomicWrite(PREFS_FILE, updated);
    return updated;
  }
};
