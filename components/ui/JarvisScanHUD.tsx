// components/ui/JarvisScanHUD.tsx
'use client';

import { useState, useEffect } from 'react';
import { Shield, Sparkles, Terminal } from 'lucide-react';

export function JarvisScanHUD() {
  const [logIndex, setLogIndex] = useState(0);

  const logs = [
    "INITIALIZING SEMANTIC DISCOVERY...",
    "SCANNING POSTGRE ALUMNI DATABASE...",
    "EXTRACTING SKILL SETS & DOMICILE MATCHES...",
    "COMPARING WORK HISTORY VECTORS...",
    "ESTABLISHING RADIAL CONNECTIVITY...",
    "DRAFTING COLLABORATION REPORT...",
    "SYNTHESIZING LLM JUSTIFICATION..."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setLogIndex((prev) => (prev + 1) % logs.length);
    }, 800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[220px] rounded-xl border border-indigo-500/30 bg-slate-950/80 overflow-hidden flex flex-col justify-center items-center p-6 shadow-[0_0_30px_rgba(99,102,241,0.15)] select-none">
      
      {/* 1. Technical Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

      {/* 2. Laser Scanline */}
      <div className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_10px_#6366f1] animate-[scan_2s_ease-in-out_infinite] z-10 pointer-events-none" />

      {/* 3. Concentric Rotating Tech HUD Rings */}
      <div className="relative w-28 h-28 flex justify-center items-center mb-4">
        {/* Outer Ring */}
        <svg className="absolute w-full h-full text-indigo-500/40 animate-[spin_8s_linear_infinite]" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="1" strokeDasharray="30 10 10 10 20 20" fill="none" />
        </svg>

        {/* Middle Ring (Reverse rotation) */}
        <svg className="absolute w-20 h-20 text-purple-400/50 animate-[spin_4s_linear_infinite_reverse]" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1.5" strokeDasharray="15 15 5 5" fill="none" />
        </svg>

        {/* Inner Ring (Pulsating) */}
        <svg className="absolute w-12 h-12 text-indigo-400 animate-pulse" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="2" strokeDasharray="40 10" fill="none" />
        </svg>

        {/* Core Icon */}
        <Sparkles className="h-5 w-5 text-indigo-300 animate-pulse z-10" />
      </div>

      {/* 4. Terminal Log Status Feed */}
      <div className="w-full max-w-[280px] bg-slate-900/60 p-2 rounded border border-white/5 font-mono text-[9px] text-indigo-300 flex items-center gap-1.5 shadow-inner">
        <Terminal className="h-3 w-3 text-indigo-400 flex-shrink-0 animate-pulse" />
        <div className="truncate flex-1">
          <span className="text-slate-500 font-bold mr-1">&gt;</span>
          <span className="animate-pulse">{logs[logIndex]}</span>
        </div>
      </div>
    </div>
  );
}
