// components/jobs/CVCreatorTab.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { 
  Sparkles, 
  Download, 
  Save, 
  RefreshCw, 
  Bold as BoldIcon, 
  Italic as ItalicIcon, 
  Underline as UnderlineIcon, 
  List as ListIcon, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Trash2,
  Copy,
  Check,
  Sliders,
  Info,
  Type
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { playClickSound, playSuccessSound } from '@/lib/audio';

interface LayoutSettings {
  layoutType: 'single' | 'double';
  sidebarPosition: 'left' | 'right';
  sidebarWidth: number; // percentage (20-50)
  columnGap: number; // pixels (8-40)
}

interface HTMLContent {
  header: string;
  main: string;
  sidebar: string;
}

export function CVCreatorTab() {
  const [layoutSettings, setLayoutSettings] = useState<LayoutSettings>({
    layoutType: 'single',
    sidebarPosition: 'left',
    sidebarWidth: 30,
    columnGap: 24
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'dirty'>('saved');

  // AI Assistant drawer/panel state
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [rawText, setRawText] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [optimizing, setOptimizing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Refs for the editable regions
  const headerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Autosave timers and layout ref
  const autosaveTimer = useRef<NodeJS.Timeout | null>(null);
  const layoutSettingsRef = useRef(layoutSettings);

  // Update layout ref
  useEffect(() => {
    layoutSettingsRef.current = layoutSettings;
  }, [layoutSettings]);

  // Initial content cache so we only load it once into innerHTML
  const initialContent = useRef<HTMLContent>({ header: '', main: '', sidebar: '' });

  // Fetch saved CV or generate defaults
  useEffect(() => {
    async function loadCV() {
      try {
        const res = await fetch('/api/jobs/cv');
        if (!res.ok) throw new Error('Gagal memuat data CV.');
        const data = await res.json();
        
        setLayoutSettings(data.layoutSettings || {
          layoutType: 'single',
          sidebarPosition: 'left',
          sidebarWidth: 30,
          columnGap: 24
        });

        initialContent.current = data.htmlContent || { header: '', main: '', sidebar: '' };
      } catch (err: any) {
        toast.error('Gagal memuat data CV', { description: err.message });
      } finally {
        setLoading(false);
      }
    }
    loadCV();
  }, []);

  // Inject content once editable elements are mounted (loading is false)
  useEffect(() => {
    if (!loading) {
      if (headerRef.current) headerRef.current.innerHTML = initialContent.current.header;
      if (mainRef.current) mainRef.current.innerHTML = initialContent.current.main;
      if (sidebarRef.current) sidebarRef.current.innerHTML = initialContent.current.sidebar;
    }
  }, [loading]);

  // Trigger autosave on settings change
  useEffect(() => {
    if (!loading) {
      triggerAutosave();
    }
  }, [layoutSettings]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
      }
    };
  }, []);

  // Autosave function
  const triggerAutosave = () => {
    setSaveStatus('dirty');
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
    }
    autosaveTimer.current = setTimeout(async () => {
      setSaveStatus('saving');
      const saveData = {
        layoutSettings: layoutSettingsRef.current,
        htmlContent: {
          header: headerRef.current?.innerHTML || '',
          main: mainRef.current?.innerHTML || '',
          sidebar: sidebarRef.current?.innerHTML || ''
        }
      };
      try {
        const res = await fetch('/api/jobs/cv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(saveData)
        });
        if (!res.ok) throw new Error();
        setSaveStatus('saved');
      } catch (err) {
        setSaveStatus('dirty');
      }
    }, 2000); // Trigger save 2 seconds after user stops typing
  };

  // Format Text helper using native execCommand
  const formatText = (command: string, value: string = '') => {
    playClickSound();
    document.execCommand(command, false, value);
    triggerAutosave();
  };

  // Set font size helper using execCommand
  const setFontSize = (sizeStr: string) => {
    playClickSound();
    document.execCommand('fontSize', false, sizeStr);
    triggerAutosave();
  };

  // Save CV Content manually to DB
  const handleSave = async () => {
    playClickSound();
    setSaving(true);
    setSaveStatus('saving');

    const saveData = {
      layoutSettings,
      htmlContent: {
        header: headerRef.current?.innerHTML || '',
        main: mainRef.current?.innerHTML || '',
        sidebar: sidebarRef.current?.innerHTML || ''
      }
    };

    try {
      const res = await fetch('/api/jobs/cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData)
      });
      if (!res.ok) throw new Error('Gagal menyimpan draf.');
      playSuccessSound();
      setSaveStatus('saved');
      toast.success('Draf CV berhasil disimpan!');
    } catch (err: any) {
      setSaveStatus('dirty');
      toast.error('Gagal menyimpan draf', { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Generate CV from User Profile
  const handleGenerateFromProfile = async () => {
    playClickSound();
    if (!window.confirm("Apakah Anda yakin ingin me-reset isi CV dan meng-generate ulang otomatis berdasarkan data profil Anda saat ini? Perubahan yang belum disimpan pada draf CV akan hilang.")) {
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/jobs/cv?reset=true');
      if (!res.ok) throw new Error('Gagal memuat data profil.');
      const data = await res.json();
      
      setLayoutSettings(data.layoutSettings || {
        layoutType: 'single',
        sidebarPosition: 'left',
        sidebarWidth: 30,
        columnGap: 24
      });

      // Inject content into contentEditable elements
      if (headerRef.current) headerRef.current.innerHTML = data.htmlContent?.header || '';
      if (mainRef.current) mainRef.current.innerHTML = data.htmlContent?.main || '';
      if (sidebarRef.current) sidebarRef.current.innerHTML = data.htmlContent?.sidebar || '';

      toast.success('CV berhasil di-generate ulang otomatis dari profil!');
      
      // Save it immediately
      const saveData = {
        layoutSettings: data.layoutSettings || {
          layoutType: 'single',
          sidebarPosition: 'left',
          sidebarWidth: 30,
          columnGap: 24
        },
        htmlContent: {
          header: data.htmlContent?.header || '',
          main: data.htmlContent?.main || '',
          sidebar: data.htmlContent?.sidebar || ''
        }
      };

      await fetch('/api/jobs/cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData)
      });
      setSaveStatus('saved');
    } catch (err: any) {
      toast.error('Gagal me-regenerate CV dari profil', { description: err.message });
    } finally {
      setGenerating(false);
    }
  };

  // AI Optimizer fetch
  const handleAIOptimize = async () => {
    playClickSound();
    if (!rawText.trim()) {
      toast.info('Tuliskan teks kasar pekerjaan/kegiatan Anda.');
      return;
    }
    setOptimizing(true);
    setAiResult('');
    try {
      const res = await fetch('/api/ai/cv-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: rawText })
      });
      if (!res.ok) throw new Error('AI Server gagal merespon.');
      const data = await res.json();
      setAiResult(data.suggestion);
      playSuccessSound();
    } catch (err: any) {
      toast.error('Gagal optimasi AI', { description: err.message });
    } finally {
      setOptimizing(false);
    }
  };

  // Copy AI Suggestion to clipboard
  const handleCopyResult = () => {
    playClickSound();
    navigator.clipboard.writeText(aiResult);
    setCopied(true);
    toast.success('Saran disalin! Silakan paste langsung ke bagian dokumen yang diinginkan.');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-slate-400">
        <RefreshCw className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-xs">Memuat CV Editor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-16 relative">
      
      {/* Stylesheet specifically to print A4 Page preview cleanly */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #ats-cv-preview-container, #ats-cv-preview-container * {
            visibility: visible !important;
          }
          #ats-cv-preview-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
          }
          header, nav, footer, button, .no-print, .toolbar-panel, .ai-panel {
            display: none !important;
            height: 0 !important;
            width: 0 !important;
            overflow: hidden !important;
          }
          [contenteditable] {
            outline: none !important;
            border: none !important;
          }
        }
      `}} />

      {/* FLOATING AI ASSISTANT PANEL */}
      {showAIPanel && (
        <div className="fixed right-6 bottom-20 z-50 w-80 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 space-y-3 no-print animate-slideUp text-left ai-panel">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-900 pb-2">
            <div className="flex items-center gap-1 text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              Asisten AI STAR/XYZ
            </div>
            <button 
              onClick={() => { playClickSound(); setShowAIPanel(false); }}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Tutup
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Teks Pekerjaan Kasar</label>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Contoh: Mengembangkan website kantor pertanahan, memecahkan masalah error database, berkoordinasi dengan tim..."
              className="w-full h-20 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none resize-none focus:border-primary"
            />
          </div>

          <Button
            onClick={handleAIOptimize}
            disabled={optimizing}
            className="w-full bg-slate-900 hover:bg-slate-850 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 font-bold text-xs h-8 rounded-lg flex items-center justify-center gap-1.5"
          >
            {optimizing ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            <span>{optimizing ? 'Mengoptimalkan...' : 'Optimalkan Sekarang'}</span>
          </Button>

          {aiResult && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-900">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Saran Bullet Points AI</span>
                <button 
                  onClick={handleCopyResult}
                  className="text-[9px] font-bold text-primary hover:text-primary/95 flex items-center gap-0.5"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? 'Tersalin' : 'Salin Teks'}</span>
                </button>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-150 dark:border-slate-800 text-[10px] text-slate-800 dark:text-slate-200 font-serif leading-relaxed max-h-36 overflow-y-auto whitespace-pre-line">
                {aiResult}
              </div>
            </div>
          )}
        </div>
      )}

      {/* RICH TEXT FORMATTING TOOLBAR & LAYOUT PANELS (no-print) */}
      <div className="bg-white dark:bg-[#1b1f23] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-4 no-print toolbar-panel">
        
        {/* Top bar: Info and main Save/Print actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex gap-2 items-start">
            <Info className="h-4.5 w-4.5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-left">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">CV Editor</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Lembar kertas di bawah adalah kanvas bebas. Klik di manapun untuk mengetik, menghapus, memformat tulisan, atau mengubah susunan kolom.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            
            {/* Live Autosave Status Indicator */}
            <div className="mr-2">
              {saveStatus === 'saved' && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  <span>Draf Tersimpan</span>
                </span>
              )}
              {saveStatus === 'saving' && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                  <span>Menyimpan otomatis...</span>
                </span>
              )}
              {saveStatus === 'dirty' && (
                <span className="text-[10px] text-amber-600 dark:text-amber-500 font-medium italic">
                  Perubahan belum disimpan
                </span>
              )}
            </div>

            <Button 
              onClick={() => { playClickSound(); setShowAIPanel(!showAIPanel); }}
              variant="outline"
              size="sm"
              className="h-8 border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-200"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary mr-1 animate-pulse" />
              Asisten AI STAR
            </Button>
            <Button 
              onClick={handleGenerateFromProfile} 
              disabled={generating}
              variant="outline"
              className="border-slate-200 dark:border-slate-800 text-[10px] font-bold h-8 px-3 rounded-md flex items-center gap-1"
              title="Generate CV otomatis dari data profil Anda saat ini"
            >
              {generating ? <RefreshCw className="h-3 w-3 animate-spin text-primary" /> : <RefreshCw className="h-3 w-3" />}
              <span>Generate dari Profil</span>
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              variant="outline"
              className="border-slate-200 dark:border-slate-800 text-[10px] font-bold h-8 px-3 rounded-md flex items-center gap-1"
            >
              {saving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              <span>Simpan Manual</span>
            </Button>
            <Button 
              onClick={() => { playClickSound(); window.print(); }}
              className="bg-primary hover:bg-primary/95 text-white text-[10px] font-bold h-8 px-3 rounded-md flex items-center gap-1 shadow-sm"
            >
              <Download className="h-3 w-3" />
              <span>Unduh PDF</span>
            </Button>
          </div>
        </div>

        {/* Toolbar: Rich Text + Layout settings */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Group 1: Rich Text Actions */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
            <button 
              onClick={() => formatText('bold')} 
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-350"
              title="Tebal (Ctrl+B)"
            >
              <BoldIcon className="h-3.5 w-3.5 font-bold" />
            </button>
            <button 
              onClick={() => formatText('italic')} 
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-350"
              title="Miring (Ctrl+I)"
            >
              <ItalicIcon className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={() => formatText('underline')} 
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-350"
              title="Garis Bawah (Ctrl+U)"
            >
              <UnderlineIcon className="h-3.5 w-3.5" />
            </button>
            <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 mx-1" />
            <button 
              onClick={() => formatText('insertUnorderedList')} 
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-350"
              title="Bullet Points"
            >
              <ListIcon className="h-3.5 w-3.5" />
            </button>
            <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 mx-1" />
            <button 
              onClick={() => formatText('justifyLeft')} 
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-350"
              title="Rata Kiri"
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={() => formatText('justifyCenter')} 
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-350"
              title="Rata Tengah"
            >
              <AlignCenter className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={() => formatText('justifyRight')} 
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-350"
              title="Rata Kanan"
            >
              <AlignRight className="h-3.5 w-3.5" />
            </button>
            <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 mx-1" />
            
            {/* Font Size Selector */}
            <div className="flex items-center gap-0.5" title="Ukuran Font">
              <Type className="h-3 w-3 text-slate-400 mx-1" />
              <select
                onChange={(e) => setFontSize(e.target.value)}
                defaultValue="2"
                className="bg-transparent text-[10px] font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer pr-1"
              >
                <option value="1">Kecil</option>
                <option value="2">Normal</option>
                <option value="3">Sedang</option>
                <option value="4">Besar</option>
                <option value="5">Judul Kecil</option>
                <option value="6">Judul Besar</option>
              </select>
            </div>
          </div>

          {/* Group 2: Column Layout sliders */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
            
            {/* Layout type */}
            <div className="flex items-center gap-1">
              <Sliders className="h-3 w-3 text-slate-400" />
              <select
                value={`${layoutSettings.layoutType}_${layoutSettings.sidebarPosition}`}
                onChange={(e) => {
                  playClickSound();
                  const [type, pos] = e.target.value.split('_') as ['single' | 'double', 'left' | 'right'];
                  setLayoutSettings({ ...layoutSettings, layoutType: type, sidebarPosition: pos });
                }}
                className="bg-transparent text-[10px] outline-none font-bold"
              >
                <option value="single_left">1 Kolom (Standar ATS)</option>
                <option value="double_left">2 Kolom (Sidebar Kiri)</option>
                <option value="double_right">2 Kolom (Sidebar Kanan)</option>
              </select>
            </div>

            {layoutSettings.layoutType === 'double' && (
              <>
                <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 mx-0.5" />
                {/* Sidebar Width */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400">Lebar:</span>
                  <input
                    type="range"
                    min="20"
                    max="50"
                    value={layoutSettings.sidebarWidth}
                    onChange={(e) => setLayoutSettings({ ...layoutSettings, sidebarWidth: parseInt(e.target.value, 10) })}
                    className="w-16 h-1 bg-slate-200 dark:bg-slate-800 rounded appearance-none cursor-pointer accent-primary"
                  />
                  <span className="text-[10px] font-bold w-6">{layoutSettings.sidebarWidth}%</span>
                </div>

                <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 mx-0.5" />
                {/* Column Spacing */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400">Jarak:</span>
                  <input
                    type="range"
                    min="8"
                    max="40"
                    value={layoutSettings.columnGap}
                    onChange={(e) => setLayoutSettings({ ...layoutSettings, columnGap: parseInt(e.target.value, 10) })}
                    className="w-16 h-1 bg-slate-200 dark:bg-slate-800 rounded appearance-none cursor-pointer accent-primary"
                  />
                  <span className="text-[10px] font-bold w-7">{layoutSettings.columnGap}px</span>
                </div>
              </>
            )}

          </div>

        </div>

      </div>

      {/* RICH TEXT DOCUMENT CANVAS */}
      <div className="bg-slate-100 dark:bg-slate-900/40 p-4 md:p-8 rounded-2xl border border-slate-250 dark:border-slate-850 shadow-inner overflow-x-auto flex justify-start md:justify-center no-print-container w-full scrollbar-thin">
        
        {/* ATS CV SHEET (Looks like a real A4 Paper sheet) */}
        <div 
          id="ats-cv-preview-container"
          className="bg-white border border-slate-300 rounded-lg p-10 md:p-14 w-[800px] min-w-[800px] shadow-lg text-black font-serif leading-relaxed text-left min-h-[1050px] relative transition-all"
        >
          {/* Header Panel (Name and contacts details) */}
          <div 
            ref={headerRef}
            contentEditable
            suppressContentEditableWarning
            onInput={triggerAutosave}
            className="outline-none focus:ring-1 focus:ring-slate-350 focus:bg-slate-50/50 rounded p-2 transition-all w-full min-h-[50px] font-serif"
            style={{ fontStyle: 'normal' }}
          />

          {/* Column structure depending on layout settings */}
          {layoutSettings.layoutType === 'single' ? (
            
            // --- 1-COLUMN FULL WIDTH CANVAS ---
            <div className="mt-4">
              <div
                ref={mainRef}
                contentEditable
                suppressContentEditableWarning
                onInput={triggerAutosave}
                className="outline-none focus:ring-1 focus:ring-slate-350 focus:bg-slate-50/50 rounded p-2 transition-all w-full min-h-[800px] font-serif text-[11px]"
              />
            </div>

          ) : (
            
            // --- 2-COLUMN SPLIT SIDEBAR CANVAS ---
            <div 
              className="flex mt-4 items-stretch"
              style={{
                flexDirection: layoutSettings.sidebarPosition === 'left' ? 'row' : 'row-reverse',
                gap: `${layoutSettings.columnGap}px`
              }}
            >
              
              {/* Sidebar Panel content (Skills, Certifications, custom text) */}
              <div 
                className="flex flex-col"
                style={{ width: `${layoutSettings.sidebarWidth}%` }}
              >
                <div
                  ref={sidebarRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={triggerAutosave}
                  className="outline-none focus:ring-1 focus:ring-slate-350 focus:bg-slate-50/50 rounded p-2 transition-all w-full min-h-[800px] font-serif text-[11px]"
                />
              </div>

              {/* Vertical Column Separator Line */}
              <div className="w-[1.5px] bg-black/15 self-stretch select-none" />

              {/* Main Panel content (Summary, Experience, Education) */}
              <div 
                className="flex flex-col flex-grow"
                style={{ width: `${100 - layoutSettings.sidebarWidth}%` }}
              >
                <div
                  ref={mainRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={triggerAutosave}
                  className="outline-none focus:ring-1 focus:ring-slate-350 focus:bg-slate-50/50 rounded p-2 transition-all w-full min-h-[800px] font-serif text-[11px]"
                />
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
