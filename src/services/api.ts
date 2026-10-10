import { Exam, Attempt, UserPrefs, User } from '../types';

function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('examforge_current_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getAuthHeaders(): Record<string, string> {
  const user = getStoredUser();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (user?.id) {
    headers['x-user-id'] = user.id;
  }
  return headers;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<User> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to log in');
    }
    const data = await res.json();
    localStorage.setItem('examforge_current_user', JSON.stringify(data.user));
    return data.user;
  },

  async register(name: string, email: string, password: string, targetExam?: string): Promise<User> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, targetExam })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to register');
    }
    const data = await res.json();
    localStorage.setItem('examforge_current_user', JSON.stringify(data.user));
    return data.user;
  },

  async getMe(): Promise<User | null> {
    const user = getStoredUser();
    if (!user) return null;
    try {
      const res = await fetch('/api/auth/me', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('examforge_current_user', JSON.stringify(data.user));
        return data.user;
      }
    } catch {
      // offline fallback
      return user;
    }
    return user;
  },

  async updateProfile(name: string, targetExam?: string): Promise<User> {
    const res = await fetch('/api/auth/profile', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, targetExam })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update profile');
    }
    const data = await res.json();
    localStorage.setItem('examforge_current_user', JSON.stringify(data.user));
    return data.user;
  },

  logout() {
    localStorage.removeItem('examforge_current_user');
  },

  // Health & Config
  async getHealth(): Promise<{ status: string }> {
    const res = await fetch('/api/health');
    return res.json();
  },

  async getConfig(): Promise<{ appUrl: string; environment: string }> {
    try {
      const res = await fetch('/api/config');
      if (res.ok) return res.json();
    } catch {
      // fallback
    }
    return { appUrl: '', environment: 'development' };
  },

  // Exams
  async getExams(): Promise<Exam[]> {
    try {
      const res = await fetch('/api/exams', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('examforge_cached_exams', JSON.stringify(data));
        return data;
      }
    } catch {
      // fallback
    }
    const cached = localStorage.getItem('examforge_cached_exams');
    return cached ? JSON.parse(cached) : [];
  },

  async getExamById(id: string): Promise<Exam | null> {
    try {
      const res = await fetch(`/api/exams/${id}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return res.json();
    } catch {
      // fallback
    }
    const cached = localStorage.getItem('examforge_cached_exams');
    if (cached) {
      const list: Exam[] = JSON.parse(cached);
      return list.find(e => e.id === id) || null;
    }
    return null;
  },

  async saveExam(exam: Partial<Exam>): Promise<Exam> {
    const user = getStoredUser();
    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...exam, userId: user?.id })
      });
      if (res.ok) return res.json();
    } catch {
      // fallback
    }
    const fullExam: Exam = {
      id: exam.id || `exam-${Date.now()}`,
      userId: user?.id,
      title: exam.title || 'Untitled Test',
      duration: exam.duration || 60,
      posMarks: exam.posMarks || 4,
      negMarks: exam.negMarks || 0,
      sections: exam.sections || ['General'],
      questions: exam.questions || [],
      totalMarks: exam.totalMarks || 0,
      createdAt: new Date().toISOString()
    };
    const cached = localStorage.getItem('examforge_cached_exams');
    const list: Exam[] = cached ? JSON.parse(cached) : [];
    list.unshift(fullExam);
    localStorage.setItem('examforge_cached_exams', JSON.stringify(list));
    return fullExam;
  },

  async deleteExam(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/exams/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) return true;
    } catch {
      // fallback
    }
    const cached = localStorage.getItem('examforge_cached_exams');
    if (cached) {
      const list: Exam[] = JSON.parse(cached);
      localStorage.setItem('examforge_cached_exams', JSON.stringify(list.filter(e => e.id !== id)));
    }
    return true;
  },

  // Grading & Attempts
  async gradeExam(
    examId: string,
    answers: Record<string, string>,
    marked: Record<string, boolean>,
    timeTakenSec: number
  ): Promise<Attempt> {
    const user = getStoredUser();
    try {
      const res = await fetch(`/api/exams/${examId}/grade`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ answers, marked, timeTakenSec, userId: user?.id })
      });
      if (res.ok) {
        const attempt: Attempt = await res.json();
        const historyRaw = localStorage.getItem('examforge_cached_history');
        const history: Attempt[] = historyRaw ? JSON.parse(historyRaw) : [];
        history.unshift(attempt);
        localStorage.setItem('examforge_cached_history', JSON.stringify(history));
        return attempt;
      }
    } catch {
      // fallback
    }
    throw new Error('Failed to grade exam');
  },

  async getAttempts(userId?: string): Promise<Attempt[]> {
    const user = getStoredUser();
    const effectiveUserId = userId || user?.id;
    const url = effectiveUserId ? `/api/attempts?userId=${encodeURIComponent(effectiveUserId)}` : '/api/attempts';
    try {
      const res = await fetch(url, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('examforge_cached_history', JSON.stringify(data));
        return data;
      }
    } catch {
      // fallback
    }
    const cached = localStorage.getItem('examforge_cached_history');
    return cached ? JSON.parse(cached) : [];
  },

  async deleteAttempt(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/attempts/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) return true;
    } catch {
      // fallback
    }
    const cached = localStorage.getItem('examforge_cached_history');
    if (cached) {
      const list: Attempt[] = JSON.parse(cached);
      localStorage.setItem('examforge_cached_history', JSON.stringify(list.filter(a => a.id !== id)));
    }
    return true;
  },

  // Preferences
  async getPrefs(): Promise<UserPrefs> {
    try {
      const res = await fetch('/api/prefs');
      if (res.ok) return res.json();
    } catch {
      // fallback
    }
    const saved = localStorage.getItem('examforge_prefs');
    return saved ? JSON.parse(saved) : { theme: 'light', soundEnabled: true, fontSize: 'normal' };
  },

  async savePrefs(prefs: Partial<UserPrefs>): Promise<UserPrefs> {
    try {
      const res = await fetch('/api/prefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs)
      });
      if (res.ok) return res.json();
    } catch {
      // fallback
    }
    const current = await this.getPrefs();
    const merged = { ...current, ...prefs };
    localStorage.setItem('examforge_prefs', JSON.stringify(merged));
    return merged;
  }
};
