
import React, { useMemo } from 'react';
import { AnalysisResult } from '../types';

interface AnalysisViewProps {
  analysis: AnalysisResult;
  photo: string;
  onDone: () => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, photo, onDone }) => {
  // Simulate comparison logic
  const isBetter = useMemo(() => analysis.overallScore > 70, [analysis.overallScore]);

  return (
    <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom duration-500 pb-32">
      <div className="text-center space-y-5">
        <div className="inline-block relative">
          <div className="absolute inset-0 bg-royal/5 rounded-full blur-2xl animate-pulse"></div>
          <svg className="w-44 h-44 transform -rotate-90 relative z-10">
            <circle
              cx="88" cy="88" r="82"
              stroke="#E2E8F0" strokeWidth="8" fill="transparent"
            />
            <circle
              cx="88" cy="88" r="82"
              stroke="#1A3A5A" strokeWidth="8" fill="transparent"
              strokeDasharray={515}
              strokeDashoffset={515 - (515 * analysis.overallScore) / 100}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
            <span className="text-6xl font-black text-royal tracking-tighter">{analysis.overallScore}</span>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] -mt-1">Mastery Score</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-royal capitalize flex items-center justify-center gap-2">
            <span>{analysis.styleDetected} Analysis</span>
            {isBetter && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">Growth Detected</span>}
          </h2>
          <div className="flex justify-center gap-3">
            <div className="bg-white shadow-sm px-4 py-2 rounded-2xl border border-slate-100">
               <span className="text-[9px] font-black text-slate-400 block uppercase tracking-widest mb-1">Velocity</span>
               <span className="text-sm font-black text-royal">{analysis.wpm || '--'} WPM</span>
            </div>
            <div className="bg-white shadow-sm px-4 py-2 rounded-2xl border border-slate-100">
               <span className="text-[9px] font-black text-slate-400 block uppercase tracking-widest mb-1">Pacing</span>
               <span className="text-sm font-black text-royal">{analysis.timeTakenSeconds || '--'}s</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Metric breakdown</h3>
            <span className="text-[8px] font-bold text-royal bg-cream px-2 py-1 rounded-full border border-royal/10">AI SCAN: ACTIVE</span>
          </div>
          <div className="space-y-8">
            {analysis.metrics.map((metric, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-royal text-sm tracking-tight">{metric.label}</span>
                  <span className="text-xs font-black text-royal">{metric.score}%</span>
                </div>
                <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
                  <div 
                    className="h-full bg-royal rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(26,58,90,0.2)]"
                    style={{ width: `${metric.score}%`, transitionDelay: `${idx * 150}ms` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                  "{metric.feedback}"
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 px-2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Recommended Drills</h3>
          <div className="grid grid-cols-1 gap-3">
            {analysis.suggestedExercises.map((ex, idx) => (
              <div key={idx} className="bg-cream border border-royal/5 p-5 rounded-[1.5rem] flex items-center gap-5 shadow-sm hover:translate-x-1 transition-transform cursor-pointer">
                <div className="bg-royal text-white w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 shadow-lg shadow-royal/20">
                  {idx + 1}
                </div>
                <p className="text-[11px] text-royal font-bold leading-relaxed">{ex}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-2xl px-8 z-50">
        <button 
          onClick={onDone}
          className="w-full bg-royal text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-royal/30 transition-all active:scale-95 hover:brightness-110"
        >
          Archive Result & Continue
        </button>
      </div>
    </div>
  );
};

export default AnalysisView;
