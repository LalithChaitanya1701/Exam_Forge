import React from 'react';
import { ViewMode, User } from '../types';
import { BookOpen, PlusCircle, User as UserIcon, Sun, Moon, Maximize2, Home, LogIn } from 'lucide-react';

interface NavbarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  currentUser: User | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  theme,
  onToggleTheme,
  currentUser,
}) => {
  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    } catch {}
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-[var(--border)] bg-[var(--surface)] transition-colors">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--c-sky)] to-[var(--c-navy)] flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
            EF
          </div>
          <div>
            <div className="font-serif font-bold text-lg sm:text-xl tracking-tight leading-tight flex items-center gap-1.5">
              <span>ExamForge</span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--border)] hidden sm:inline-block">
                CBT
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={() => onNavigate('landing')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
            currentView === 'landing'
              ? 'bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] shadow-xs'
              : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
          }`}
        >
          <Home className="w-4 h-4 text-[var(--muted)]" />
          <span className="hidden sm:inline">Home</span>
        </button>

        <button
          onClick={() => onNavigate('setup')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
            currentView === 'setup'
              ? 'bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] shadow-xs'
              : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
          }`}
        >
          <PlusCircle className="w-4 h-4 text-[var(--c-sky)]" />
          <span>Create Test</span>
        </button>

        <button
          onClick={() => onNavigate('library')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
            currentView === 'library'
              ? 'bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] shadow-xs'
              : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
          }`}
        >
          <BookOpen className="w-4 h-4 text-[var(--c-prev)]" />
          <span className="hidden xs:inline">Library</span>
        </button>

        <button
          onClick={() => onNavigate('profile')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
            currentView === 'profile'
              ? 'bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] shadow-xs'
              : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
          }`}
        >
          <UserIcon className="w-4 h-4 text-[var(--c-purple)]" />
          <span>Profile &amp; Reports</span>
        </button>
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {currentUser ? (
          <button
            onClick={() => onNavigate('profile')}
            className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--c-sky)] transition-all cursor-pointer text-xs font-semibold text-[var(--text)]"
            title="Go to Profile"
          >
            <div className="w-6 h-6 rounded-lg bg-[var(--c-navy)] text-white flex items-center justify-center font-bold text-[10px]">
              {currentUser.name.slice(0, 1).toUpperCase()}
            </div>
            <span className="hidden md:inline max-w-[100px] truncate">{currentUser.name}</span>
          </button>
        ) : (
          <button
            onClick={() => onNavigate('auth')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[var(--c-navy)] hover:brightness-110 shadow-xs transition-all cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Sign In</span>
          </button>
        )}

        <button
          onClick={onToggleTheme}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
          title="Toggle light/dark theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>

        <button
          onClick={toggleFullscreen}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer hidden sm:flex"
          title="Toggle Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
