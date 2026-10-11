import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export interface User {
  id: string;
  email: string;
  name: string;
  password: string; // stored as salt:hash or hashed value
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

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const EXAMS_FILE = path.join(DATA_DIR, 'exams.json');
const ATTEMPTS_FILE = path.join(DATA_DIR, 'attempts.json');
const PREFS_FILE = path.join(DATA_DIR, 'prefs.json');

// In-memory serialized write queue to prevent concurrent JSON overwrites
const writeQueues: Map<string, Promise<unknown>> = new Map();

function serializedWrite<T>(fileKey: string, op: () => Promise<T>): Promise<T> {
  const current = writeQueues.get(fileKey) || Promise.resolve();
  const next = current.then(op, op);
  writeQueues.set(fileKey, next);
  return next as Promise<T>;
}

// Password hashing & verification
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;
  // Backward compatibility with demo plaintext passwords
  if (!stored.includes(':')) {
    return password === stored;
  }
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const attemptHash = crypto.scryptSync(password, salt, 64).toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(attemptHash, 'hex'));
  } catch {
    return false;
  }
}

// In-memory session store
const sessions: Map<string, { userId: string; expiresAt: number }> = new Map();

export function createSession(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  sessions.set(token, { userId, expiresAt });
  return token;
}

export function getUserIdByToken(token: string): string | null {
  if (!token) return null;
  const sess = sessions.get(token);
  if (!sess) return null;
  if (Date.now() > sess.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return sess.userId;
}

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function atomicWrite(filePath: string, data: unknown) {
  await ensureDataDir();
  const tempPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 6)}`;
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
  password: hashPassword('password123'),
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
      await serializedWrite(USERS_FILE, () => atomicWrite(USERS_FILE, [DEFAULT_DEMO_USER]));
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
    return serializedWrite(USERS_FILE, async () => {
      const users = await readJsonFile<User[]>(USERS_FILE, [DEFAULT_DEMO_USER]);
      users.push(user);
      await atomicWrite(USERS_FILE, users);
      return user;
    });
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    return serializedWrite(USERS_FILE, async () => {
      const users = await readJsonFile<User[]>(USERS_FILE, [DEFAULT_DEMO_USER]);
      const idx = users.findIndex(u => u.id === id);
      if (idx === -1) return null;
      users[idx] = { ...users[idx], ...updates };
      await atomicWrite(USERS_FILE, users);
      return users[idx];
    });
  },

  // Exams
  async getExams(): Promise<Exam[]> {
    const exams = await readJsonFile<Exam[]>(EXAMS_FILE, [DEFAULT_SAMPLE_EXAM]);
    if (exams.length === 0) {
      await serializedWrite(EXAMS_FILE, () => atomicWrite(EXAMS_FILE, [DEFAULT_SAMPLE_EXAM]));
      return [DEFAULT_SAMPLE_EXAM];
    }
    return exams;
  },

  async getExamById(id: string): Promise<Exam | null> {
    const exams = await this.getExams();
    return exams.find(e => e.id === id) || null;
  },

  async saveExam(exam: Exam): Promise<Exam> {
    return serializedWrite(EXAMS_FILE, async () => {
      const exams = await readJsonFile<Exam[]>(EXAMS_FILE, [DEFAULT_SAMPLE_EXAM]);
      const index = exams.findIndex(e => e.id === exam.id);
      if (index >= 0) {
        exams[index] = exam;
      } else {
        exams.unshift(exam);
      }
      await atomicWrite(EXAMS_FILE, exams);
      return exam;
    });
  },

  async deleteExam(id: string): Promise<boolean> {
    return serializedWrite(EXAMS_FILE, async () => {
      const exams = await readJsonFile<Exam[]>(EXAMS_FILE, [DEFAULT_SAMPLE_EXAM]);
      const filtered = exams.filter(e => e.id !== id);
      if (filtered.length !== exams.length) {
        await atomicWrite(EXAMS_FILE, filtered);
        return true;
      }
      return false;
    });
  },

  // Attempts
  async getAttempts(userId?: string): Promise<Attempt[]> {
    const attempts = await readJsonFile<Attempt[]>(ATTEMPTS_FILE, []);
    if (userId) {
      return attempts.filter(a => a.userId === userId);
    }
    return attempts;
  },

  async getAttemptById(id: string): Promise<Attempt | null> {
    const attempts = await readJsonFile<Attempt[]>(ATTEMPTS_FILE, []);
    return attempts.find(a => a.id === id) || null;
  },

  async saveAttempt(attempt: Attempt): Promise<Attempt> {
    return serializedWrite(ATTEMPTS_FILE, async () => {
      const attempts = await readJsonFile<Attempt[]>(ATTEMPTS_FILE, []);
      const index = attempts.findIndex(a => a.id === attempt.id);
      if (index >= 0) {
        attempts[index] = attempt;
      } else {
        attempts.unshift(attempt);
      }
      await atomicWrite(ATTEMPTS_FILE, attempts);
      return attempt;
    });
  },

  async deleteAttempt(id: string): Promise<boolean> {
    return serializedWrite(ATTEMPTS_FILE, async () => {
      const attempts = await readJsonFile<Attempt[]>(ATTEMPTS_FILE, []);
      const filtered = attempts.filter(a => a.id !== id);
      if (filtered.length !== attempts.length) {
        await atomicWrite(ATTEMPTS_FILE, filtered);
        return true;
      }
      return false;
    });
  },

  // Preferences
  async getPrefs(): Promise<UserPrefs> {
    return await readJsonFile<UserPrefs>(PREFS_FILE, {
      theme: 'light',
      fontSize: 'normal'
    });
  },

  async savePrefs(prefs: Partial<UserPrefs>): Promise<UserPrefs> {
    return serializedWrite(PREFS_FILE, async () => {
      const current = await readJsonFile<UserPrefs>(PREFS_FILE, {
        theme: 'light',
        fontSize: 'normal'
      });
      const updated = { ...current, ...prefs };
      await atomicWrite(PREFS_FILE, updated);
      return updated;
    });
  }
};
