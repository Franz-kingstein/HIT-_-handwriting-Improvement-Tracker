
import React from 'react';
import { PracticeSession } from '../types';

interface HistoryViewProps {
  history: PracticeSession[];
}

const HistoryView: React.FC<HistoryViewProps> = ({ history }) => {
  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-right duration-300">
      <h2 className="text-2xl font-bold">Your Journey</h2>
      
      {history.length === 0 ? (
        <div className="py-20 text-center space-y-4">
          <div className="text-5xl opacity-20">📝</div>
          <p className="text-slate-400 font-medium">No sessions logged yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((session) => (
            <div key={session.id} className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                <img src={session.photoUrl} alt="Session" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <h4 className="font-bold text-slate-800 capitalize">{session.analysis.styleDetected} Session</h4>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1 bg-slate-100 rounded-full">
                    <div 
                      className="h-full bg-blue-500 rounded-full" 
                      style={{ width: `${session.analysis.overallScore}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-blue-600">{session.analysis.overallScore}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryView;
