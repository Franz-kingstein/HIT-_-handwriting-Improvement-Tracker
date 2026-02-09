
import React, { useState, useEffect } from 'react';
import { AppScreen, UserStats, PracticeSession, AnalysisResult } from './types';
import { ICONS } from './constants';
import Dashboard from './components/Dashboard';
import PracticeSessionView from './components/PracticeSessionView';
import HistoryView from './components/HistoryView';
import TemplatesView from './components/TemplatesView';
import AnalysisView from './components/AnalysisView';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.DASHBOARD);
  const [userStats, setUserStats] = useState<UserStats>({
    streak: 0,
    totalSessions: 0,
    averageScore: 0,
    history: []
  });
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [lastPhoto, setLastPhoto] = useState<string | null>(null);

  useEffect(() => {
    const savedStats = localStorage.getItem('hitAppStats');
    const auth = localStorage.getItem('hitAuth');
    if (savedStats) setUserStats(JSON.parse(savedStats));
    if (auth === 'true') setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('hitAppStats', JSON.stringify(userStats));
  }, [userStats]);

  const handleLogin = () => {
    localStorage.setItem('hitAuth', 'true');
    setIsAuthenticated(true);
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-royal flex flex-col items-center justify-center p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 cursive-font text-9xl select-none -z-0 pointer-events-none">
          abc def ghi jkl mno pqr stu vwx yz
        </div>
        <div className="z-10 text-center space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="space-y-2">
            <h1 className="text-7xl font-black tracking-tighter">HIT</h1>
            <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-60">Handwriting Improvement Tracker</p>
          </div>
          <p className="text-sm font-medium leading-relaxed max-w-xs mx-auto opacity-80">
            Elevate your script with AI-powered analytics. Daily practice, precision feedback, and visible growth.
          </p>
          <div className="space-y-3 pt-8">
            <button 
              onClick={handleLogin}
              className="w-full bg-white text-royal py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 hover:scale-105 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
            <button 
              onClick={handleLogin}
              className="w-full bg-royal border border-white/20 text-white/60 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-white/5 transition-all"
            >
              Continue as Guest
            </button>
          </div>
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
          <div className="w-8 h-8 rounded-full bg-cream border border-royal/10 flex items-center justify-center text-sm shadow-sm">👤</div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        {currentScreen === AppScreen.DASHBOARD && (
          <Dashboard stats={userStats} onStartPractice={() => setCurrentScreen(AppScreen.PRACTICE)} />
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
