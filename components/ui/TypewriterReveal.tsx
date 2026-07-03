// components/ui/TypewriterReveal.tsx
'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TypewriterRevealProps {
  text: string;
  speed?: number; // characters per interval
}

export function TypewriterReveal({ text, speed = 25 }: TypewriterRevealProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setDisplayedText('');
    setIndex(0);
  }, [text]);

  useEffect(() => {
    if (index >= text.length) return;

    const timer = setTimeout(() => {
      const nextIndex = Math.min(index + speed, text.length);
      const slice = text.substring(0, nextIndex);
      
      // Auto-balancing Markdown tags
      let balancedSlice = slice;
      
      // Balance bold "**"
      const boldCount = (slice.match(/\*\*/g) || []).length;
      if (boldCount % 2 !== 0) {
        balancedSlice += '**';
      }

      // Balance backticks for code blocks "```"
      const codeBlockCount = (slice.match(/```/g) || []).length;
      if (codeBlockCount % 2 !== 0) {
        balancedSlice += '\n```';
      }

      // Balance single backticks "`"
      const inlineCodeCount = (slice.replace(/```/g, '').match(/`/g) || []).length;
      if (inlineCodeCount % 2 !== 0) {
        balancedSlice += '`';
      }

      setDisplayedText(balancedSlice);
      setIndex(nextIndex);
    }, 20);

    return () => clearTimeout(timer);
  }, [index, text, speed]);

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed transition-all duration-300">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {displayedText}
      </ReactMarkdown>
      {index < text.length && (
        <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-indigo-400 animate-pulse align-middle" />
      )}
    </div>
  );
}
