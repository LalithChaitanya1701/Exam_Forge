import express, { Request, Response } from 'express';
import path from 'node:path';
import dotenv from 'dotenv';
import {
  db,
  Exam,
  Attempt,
  SectionBreakdown,
  User,
  hashPassword,
  verifyPassword,
  createSession,
  getUserIdByToken
} from './server/db.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

function getAuthenticatedUserId(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const userId = getUserIdByToken(token);
    if (userId) return userId;
  }
  const xUserId = req.headers['x-user-id'] as string;
  return xUserId || null;
}

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// App configuration
app.get('/api/config', (_req: Request, res: Response) => {
  res.json({
    appUrl: process.env.APP_URL || '',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Auth API
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, targetExam } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await db.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const newUser: User = {
      id: `usr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      password: hashPassword(password),
      targetExam: targetExam?.trim() || 'General Competitive Tests',
      createdAt: new Date().toISOString()
    };

    await db.createUser(newUser);
    const token = createSession(newUser.id);
    const { password: _, ...safeUser } = newUser;
    res.status(201).json({ user: safeUser, token });
  } catch (err: unknown) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await db.getUserByEmail(email);
    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = createSession(user.id);
    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err: unknown) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

app.get('/api/auth/me', async (req: Request, res: Response) => {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (err: unknown) {
    console.error('Auth verification error:', err);
    res.status(500).json({ error: 'Authentication check failed' });
  }
});

app.post('/api/auth/profile', async (req: Request, res: Response) => {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { name, targetExam } = req.body;
    const updated = await db.updateUser(userId, { name, targetExam });
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password: _, ...safeUser } = updated;
    res.json({ user: safeUser });
  } catch (err: unknown) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Exams API
app.get('/api/exams', async (_req: Request, res: Response) => {
  try {
    const exams = await db.getExams();
    res.json(exams);
  } catch (err: unknown) {
    console.error('Failed to get exams:', err);
    res.status(500).json({ error: 'Failed to retrieve exams' });
  }
});

app.get('/api/exams/:id', async (req: Request, res: Response) => {
  try {
    const exam = await db.getExamById(req.params.id);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    res.json(exam);
  } catch (err: unknown) {
    console.error(`Failed to get exam ${req.params.id}:`, err);
    res.status(500).json({ error: 'Failed to retrieve exam' });
  }
});

app.post('/api/exams', async (req: Request, res: Response) => {
  try {
    const { title, duration, posMarks, negMarks, sections, questions, userId } = req.body;
    if (!title || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Invalid exam data: title and at least 1 question are required' });
    }

    const requesterId = getAuthenticatedUserId(req) || userId;
    const defaultPosMarks = Math.max(0.1, Number(posMarks) || 4);
    const resolvedQuestions = questions.map((q: Record<string, any>) => ({
      ...q,
      marks: Number(q.marks) || defaultPosMarks
    }));
    const totalMarks = resolvedQuestions.reduce((acc: number, q: { marks?: number }) => acc + (Number(q.marks) || defaultPosMarks), 0);
    const resolvedSections = Array.isArray(sections) && sections.length > 0
      ? sections
      : Array.from(new Set(resolvedQuestions.map((q: Record<string, any>) => q.section || 'General')));

    const newExam: Exam = {
      id: req.body.id || `exam-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      userId: requesterId || undefined,
      title: String(title).trim(),
      duration: Math.max(1, Number(duration) || 60),
      posMarks: defaultPosMarks,
      negMarks: Math.max(0, Number(negMarks) || 0),
      sections: resolvedSections as string[],
      questions: resolvedQuestions as any,
      totalMarks,
      createdAt: new Date().toISOString()
    };

    const saved = await db.saveExam(newExam);
    res.status(201).json(saved);
  } catch (err: unknown) {
    console.error('Failed to create exam:', err);
    res.status(500).json({ error: 'Failed to save exam' });
  }
});

app.delete('/api/exams/:id', async (req: Request, res: Response) => {
  try {
    const exam = await db.getExamById(req.params.id);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Protect sample diagnostic exam from deletion
    if (exam.isSample || exam.id === 'sample-01') {
      return res.status(403).json({ error: 'Cannot delete default sample diagnostic exam' });
    }

    const requesterId = getAuthenticatedUserId(req);
    if (exam.userId && requesterId && exam.userId !== requesterId) {
      return res.status(403).json({ error: 'Not authorized to delete this exam' });
    }

    const deleted = await db.deleteExam(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    res.json({ success: true });
  } catch (err: unknown) {
    console.error('Failed to delete exam:', err);
    res.status(500).json({ error: 'Failed to delete exam' });
  }
});

// Attempts API
app.get('/api/attempts', async (req: Request, res: Response) => {
  try {
    const userId = getAuthenticatedUserId(req) || (req.query.userId as string);
    if (!userId) {
      return res.json([]);
    }
    const attempts = await db.getAttempts(userId);
    res.json(attempts);
  } catch (err: unknown) {
    console.error('Failed to get attempts:', err);
    res.status(500).json({ error: 'Failed to retrieve attempt history' });
  }
});

app.get('/api/attempts/:id', async (req: Request, res: Response) => {
  try {
    const attempt = await db.getAttemptById(req.params.id);
    if (!attempt) {
      return res.status(404).json({ error: 'Attempt record not found' });
    }
    res.json(attempt);
  } catch (err: unknown) {
    console.error(`Failed to get attempt ${req.params.id}:`, err);
    res.status(500).json({ error: 'Failed to retrieve attempt' });
  }
});

app.post('/api/exams/:id/grade', async (req: Request, res: Response) => {
  try {
    const exam = await db.getExamById(req.params.id);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const { answers = {}, marked = {}, timeTakenSec = 0, userId } = req.body;
    const requesterId = getAuthenticatedUserId(req) || userId;
    let correct = 0;
    let wrong = 0;
    let unattempted = 0;
    let scoreObtained = 0;

    const bySection: Record<string, SectionBreakdown> = {};

    exam.questions.forEach(q => {
      const sec = q.section || 'General';
      const qPosMarks = Number(q.marks) || Number(exam.posMarks) || 4;

      if (!bySection[sec]) {
        bySection[sec] = { total: 0, correct: 0, wrong: 0, unattempted: 0, marks: 0, marksTotal: 0 };
      }
      bySection[sec].total += 1;
      bySection[sec].marksTotal += qPosMarks;

      const userChoice = answers[q.id];
      if (userChoice == null || userChoice === '') {
        unattempted += 1;
        bySection[sec].unattempted += 1;
      } else if (!q.answer) {
        // Question has no official answer key: do not penalize student with negative marks
        unattempted += 1;
        bySection[sec].unattempted += 1;
      } else if (String(userChoice).toUpperCase() === String(q.answer).toUpperCase()) {
        correct += 1;
        scoreObtained += qPosMarks;
        bySection[sec].correct += 1;
        bySection[sec].marks += qPosMarks;
      } else {
        wrong += 1;
        scoreObtained -= exam.negMarks;
        bySection[sec].wrong += 1;
        bySection[sec].marks -= exam.negMarks;
      }
    });

    const percentage = exam.totalMarks > 0 ? (scoreObtained / exam.totalMarks) * 100 : 0;

    const attempt: Attempt = {
      id: `att-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      userId: requesterId || undefined,
      examId: exam.id,
      examTitle: exam.title,
      date: new Date().toISOString(),
      score: Math.round(scoreObtained * 100) / 100,
      total: exam.totalMarks,
      percentage: Math.round(percentage * 100) / 100,
      correct,
      wrong,
      unattempted,
      timeTakenSec: Number(timeTakenSec) || 0,
      bySection,
      answers,
      marked,
      questionsSnapshot: exam.questions
    };

    const saved = await db.saveAttempt(attempt);
    res.status(201).json(saved);
  } catch (err: unknown) {
    console.error('Failed to grade attempt:', err);
    res.status(500).json({ error: 'Failed to process and grade attempt' });
  }
});

app.delete('/api/attempts/:id', async (req: Request, res: Response) => {
  try {
    const attempt = await db.getAttemptById(req.params.id);
    if (!attempt) {
      return res.status(404).json({ error: 'Attempt record not found' });
    }

    const requesterId = getAuthenticatedUserId(req);
    if (attempt.userId && requesterId && attempt.userId !== requesterId) {
      return res.status(403).json({ error: 'Not authorized to delete this attempt' });
    }

    const deleted = await db.deleteAttempt(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Attempt record not found' });
    }
    res.json({ success: true });
  } catch (err: unknown) {
    console.error('Failed to delete attempt:', err);
    res.status(500).json({ error: 'Failed to delete attempt' });
  }
});

// Preferences API
app.get('/api/prefs', async (_req: Request, res: Response) => {
  try {
    const prefs = await db.getPrefs();
    res.json(prefs);
  } catch {
    res.json({ theme: 'light', fontSize: 'normal' });
  }
});

app.post('/api/prefs', async (req: Request, res: Response) => {
  try {
    const updated = await db.savePrefs(req.body);
    res.json(updated);
  } catch (err: unknown) {
    console.error('Failed to save prefs:', err);
    res.status(500).json({ error: 'Failed to save preferences' });
  }
});

// Setup Vite dev server or static file serving
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        port: PORT,
        host: '0.0.0.0'
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ExamForge server running in ${isProd ? 'production' : 'development'} mode on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
