
import React, { useState, useEffect } from 'react';
import { AppScreen, UserStats, PracticeSession, AnalysisResult } from './types';
import { ICONS } from './constants';
import Dashboard from './components/Dashboard';
import PracticeSessionView from './components/PracticeSessionView';
import HistoryView from './components/HistoryView';
import TemplatesView from './components/TemplatesView';
import AnalysisView from './components/AnalysisView';
import { signIn, signUp, signOut, getCurrentUser, LocalUser } from './services/authService';

const App: React.FC = () => {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.DASHBOARD);
  const [userStats, setUserStats] = useState<UserStats>({
    streak: 0,
    totalSessions: 0,
    averageScore: 0,
    history: []
  });
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [lastPhoto, setLastPhoto] = useState<string | null>(null);

  // Restore session on load
  useEffect(() => {
    const savedUser = getCurrentUser();
    if (savedUser) {
      setUser(savedUser);
    }
    const guest = localStorage.getItem('hitGuestAuth');
    if (guest === 'true') {
      setIsGuest(true);
    }
  }, []);

  // Load stats from localStorage (keyed by user)
  useEffect(() => {
    const storageKey = user ? `hitAppStats_${user.uid}` : 'hitAppStats_guest';
    const savedStats = localStorage.getItem(storageKey);
    if (savedStats) setUserStats(JSON.parse(savedStats));
    else setUserStats({ streak: 0, totalSessions: 0, averageScore: 0, history: [] });
  }, [user]);

  // Save stats
  useEffect(() => {
    const storageKey = user ? `hitAppStats_${user.uid}` : 'hitAppStats_guest';
    localStorage.setItem(storageKey, JSON.stringify(userStats));
  }, [userStats, user]);

  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      if (isSignUpMode) {
        if (!nameInput.trim()) {
          setAuthError('Please enter your name.');
          return;
        }
        const newUser = signUp(emailInput, passwordInput, nameInput);
        setUser(newUser);
      } else {
        const existingUser = signIn(emailInput, passwordInput);
        setUser(existingUser);
      }
      setEmailInput('');
      setPasswordInput('');
      setNameInput('');
    } catch (error: any) {
      setAuthError(error.message);
    }
  };

  const handleGuestLogin = () => {
    localStorage.setItem('hitGuestAuth', 'true');
    setIsGuest(true);
  };

  const handleSignOut = () => {
    setShowProfileMenu(false);
    signOut();
    setUser(null);
    localStorage.removeItem('hitGuestAuth');
    setIsGuest(false);
  };

  const handleFinishPractice = (photo: string, analysis: AnalysisResult, isSpeedMode: boolean) => {
    const newSession: PracticeSession = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      photoUrl: photo,
      analysis: analysis,
      isSpeedMode: isSpeedMode
    };

    const newHistory = [newSession, ...userStats.history];
    const totalSessions = newHistory.length;
    const avgScore = newHistory.reduce((acc, s) => acc + s.analysis.overallScore, 0) / totalSessions;
    
    let newStreak = userStats.streak;
    const lastSession = userStats.history[0];
    if (lastSession) {
      const lastDate = new Date(lastSession.date).setHours(0,0,0,0);
      const today = new Date().setHours(0,0,0,0);
      const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) newStreak += 1;
      else if (diffDays > 1) newStreak = 1;
    } else {
      newStreak = 1;
    }

    setUserStats({
      streak: newStreak,
      totalSessions: totalSessions,
      averageScore: Math.round(avgScore),
      history: newHistory
    });

    setLastPhoto(photo);
    setCurrentAnalysis(analysis);
    setCurrentScreen(AppScreen.ANALYSIS);
  };

  if (!user && !isGuest) {
    return (
      <div className="min-h-screen bg-royal flex flex-col items-center justify-center p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 cursive-font text-9xl select-none -z-0 pointer-events-none">
          abc def ghi jkl mno pqr stu vwx yz
        </div>
        <div className="z-10 text-center space-y-8 animate-in fade-in zoom-in duration-700 w-full max-w-sm">
          <div className="space-y-2">
            <h1 className="text-7xl font-black tracking-tighter">HIT</h1>
            <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-60">Handwriting Improvement Tracker</p>
          </div>
          <p className="text-sm font-medium leading-relaxed max-w-xs mx-auto opacity-80">
            Elevate your script with AI-powered analytics. Daily practice, precision feedback, and visible growth.
          </p>
          {authError && (
            <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-3 text-xs text-red-200">
              {authError}
            </div>
          )}
          <form onSubmit={handleEmailAuth} className="space-y-3 pt-4">
            {isSignUpMode && (
              <input
                type="text"
                placeholder="Your Name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 px-4 py-3.5 rounded-2xl text-sm font-medium focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all"
              />
            )}
            <input
              type="email"
              placeholder="Email Address"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              required
              className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 px-4 py-3.5 rounded-2xl text-sm font-medium focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all"
            />
            <input
              type="password"
              placeholder="Password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              required
              className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 px-4 py-3.5 rounded-2xl text-sm font-medium focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all"
            />
            <button 
              type="submit"
              className="w-full bg-white text-royal py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 hover:scale-105 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {isSignUpMode ? 'Create Account' : 'Sign In'}
            </button>
          </form>
          <button
            onClick={() => { setIsSignUpMode(!isSignUpMode); setAuthError(null); }}
            className="text-[11px] font-bold text-white/50 hover:text-white/80 transition-all underline underline-offset-4"
          >
            {isSignUpMode ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
          <div className="relative flex items-center gap-4 pt-2">
            <div className="flex-1 h-px bg-white/15"></div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">or</span>
            <div className="flex-1 h-px bg-white/15"></div>
          </div>
          <button 
            onClick={handleGuestLogin}
            className="w-full bg-royal border border-white/20 text-white/60 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-white/5 transition-all"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft flex flex-col max-w-2xl mx-auto shadow-2xl relative">
      <header className="bg-white/80 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div>
          <h1 className="text-2xl font-black text-royal tracking-tighter">HIT</h1>
          <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em]">Improvement Tracker</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
             <span className="text-[10px] font-black text-royal uppercase tracking-tighter leading-none">{userStats.averageScore}%</span>
             <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1">Global Mastery</span>
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-9 h-9 rounded-full bg-cream border-2 border-royal/10 flex items-center justify-center text-sm shadow-sm overflow-hidden hover:border-royal/30 transition-all"
            >
              <span className="font-bold text-royal text-xs">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : '👤'}
              </span>
            </button>
            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-[99]" onClick={() => setShowProfileMenu(false)} />
                <div className="absolute right-0 top-12 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 w-64 z-[100]">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-royal/10 border border-royal/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-base font-bold text-royal">
                        {user?.displayName ? user.displayName.charAt(0).toUpperCase() : '👤'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-royal truncate">{user?.displayName || 'Guest User'}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user?.email || 'No account linked'}</p>
                    </div>
                  </div>
                  <div className="pt-3">
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-all flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        {currentScreen === AppScreen.DASHBOARD && (
          <Dashboard stats={userStats} onStartPractice={() => setCurrentScreen(AppScreen.PRACTICE)} userName={user?.displayName?.split(' ')[0] || undefined} />
        )}
        {currentScreen === AppScreen.PRACTICE && (
          <PracticeSessionView onComplete={handleFinishPractice} onCancel={() => setCurrentScreen(AppScreen.DASHBOARD)} />
        )}
        {currentScreen === AppScreen.ANALYSIS && currentAnalysis && lastPhoto && (
          <AnalysisView analysis={currentAnalysis} photo={lastPhoto} onDone={() => setCurrentScreen(AppScreen.DASHBOARD)} />
        )}
        {currentScreen === AppScreen.HISTORY && (
          <HistoryView history={userStats.history} />
        )}
        {currentScreen === AppScreen.TEMPLATES && (
          <TemplatesView />
        )}
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white border-t px-8 py-4 flex justify-between items-center z-50 shadow-[0_-10px_40px_rgba(26,58,90,0.08)] rounded-t-[2.5rem]">
        <NavButton active={currentScreen === AppScreen.DASHBOARD} onClick={() => setCurrentScreen(AppScreen.DASHBOARD)} icon={<ICONS.Home className="w-5 h-5" />} label="Home" />
        <NavButton active={currentScreen === AppScreen.HISTORY} onClick={() => setCurrentScreen(AppScreen.HISTORY)} icon={<ICONS.History className="w-5 h-5" />} label="Logs" />
        <button onClick={() => setCurrentScreen(AppScreen.PRACTICE)} className="bg-royal text-white p-5 rounded-full -mt-16 shadow-2xl hover:scale-105 active:scale-90 transition-all border-4 border-white">
          <ICONS.Camera className="w-7 h-7" />
        </button>
        <NavButton active={currentScreen === AppScreen.TEMPLATES} onClick={() => setCurrentScreen(AppScreen.TEMPLATES)} icon={<ICONS.Templates className="w-5 h-5" />} label="Guides" />
        <NavButton active={currentScreen === AppScreen.PRACTICE} onClick={() => setCurrentScreen(AppScreen.PRACTICE)} icon={<ICONS.Camera className="w-5 h-5" />} label="Practice" />
      </nav>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all ${active ? 'text-royal font-black' : 'text-slate-300 font-bold'}`}>
    <div className={`p-2 rounded-xl transition-all ${active ? 'bg-cream' : 'bg-transparent'}`}>{icon}</div>
    <span className="text-[7px] uppercase tracking-[0.25em]">{label}</span>
  </button>
);

export default App;
