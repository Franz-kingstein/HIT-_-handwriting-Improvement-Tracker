
import React, { useState } from 'react';
import { PageFormat } from '../types';

const TemplatesView: React.FC = () => {
  const [selectedFormat, setSelectedFormat] = useState<PageFormat>('four-rule');

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-left duration-300 pb-20">
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-royal tracking-tight">Writing Guides</h2>
        <p className="text-slate-400 text-[11px] font-medium uppercase tracking-wide">Standardized templates for your manual practice</p>
      </div>

      <div className="flex gap-2 bg-slate-200/40 p-1.5 rounded-[1.25rem]">
        {(['four-rule', 'lined', 'unruled'] as PageFormat[]).map((format) => (
          <button
            key={format}
            onClick={() => setSelectedFormat(format)}
            className={`flex-1 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all ${
              selectedFormat === format ? 'bg-white text-royal shadow-md' : 'text-slate-400 hover:text-royal'
            }`}
          >
            {format.replace('-', ' ')}
          </button>
        ))}
      </div>

      <div className="aspect-[3/4.2] bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-10 overflow-hidden relative group">
        <div className="absolute top-0 left-10 w-px h-full bg-red-100 opacity-50"></div>
        
        {selectedFormat === 'four-rule' && (
          <div className="h-full w-full space-y-[24px]">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="flex flex-col h-[40px] opacity-40">
                <div className="border-b-[1.5px] border-red-300 w-full opacity-60"></div>
                <div className="border-b border-blue-200 w-full h-[12px]"></div>
                <div className="border-b border-blue-200 w-full h-[12px]"></div>
                <div className="border-b-[1.5px] border-red-300 w-full opacity-60"></div>
              </div>
            ))}
          </div>
        )}
        
        {selectedFormat === 'lined' && (
          <div className="h-full w-full opacity-30 space-y-7">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="border-b border-slate-300 w-full"></div>
            ))}
          </div>
        )}

        {selectedFormat === 'unruled' && (
          <div className="h-full w-full flex items-center justify-center opacity-[0.03]">
            <div className="text-[12rem] font-black text-royal select-none">HIT</div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/10 pointer-events-none"></div>
      </div>

      <div className="bg-cream/50 p-6 rounded-[2rem] border border-royal/5 text-center space-y-2">
        <p className="text-[10px] font-black text-royal/60 uppercase tracking-[0.2em]">Usage Tip</p>
        <p className="text-xs text-royal/80 leading-relaxed font-medium">
          Lay your physical notebook over this template if practicing on translucent paper, or use it as a visual reference for line heights.
        </p>
      </div>

      <div className="text-center">
        <button className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-royal transition-all underline underline-offset-4">
          Export as Print-Ready PDF
        </button>
      </div>
    </div>
  );
};

export default TemplatesView;
