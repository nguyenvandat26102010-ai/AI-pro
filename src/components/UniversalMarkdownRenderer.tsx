/**
 * NDAWG PRO — APEX INFINITY V18
 * Universal Markdown & Math Renderer Component (Directives P1 & 8)
 *
 * Renders verified Markdown, Tables, Syntax-highlighted Code Blocks with Copy,
 * Math Display, Blockquotes, and Sanitized External Links.
 * Replaces plain whitespace-pre-wrap to eliminate raw syntax slop.
 */

import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Code2, Terminal } from 'lucide-react';
import { tokenizeMarkdownBlocks, sanitizeLinkUrl, RenderToken } from '../core/renderIntegrity.ts';

interface UniversalMarkdownRendererProps {
  content: string;
  className?: string;
}

export const UniversalMarkdownRenderer: React.FC<UniversalMarkdownRendererProps> = ({
  content,
  className = ''
}) => {
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);

  if (!content) return null;

  const tokens = tokenizeMarkdownBlocks(content);

  const handleCopyCode = (idx: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIdx(idx);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  /**
   * Helper to parse inline formatting: bold, italic, inline code, inline math, links
   */
  const renderInline = (text: string): React.ReactNode[] => {
    if (!text) return [];

    // Split text into tokens for inline elements
    // Patterns:
    // 1. Markdown Links: [label](url)
    // 2. Inline Code: `code`
    // 3. Bold: **text** or __text__
    // 4. Inline Math: \( ... \) or $...$ (not currency $50)
    // 5. Italic: *text* or _text_

    const regex = /(\[[^\]]+\]\([^\s)]+\)|`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\\\([^\\]+\\\)|\$(?!\d+\b)[^$\n]+\$|\*[^*]+\*|_[^_]+_)/g;
    const parts = text.split(regex);

    return parts.map((part, i) => {
      if (!part) return null;

      // Link: [label](url)
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^\s)]+)\)$/);
      if (linkMatch) {
        const label = linkMatch[1];
        const rawUrl = linkMatch[2];
        const safeUrl = sanitizeLinkUrl(rawUrl);
        return (
          <a
            key={i}
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors font-medium cursor-pointer"
          >
            <span>{label}</span>
            <ExternalLink className="w-3 h-3 inline-block shrink-0 opacity-70" />
          </a>
        );
      }

      // Inline Code: `code`
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-900 border border-slate-800 text-cyan-300 font-mono text-[12px] selection:bg-cyan-900"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      // Bold: **text** or __text__
      if (
        (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
        (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
      ) {
        return (
          <strong key={i} className="font-semibold text-slate-100">
            {part.slice(2, -2)}
          </strong>
        );
      }

      // Inline Math: \( ... \) or $...$ (exclude standalone currency $10)
      if (
        (part.startsWith('\\(') && part.endsWith('\\)') && part.length > 4) ||
        (part.startsWith('$') && part.endsWith('$') && part.length > 2 && !/^\$\d+(?:\.\d+)?$/.test(part))
      ) {
        const formula = part.startsWith('\\(') ? part.slice(2, -2) : part.slice(1, -1);
        return (
          <span
            key={i}
            className="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-900 border border-emerald-500/30 text-emerald-300 font-mono text-[12px] italic inline-block"
            title="Biểu thức toán học LaTeX"
          >
            {formula}
          </span>
        );
      }

      // Italic: *text* or _text_
      if (
        (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
        (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
      ) {
        return (
          <em key={i} className="italic text-slate-200">
            {part.slice(1, -1)}
          </em>
        );
      }

      // Plain text
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className={`space-y-3 font-sans leading-relaxed text-slate-200 text-sm select-text ${className}`}>
      {tokens.map((token, idx) => {
        switch (token.type) {
          case 'heading': {
            const level = token.level || 2;
            if (level === 1) {
              return (
                <h1 key={idx} className="text-xl sm:text-2xl font-bold text-white tracking-tight pt-2 pb-1 border-b border-slate-800">
                  {renderInline(token.content)}
                </h1>
              );
            }
            if (level === 2) {
              return (
                <h2 key={idx} className="text-lg sm:text-xl font-bold text-slate-100 tracking-tight pt-2 pb-0.5 border-b border-slate-800/60">
                  {renderInline(token.content)}
                </h2>
              );
            }
            if (level === 3) {
              return (
                <h3 key={idx} className="text-base font-semibold text-cyan-300 pt-1">
                  {renderInline(token.content)}
                </h3>
              );
            }
            return (
              <h4 key={idx} className="text-sm font-semibold text-slate-200 uppercase tracking-wider pt-1">
                {renderInline(token.content)}
              </h4>
            );
          }

          case 'code_block': {
            const lang = token.language || 'code';
            const code = token.content;
            const isCopied = copiedCodeIdx === idx;
            return (
              <div key={idx} className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 my-2 shadow-lg">
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="uppercase text-[11px] font-semibold text-slate-300">{lang}</span>
                  </div>
                  <button
                    onClick={() => handleCopyCode(idx, code)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer text-[11px]"
                    title="Sao chép mã nguồn"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3 overflow-x-auto text-xs font-mono leading-relaxed text-slate-200">
                  <pre className="m-0 font-mono">
                    <code>{code}</code>
                  </pre>
                </div>
              </div>
            );
          }

          case 'table': {
            const headers = token.headers || [];
            const rows = token.rows || [];
            return (
              <div key={idx} className="overflow-x-auto my-3 rounded-xl border border-slate-800 shadow-md">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-200 font-semibold font-mono">
                      {headers.map((h, hIdx) => (
                        <th key={hIdx} className="px-3 py-2 text-cyan-300">
                          {renderInline(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className={rIdx % 2 === 0 ? 'bg-slate-950 hover:bg-slate-900/50' : 'bg-slate-900/30 hover:bg-slate-900/60'}
                      >
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3 py-2 text-slate-300">
                            {renderInline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          case 'blockquote': {
            return (
              <blockquote
                key={idx}
                className="border-l-4 border-cyan-500/80 bg-slate-900/40 pl-3 py-1.5 my-2 rounded-r-lg text-slate-300 italic text-xs sm:text-sm font-sans"
              >
                {renderInline(token.content)}
              </blockquote>
            );
          }

          case 'hr': {
            return <hr key={idx} className="border-t border-slate-800 my-4" />;
          }

          case 'math_display': {
            return (
              <div
                key={idx}
                className="my-3 p-3 rounded-xl bg-slate-900/90 border border-emerald-500/40 text-center text-emerald-300 font-mono text-sm shadow-inner overflow-x-auto"
              >
                <div className="text-[10px] uppercase tracking-wider text-emerald-500/80 font-mono mb-1">
                  Biểu thức Toán học
                </div>
                <div className="text-base font-semibold">{token.content}</div>
              </div>
            );
          }

          case 'list_item': {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2 my-1 text-slate-200">
                {token.ordered ? (
                  <span className="font-mono text-cyan-400 font-semibold text-xs shrink-0 min-w-[1.2rem]">
                    {token.itemNumber}.
                  </span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
                )}
                <div className="flex-1">{renderInline(token.content)}</div>
              </div>
            );
          }

          case 'text':
          default: {
            if (!token.content) {
              return <div key={idx} className="h-1.5" />;
            }
            return (
              <p key={idx} className="leading-relaxed">
                {renderInline(token.content)}
              </p>
            );
          }
        }
      })}
    </div>
  );
};
