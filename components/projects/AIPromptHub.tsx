"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface AIPromptHubProps {
  userId: string;
  userFullName: string;
}

export function AIPromptHub({ userId, userFullName }: AIPromptHubProps) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const promptStarters = [
    "Saya punya waktu luang 10 jam/minggu, tertarik proyek sosial...",
    "Saya memiliki keahlian desain UI/UX dan video editing.",
    "Saya butuh kolaborator untuk proyek startup teknologi.",
  ];

  const handleSearch = async () => {
    if (!prompt.trim() && !userId && !userFullName) return;
    
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/ai/project-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: userId,
          nama_lengkap: userFullName,
          prompt_tambahan: prompt 
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal memproses rekomendasi. Pastikan backend FastAPI aktif.");
      }

      const data = await response.json();
      setResult(data.rekomendasi);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan yang tidak diketahui.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in duration-300">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950 p-8 rounded-2xl border border-blue-100 dark:border-indigo-900 shadow-sm text-center">
        <h2 className="text-2xl font-bold mb-4 text-indigo-900 dark:text-indigo-100">
          Cari Peluang Kolaborasi dengan AI
        </h2>
        <p className="text-indigo-700 dark:text-indigo-300 mb-6">
          Gunakan Natural Language untuk menceritakan situasi dan keahlian Anda secara bebas. Semantic AI kami akan mencocokkan profil Anda dengan peluang yang ada.
        </p>
        
        <div className="relative text-left">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ketikkan ketersediaan waktu, keahlian, atau kebutuhan spesifik Anda di sini..."
            className="w-full min-h-[120px] p-4 pb-16 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-slate-950 shadow-sm resize-none"
            disabled={isLoading}
          />
          <div className="absolute bottom-4 right-4">
            <Button onClick={handleSearch} disabled={isLoading || (!prompt.trim() && !userId && !userFullName)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {isLoading ? "Memproses AI..." : "Jalankan Pencarian Semantik"}
            </Button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center items-center gap-2">
          <span className="text-sm font-medium text-indigo-500 dark:text-indigo-400">Prompt Starters:</span>
          {promptStarters.map((starter, index) => (
            <button key={index} onClick={() => setPrompt(starter)} className="text-xs bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors">
              {starter}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">{error}</div>}
      {isLoading && <div className="space-y-4 animate-pulse"><div className="h-4 bg-slate-200 rounded w-3/4"></div><div className="h-4 bg-slate-200 rounded w-full"></div></div>}
      {result && !isLoading && (<div className="bg-white dark:bg-slate-900 p-6 rounded-xl border shadow-sm"><h3 className="text-lg font-bold mb-4 flex items-center"><span className="text-2xl mr-2">✨</span> Alasan Rekomendasi AI</h3><div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">{result}</div></div>)}
    </div>
  );
}
