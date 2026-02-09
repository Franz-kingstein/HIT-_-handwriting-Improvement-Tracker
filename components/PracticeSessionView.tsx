
import React, { useState, useRef, useEffect } from 'react';
import { analyzeHandwriting, generateDictation, decodeAudioData, generateDynamicPrompt } from '../services/geminiService';
import { AnalysisResult } from '../types';
import { ICONS } from '../constants';

interface PracticeSessionViewProps {
  onComplete: (photo: string, analysis: AnalysisResult, isSpeedMode: boolean) => void;
  onCancel: () => void;
}

const PracticeSessionView: React.FC<PracticeSessionViewProps> = ({ onComplete, onCancel }) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSpeedMode, setIsSpeedMode] = useState(false);
  const [practiceMode, setPracticeMode] = useState<'sentence' | 'paragraph'>('sentence');
  const [prompt, setPrompt] = useState<string>("");
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(true);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  const fetchPrompt = async () => {
    setIsLoadingPrompt(true);
    try {
      const p = await generateDynamicPrompt(practiceMode);
      setPrompt(p);
      setTimer(0);
      setIsTimerRunning(false);
      setPhoto(null);
    } catch (e) {
      setPrompt("Handwriting is a timeless skill that connects the mind and the body in perfect harmony.");
    } finally {
      setIsLoadingPrompt(false);
    }
  };

  useEffect(() => {
    fetchPrompt();
  }, [practiceMode]);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = window.setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTimerRunning]);

  const handleStartWriting = () => {
    setIsTimerRunning(true);
  };

  const handleStopWriting = () => {
    setIsTimerRunning(false);
  };

  const playDictation = async () => {
    setIsAudioLoading(true);
    try {
      const audioBytes = await generateDictation(prompt, isSpeedMode ? 'fast' : 'normal');
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const buffer = await decodeAudioData(audioBytes, audioCtx);
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.start();
      handleStartWriting();
    } catch (e) {
      alert("Failed to play dictation.");
    } finally {
      setIsAudioLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleStopWriting();
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!photo) return;
    setIsAnalyzing(true);
    try {
      const wordCount = prompt.split(/\s+/).filter(w => w.length > 0).length;
      const result = await analyzeHandwriting(photo, timer, wordCount, isSpeedMode);
      onComplete(photo, result, isSpeedMode);
    } catch (error) {
      alert("Analysis failed. Please try a clearer photo.");
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="fixed inset-0 bg-cream z-[60] flex flex-col items-center justify-center p-12 text-center">
        <div className="w-20 h-20 border-4 border-royal border-t-transparent rounded-full animate-spin mb-8"></div>
        <h2 className="text-2xl font-bold text-royal mb-2">HIT Intelligence</h2>
        <p className="text-slate-500 animate-pulse text-xs font-bold uppercase tracking-widest">Generating Progress Report...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-bottom duration-300 pb-12">
      <div className="flex items-center justify-between">
        <button onClick={onCancel} className="text-slate-400 hover:text-royal font-bold text-xs uppercase tracking-widest">Back</button>
        <div className="bg-royal text-white px-4 py-1.5 rounded-full text-xs font-mono flex items-center gap-2 shadow-lg shadow-royal/20">
          <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-ping"></span>
          {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
        </div>
        <button onClick={fetchPrompt} className="text-royal/60 hover:text-royal transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2 bg-slate-200/40 p-1 rounded-[1rem]">
          <button 
            onClick={() => setPracticeMode('sentence')}
            className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${practiceMode === 'sentence' ? 'bg-royal text-white shadow-sm' : 'text-slate-400'}`}
          >
            Quick Session
          </button>
          <button 
            onClick={() => setPracticeMode('paragraph')}
            className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${practiceMode === 'paragraph' ? 'bg-royal text-white shadow-sm' : 'text-slate-400'}`}
          >
            Deep Study
          </button>
        </div>

        <div className="flex gap-2 bg-slate-200/40 p-1 rounded-[1rem]">
          <button 
            onClick={() => setIsSpeedMode(false)}
            className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${!isSpeedMode ? 'bg-royal text-white shadow-sm' : 'text-slate-400'}`}
          >
            Precision Focus
          </button>
          <button 
            onClick={() => setIsSpeedMode(true)}
            className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${isSpeedMode ? 'bg-royal text-white shadow-sm' : 'text-slate-400'}`}
          >
            Speed Writing
          </button>
        </div>
      </div>

      <section className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden flex flex-col min-h-[14rem] max-h-[28rem]">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-royal/10"></div>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Practice Prompt</h3>
          {isLoadingPrompt && <span className="text-[9px] text-royal animate-pulse font-black uppercase">Syncing Exercise...</span>}
        </div>
        <div className="overflow-y-auto pr-2 no-scrollbar">
          {isLoadingPrompt ? (
            <div className="space-y-2">
              <div className="h-4 bg-slate-100 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-slate-100 rounded w-5/6 animate-pulse"></div>
              <div className="h-4 bg-slate-100 rounded w-4/6 animate-pulse"></div>
            </div>
          ) : (
            <p className={`text-royal cursive-font leading-relaxed selection:bg-cream ${practiceMode === 'sentence' ? 'text-2xl' : 'text-base'}`}>
              {prompt}
            </p>
          )}
        </div>
        
        {isSpeedMode && !isLoadingPrompt && (
          <button 
            onClick={playDictation}
            disabled={isAudioLoading}
            className="mt-6 flex items-center justify-center gap-2 text-royal font-bold text-[11px] bg-cream w-full py-3 rounded-xl border border-royal/10 hover:bg-royal hover:text-white transition-all disabled:opacity-50 uppercase tracking-widest"
          >
            {isAudioLoading ? 'Loading Audio...' : '🔊 Start Dictation'}
          </button>
        )}
      </section>

      {!photo ? (
        <div className="space-y-4">
          {!isTimerRunning && !isSpeedMode && !isLoadingPrompt && (
             <button 
                onClick={handleStartWriting}
                className="w-full py-4 rounded-[1.5rem] border-2 border-royal text-royal font-black uppercase text-[11px] tracking-widest hover:bg-royal hover:text-white transition-all shadow-sm"
             >
               Start Practice Timer
             </button>
          )}

          <div 
            onClick={() => {
              if (!isTimerRunning && !photo) handleStartWriting();
              fileInputRef.current?.click();
            }}
            className="aspect-square bg-white rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-royal transition-all group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-royal/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <ICONS.Camera className="w-12 h-12 text-slate-300 group-hover:text-royal transition-all group-hover:scale-110" />
            <div className="text-center px-8 z-10">
              <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Capture Submission</p>
              <p className="text-slate-300 text-[8px] uppercase mt-2 font-bold">HIT AI will scan for improvements</p>
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
          />
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="relative aspect-square bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border border-slate-800">
            <img src={photo} alt="Practice Capture" className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
            <button 
              onClick={() => { setPhoto(null); setTimer(0); }}
              className="absolute top-4 right-4 bg-white text-royal px-4 py-2 rounded-full text-[10px] font-black uppercase shadow-lg active:scale-90 transition-transform"
            >
              Retake
            </button>
            <div className="absolute bottom-6 left-8 text-white flex gap-10">
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest opacity-50">Timer</p>
                <p className="text-2xl font-black">{timer}s</p>
              </div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest opacity-50">Word Count</p>
                <p className="text-2xl font-black">{prompt.split(/\s+/).filter(w => w.length > 0).length}</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleAnalyze}
            className="w-full bg-royal text-white py-5 rounded-[1.5rem] font-bold shadow-xl transition-all flex items-center justify-center gap-3 hover:brightness-110 active:scale-95 text-sm uppercase tracking-widest"
          >
            <span>Run Tracking Analysis</span>
            <span className="text-lg">📊</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default PracticeSessionView;
