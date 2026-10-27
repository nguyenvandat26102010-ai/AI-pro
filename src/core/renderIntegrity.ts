/**
 * NDAWG PRO — APEX INFINITY V18
 * Universal Render Integrity Engine (Directives P1 & 8)
 *
 * Implements the full render integrity pipeline:
 * RAW RESPONSE -> STREAM ASSEMBLY -> CONTENT CLASSIFICATION -> SAFE NORMALIZATION -> PARSING -> FINAL DISPLAY
 *
 * Handles:
 * - Accidental entity decoding (&#x20;, &amp;, &lt;, &gt;)
 * - Redundant backslashes before Markdown characters (\*\*bold\*\*, \_italic\_, \#)
 * - Nested malformed Markdown links [label]([label](url))
 * - Safe URL scheme enforcement (blocks javascript:, permits https:, http:, mailto:)
 * - LaTeX math preservation (\(..\), \[..\], $..$, $$..$$) without false-triggering on currency ($50)
 * - Safe streaming completion for unclosed code fences
 * - Raw provider JSON detection & readable translation
 * - Full UTF-8 Unicode integrity for Vietnamese, Korean, and STEM notation
 */

export interface RenderToken {
  type: 'text' | 'heading' | 'code_block' | 'table' | 'blockquote' | 'hr' | 'math_display' | 'list_item';
  content: string;
  level?: number;
  language?: string;
  headers?: string[];
  rows?: string[][];
  ordered?: boolean;
  itemNumber?: number;
}

/**
 * Validates and sanitizes link URLs to prevent XSS (blocks javascript:, vbscript:, data:text/html)
 */
export function sanitizeLinkUrl(url: string): string {
  if (!url || typeof url !== 'string') return '#';
  const trimmed = url.trim();

  // Strip accidental outer wrappers [text](url)
  const nestedMatch = trimmed.match(/\[.*?\]\((https?:\/\/[^\s)]+)\)/i);
  const cleanUrl = nestedMatch ? nestedMatch[1] : trimmed;

  const lower = cleanUrl.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('data:text/html') ||
    lower.startsWith('data:application/javascript')
  ) {
    return '#blocked-unsafe-link';
  }
  return cleanUrl;
}

/**
 * Repairs malformed nested Markdown links: e.g. [Google](https://google.com[Search](https://google.com/search))
 */
export function repairMarkdownLinks(text: string): string {
  if (!text) return '';
  // Pattern: [text](outerUrl[innerLabel](innerUrl))
  return text.replace(/\[([^\]]+)\]\(([^)]*?)\[([^\]]+)\]\((https?:\/\/[^)]+)\)\)/g, '[$3]($4)');
}

/**
 * Cleans spurious backslashes before bold, italic, headings and horizontal rules
 * while preserving fenced code blocks verbatim.
 */
export function cleanSpuriousMarkdownEscapes(text: string): string {
  if (!text) return '';

  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts
    .map((part, index) => {
      // If inside a code block, preserve verbatim
      if (index % 2 === 1) return part;

      let cleaned = part;
      // Strip backslash before asterisks and underscores: \* -> *, \_ -> _
      cleaned = cleaned.replace(/\\([*_])/g, '$1');
      // \--- or \___ -> --- or ___
      cleaned = cleaned.replace(/^\\(---|___|\*\*\*)$/gm, '$1');
      // \# Heading -> # Heading
      cleaned = cleaned.replace(/^\\(#{1,6}\s)/gm, '$1');
      // \- list -> - list
      cleaned = cleaned.replace(/^\\([*+-]\s)/gm, '$1');
      return cleaned;
    })
    .join('');
}

/**
 * Decodes safe HTML entities such as &#x20;, &nbsp;, &amp;, &lt;, &gt;
 * without touching fenced code blocks.
 */
export function decodeSafeHtmlEntities(text: string): string {
  if (!text) return '';

  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts
    .map((part, index) => {
      if (index % 2 === 1) return part;

      return part
        .replace(/&#x20;/g, ' ')
        .replace(/&#32;/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    })
    .join('');
}

/**
 * Standardizes LaTeX delimiters \(..\) -> $..$ and \[..\] -> $$..$$
 * without corrupting ordinary currency notation like $50.
 */
export function standardizeLatexDelimiters(text: string): string {
  if (!text) return '';

  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts
    .map((part, index) => {
      if (index % 2 === 1) return part;

      let standardized = part;
      // Convert display math \[ ... \] to $$ ... $$
      standardized = standardized.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');
      // Convert inline math \( ... \) to $ ... $
      standardized = standardized.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');
      return standardized;
    })
    .join('');
}

/**
 * Detects if the model response leaked raw JSON error dumps and formats it cleanly.
 */
export function sanitizeRawJsonErrorLeak(text: string): string {
  if (!text) return '';
  const trimmed = text.trim();

  if (trimmed.startsWith('{') && trimmed.endsWith('}') && /"error"\s*:/i.test(trimmed)) {
    try {
      const parsed = JSON.parse(trimmed);
      const err = parsed.error || parsed;
      const code = err.code || err.status || 'ERROR';
      const msg = err.message || JSON.stringify(err);
      return `⚠️ **[Lỗi từ nhà cung cấp: ${code}]**\n\n${msg}\n\n*Hệ thống đã nhận diện phản hồi lỗi JSON và hiển thị an toàn.*`;
    } catch {
      return text;
    }
  }

  return text;
}

/**
 * Normalizes render content through the complete integrity pipeline.
 */
export function normalizeRenderText(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';

  // 1. Check raw JSON error dump
  let content = sanitizeRawJsonErrorLeak(rawText);

  // 2. Decode safe HTML entities outside code blocks
  content = decodeSafeHtmlEntities(content);

  // 3. Clean spurious markdown escapes
  content = cleanSpuriousMarkdownEscapes(content);

  // 4. Standardize LaTeX delimiters
  content = standardizeLatexDelimiters(content);

  // 5. Repair nested malformed links
  content = repairMarkdownLinks(content);

  // 6. Ensure unclosed code fences are safely closed for streaming
  const fenceCount = (content.match(/^```/gm) || []).length;
  if (fenceCount % 2 !== 0) {
    content += '\n```';
  }

  return content;
}

/**
 * Alias for normalizeRenderText
 */
export const normalizeRenderContent = normalizeRenderText;

/**
 * Tokenizes markdown text into structured render blocks for Universal Markdown Display.
 */
export function tokenizeMarkdownBlocks(text: string): RenderToken[] {
  const normalized = normalizeRenderText(text);
  const tokens: RenderToken[] = [];
  const lines = normalized.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 1. Code Block Fence (```)
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      tokens.push({
        type: 'code_block',
        language: lang || 'text',
        content: codeLines.join('\n')
      });
      i++;
      continue;
    }

    // 2. Math Display ($$ ... $$)
    if (line.trim().startsWith('$$')) {
      if (line.trim().endsWith('$$') && line.trim().length > 2) {
        tokens.push({
          type: 'math_display',
          content: line.trim().slice(2, -2).trim()
        });
        i++;
        continue;
      }
      const mathLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().endsWith('$$')) {
        mathLines.push(lines[i]);
        i++;
      }
      tokens.push({
        type: 'math_display',
        content: mathLines.join('\n')
      });
      i++;
      continue;
    }

    // 3. Headings (# to ######)
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      tokens.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2]
      });
      i++;
      continue;
    }

    // 4. Horizontal Rule
    if (/^(---|___|\*\*\*)$/.test(line.trim())) {
      tokens.push({ type: 'hr', content: '---' });
      i++;
      continue;
    }

    // 5. Blockquotes
    if (line.trim().startsWith('>')) {
      const quoteLines: string[] = [line.trim().replace(/^>\s?/, '')];
      i++;
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      tokens.push({
        type: 'blockquote',
        content: quoteLines.join('\n')
      });
      continue;
    }

    // 6. Tables (| col1 | col2 |)
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const parseRow = (r: string) =>
          r
            .slice(1, -1)
            .split('|')
            .map(c => c.trim());
        const headers = parseRow(tableLines[0]);
        const dataRows = tableLines.slice(2).map(parseRow);
        tokens.push({
          type: 'table',
          content: tableLines.join('\n'),
          headers,
          rows: dataRows
        });
        continue;
      }
    }

    // 7. Regular text or empty line
    if (line.trim().length > 0) {
      tokens.push({
        type: 'text',
        content: line
      });
    }
    i++;
  }

  return tokens;
}
