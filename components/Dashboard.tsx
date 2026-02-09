
import React, { useMemo } from 'react';
import { UserStats } from '../types';
import { HANDWRITING_TIPS } from '../constants';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface DashboardProps {
  stats: UserStats;
  onStartPractice: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, onStartPractice }) => {
  const chartData = useMemo(() => 
    [...stats.history].reverse().map(session => ({
      date: new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: session.analysis.overallScore,
      wpm: session.analysis.wpm || 0
    })).slice(-10), 
  [stats.history]);

  const skillMastery = useMemo(() => {
    const labels = ['Clarity', 'Consistency', 'Slant', 'Spacing'];
    const sums: Record<string, number> = { Clarity: 0, Consistency: 0, Slant: 0, Spacing: 0 };
    const counts: Record<string, number> = { Clarity: 0, Consistency: 0, Slant: 0, Spacing: 0 };

    stats.history.forEach(session => {
      session.analysis.metrics.forEach(m => {
        if (sums[m.label] !== undefined) {
          sums[m.label] += m.score;
          counts[m.label]++;
        }
      });
    });

    return labels.map(label => ({
      label,
      score: counts[label] > 0 ? Math.round(sums[label] / counts[label]) : 0
    }));
  }, [stats.history]);

  const getMasteryLevel = (score: number) => {
    if (score >= 90) return 'Master Scribe';
    if (score >= 75) return 'Adept Penman';
    if (score >= 50) return 'Apprentice';
    return 'Novice Scribe';
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500 pb-12">
      <section className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-royal cursive-font">Greetings, Scribe</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="bg-royal text-white text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded">
              {getMasteryLevel(stats.averageScore)}
            </span>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Lv.{Math.floor(stats.totalSessions / 5) + 1}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-royal font-black text-2xl leading-none">{stats.streak}</p>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Day Streak</p>
        </div>
      </section>

      {/* Primary Mastery Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Avg Mastery', val: `${stats.averageScore}%`, color: 'text-royal' },
          { label: 'Sessions', val: stats.totalSessions, color: 'text-royal' },
          { label: 'Top WPM', val: Math.max(...stats.history.map(s => s.analysis.wpm || 0), 0), color: 'text-royal' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-center">
            <span className={`text-xl font-black ${stat.color}`}>{stat.val}</span>
            <span className="block text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Tracking Section: Skill Mastery */}
      <section className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Growth Dimensions</h3>
        <div className="grid grid-cols-2 gap-6">
          {skillMastery.map((skill, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[11px] font-bold text-royal/60">{skill.label}</span>
                <span className="text-[11px] font-black text-royal">{skill.score}%</span>
              </div>
              <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
                <div 
                  className="h-full bg-royal rounded-full transition-all duration-1000" 
                  style={{ width: `${skill.score}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <button 
        onClick={onStartPractice}
        className="w-full bg-royal text-white py-5 rounded-[1.5rem] font-bold shadow-2xl transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95"
      >
        <span className="text-xl">🖋️</span>
        <span className="tracking-widest uppercase text-sm">Resume Daily Ritual</span>
      </button>

      {/* Progress Chart */}
      <section className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Improvement Track</h3>
          <span className="text-[8px] font-bold text-royal bg-cream px-2 py-1 rounded-full border border-royal/5">LAST 10 LOGS</span>
        </div>
        <div className="h-48 w-full -mx-2">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1A3A5A" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#1A3A5A" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="date" hide />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', background: '#1A3A5A', color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="score" stroke="#1A3A5A" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-300 italic text-xs">
              Waiting for practice data...
            </div>
          )}
        </div>
      </section>

      {/* Wisdom Snippets */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Handwriting Wisdom</h3>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar">
          {HANDWRITING_TIPS.map((tip, idx) => (
            <div 
              key={idx} 
              className="min-w-[200px] bg-cream p-5 rounded-[2rem] border border-royal/5 shadow-sm space-y-3 flex-shrink-0"
            >
              <div className="text-2xl opacity-80">{tip.icon}</div>
              <h4 className="font-bold text-royal text-[10px] uppercase tracking-wider">{tip.title}</h4>
              <p className="text-[11px] text-royal/70 leading-relaxed font-medium">{tip.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
