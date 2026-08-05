'use client';

import Script from 'next/script';
import { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';

type TurnstileWidgetProps = {
  siteKey: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  resetSignal?: number;
};

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export function TurnstileWidget({ siteKey, onVerify, onExpire, onError, resetSignal = 0 }: TurnstileWidgetProps) {
  const [scriptReady, setScriptReady] = useState(() => typeof window !== 'undefined' && !!window.turnstile);
  const [remountKey, setRemountKey] = useState(0);
  const widgetIdRef = useRef<string | null>(null);
  
  // Re-generate containerId when remountKey changes to force a fresh render target
  const containerId = useMemo(() => `turnstile-${Math.random().toString(36).slice(2, 11)}`, [remountKey]);

  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onVerifyRef.current = onVerify;
    onExpireRef.current = onExpire;
    onErrorRef.current = onError;
  }, [onVerify, onExpire, onError]);

  // Check if turnstile script is already loaded on mount (useful for client-side navigation)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.turnstile) {
      setScriptReady(true);
    }
  }, []);

  // Effect to load and render Turnstile widget
  useEffect(() => {
    if (!scriptReady || !siteKey || !window.turnstile) {
      return;
    }

    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch (err) {
        console.warn('Failed to remove old turnstile widget:', err);
      }
      widgetIdRef.current = null;
    }

    try {
      const widgetId = window.turnstile.render(`#${containerId}`, {
        sitekey: siteKey,
        callback: (token: string) => onVerifyRef.current(token),
        'expired-callback': () => {
          onExpireRef.current?.();
        },
        'error-callback': () => {
          onErrorRef.current?.();
        },
        theme: 'auto',
      });
      widgetIdRef.current = widgetId;
    } catch (err) {
      console.error('Error rendering Turnstile widget:', err);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (err) {
          console.warn('Failed to remove turnstile widget during cleanup:', err);
        }
        widgetIdRef.current = null;
      }
    };
  }, [containerId, scriptReady, siteKey]);

  // Reset turnstile when resetSignal from parent changes
  useEffect(() => {
    if (!widgetIdRef.current || !window.turnstile) {
      return;
    }
    try {
      window.turnstile.reset(widgetIdRef.current);
    } catch (err) {
      console.warn('Failed to reset turnstile:', err);
    }
  }, [resetSignal]);

  const handleManualReset = () => {
    // 1. Clear verification token in parent
    onExpireRef.current?.();

    // 2. If Turnstile script didn't load or was blocked, try to inject it manually
    if (typeof window !== 'undefined' && !window.turnstile) {
      console.log('Turnstile script missing, force injecting script tag...');
      const scriptId = 'cloudflare-turnstile-script-manual';
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setScriptReady(true);
        // Force remount once script finishes loading
        setRemountKey(prev => prev + 1);
      };
      script.onerror = () => {
        console.error('Failed to load Turnstile script manually.');
      };
      document.body.appendChild(script);
      return;
    }

    // 3. Force re-mount of the Turnstile widget by incrementing the remountKey
    setRemountKey(prev => prev + 1);
  };

  return (
    <div className="space-y-1.5">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div key={remountKey} id={containerId} className="min-h-16" />
      
      <div className="flex justify-start">
        <button
          type="button"
          onClick={handleManualReset}
          className="text-[10px] text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary flex items-center gap-1 transition-colors py-0.5 focus:outline-none font-medium"
        >
          <RefreshCw className="h-3 w-3 animate-hover-spin" />
          <span>Gagal memuat verifikasi? Klik untuk muat ulang</span>
        </button>
      </div>
    </div>
  );
}
