'use client';

import Script from 'next/script';
import { useEffect, useMemo, useRef, useState } from 'react';

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
  const [scriptReady, setScriptReady] = useState(false);
  const widgetIdRef = useRef<string | null>(null);
  const containerId = useMemo(() => `turnstile-${Math.random().toString(36).slice(2, 11)}`, []);

  useEffect(() => {
    if (!scriptReady || !siteKey || !window.turnstile) {
      return;
    }

    if (widgetIdRef.current) {
      window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    }

    const widgetId = window.turnstile.render(`#${containerId}`, {
      sitekey: siteKey,
      callback: (token: string) => onVerify(token),
      'expired-callback': () => {
        onExpire?.();
      },
      'error-callback': () => {
        onError?.();
      },
      theme: 'auto',
    });

    widgetIdRef.current = widgetId;

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [containerId, onError, onExpire, onVerify, scriptReady, siteKey]);

  useEffect(() => {
    if (!widgetIdRef.current || !window.turnstile) {
      return;
    }
    window.turnstile.reset(widgetIdRef.current);
  }, [resetSignal]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div id={containerId} className="min-h-16" />
    </>
  );
}
