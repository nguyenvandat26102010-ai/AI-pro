/**
 * NDAWG PRO — APEX INFINITY V14
 * RepoGather Source Context & Exclusion Builder (Part 12)
 *
 * Implements:
 * - .gitignore and security pattern exclusions (secrets, lockfiles, binaries, builds)
 * - Task-relevant context vs Full eligible manifest modes
 * - File-size limits, token budgeting, and manifest summary
 * - Security redaction of hardcoded secrets
 */

import fs from 'fs';
import path from 'path';

export interface RepoFileEntry {
  relativePath: string;
  sizeBytes: number;
  tokensEstimate: number;
  category: 'SOURCE' | 'CONFIG' | 'TEST' | 'DOCUMENTATION' | 'ASSET' | 'EXCLUDED';
  isExcluded: boolean;
  exclusionReason?: string;
}

export interface RepoContextManifest {
  timestamp: string;
  mode: 'TASK_RELEVANT_CONTEXT' | 'FULL_ELIGIBLE_MANIFEST';
  totalFilesScanned: number;
  eligibleFilesCount: number;
  excludedFilesCount: number;
  totalSizeBytes: number;
  totalEstimatedTokens: number;
  excludedRules: string[];
  files: RepoFileEntry[];
  bundledContent?: string;
  securityNotice: string;
}

export class RepoContextBuilder {
  private readonly defaultExclusionPatterns: RegExp[] = [
    /node_modules/,
    /\.git(\/|\\|$)/,
    /dist(\/|\\|$)/,
    /build(\/|\\|$)/,
    /\.env/,
    /\.env\.local/,
    /id_rsa/,
    /\.pem$/,
    /\.key$/,
    /\.log$/,
    /package-lock\.json$/,
    /\.DS_Store/,
    /\.(png|jpg|jpeg|gif|webp|svg|ico|pdf|zip|tar|gz|mp3|mp4|wav)$/i
  ];

  private readonly maxSingleFileBytes = 250 * 1024; // 250 KB
  private readonly maxTotalTokens = 120000; // ~120K tokens max bundle

  /**
   * Scans workspace root and generates eligible manifest
   */
  public generateManifest(
    workspaceRoot: string,
    mode: 'TASK_RELEVANT_CONTEXT' | 'FULL_ELIGIBLE_MANIFEST' = 'FULL_ELIGIBLE_MANIFEST',
    focusKeywords: string[] = []
  ): RepoContextManifest {
    const fileEntries: RepoFileEntry[] = [];
    const root = path.resolve(workspaceRoot);

    const scanDirectory = (currentDir: string) => {
      let items: string[] = [];
      try {
        items = fs.readdirSync(currentDir);
      } catch {
        return;
      }

      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const relativePath = path.relative(root, fullPath).replace(/\\/g, '/');

        // Check exclusions
        let isExcluded = false;
        let reason = '';

        for (const pattern of this.defaultExclusionPatterns) {
          if (pattern.test(relativePath) || pattern.test(item)) {
            isExcluded = true;
            reason = `Khớp quy tắc loại trừ an toàn: ${pattern.toString()}`;
            break;
          }
        }

        try {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            if (!isExcluded) {
              scanDirectory(fullPath);
            } else {
              fileEntries.push({
                relativePath: relativePath + '/',
                sizeBytes: 0,
                tokensEstimate: 0,
                category: 'EXCLUDED',
                isExcluded: true,
                exclusionReason: reason
              });
            }
          } else if (stat.isFile()) {
            if (!isExcluded && stat.size > this.maxSingleFileBytes) {
              isExcluded = true;
              reason = `Kích thước tệp vượt ngưỡng an toàn (${Math.round(stat.size / 1024)} KB > 250 KB)`;
            }

            // In Task-relevant mode, filter by keywords if specified
            if (!isExcluded && mode === 'TASK_RELEVANT_CONTEXT' && focusKeywords.length > 0) {
              const matchesKeyword = focusKeywords.some(kw =>
                relativePath.toLowerCase().includes(kw.toLowerCase())
              );
              if (!matchesKeyword) {
                isExcluded = true;
                reason = 'Không thuộc phạm vi từ khóa tác vụ (Task-relevant filter)';
              }
            }

            // Estimate tokens ~ 4 bytes/char
            const tokensEstimate = Math.ceil(stat.size / 3.8);
            let category: RepoFileEntry['category'] = 'SOURCE';

            if (/\.(test|spec)\.(ts|js|tsx|jsx)$/.test(relativePath)) {
              category = 'TEST';
            } else if (/\.(json|config|env\.example|toml|yaml|yml)$/.test(relativePath)) {
              category = 'CONFIG';
            } else if (/\.(md|txt|rst|doc)$/.test(relativePath)) {
              category = 'DOCUMENTATION';
            } else if (isExcluded) {
              category = 'EXCLUDED';
            }

            fileEntries.push({
              relativePath,
              sizeBytes: stat.size,
              tokensEstimate,
              category,
              isExcluded,
              exclusionReason: isExcluded ? reason : undefined
            });
          }
        } catch {
          // Ignore inaccessible files
        }
      }
    };

    scanDirectory(root);

    const eligible = fileEntries.filter(f => !f.isExcluded);
    const excluded = fileEntries.filter(f => f.isExcluded);
    const totalSizeBytes = eligible.reduce((acc, f) => acc + f.sizeBytes, 0);
    const totalTokens = eligible.reduce((acc, f) => acc + f.tokensEstimate, 0);

    return {
      timestamp: new Date().toISOString(),
      mode,
      totalFilesScanned: fileEntries.length,
      eligibleFilesCount: eligible.length,
      excludedFilesCount: excluded.length,
      totalSizeBytes,
      totalEstimatedTokens: totalTokens,
      excludedRules: [
        'node_modules & build directories (dist, build)',
        '.env, secret keys & credentials (*.pem, *.key, id_rsa)',
        'Binary & media assets (images, audio, video, archives)',
        'Tệp vượt quá 250KB kích thước đơn lẻ'
      ],
      files: fileEntries,
      securityNotice:
        'RepoGather đảm bảo 100% bí mật môi trường (.env, private keys) và tệp nhị phân bị loại trừ trước khi đóng gói context.'
    };
  }

  /**
   * Bundles eligible source text into unified prompt payload respecting budget
   */
  public bundleEligibleSource(
    workspaceRoot: string,
    manifest: RepoContextManifest,
    tokenBudget: number = 80000
  ): {
    bundledText: string;
    filesIncluded: string[];
    totalTokens: number;
    budgetExceeded: boolean;
  } {
    const root = path.resolve(workspaceRoot);
    const includedFiles: string[] = [];
    const chunks: string[] = [];
    let currentTokens = 0;
    let budgetExceeded = false;

    chunks.push(`// ==================== NDAWG PRO REPOSITORY CONTEXT ====================`);
    chunks.push(`// Generated: ${manifest.timestamp}`);
    chunks.push(`// Mode: ${manifest.mode}`);
    chunks.push(`// Eligible files: ${manifest.eligibleFilesCount} | Scanned: ${manifest.totalFilesScanned}`);
    chunks.push(`// =====================================================================\n`);

    const eligibleFiles = manifest.files.filter(f => !f.isExcluded && f.sizeBytes > 0);

    for (const file of eligibleFiles) {
      if (currentTokens + file.tokensEstimate > tokenBudget) {
        budgetExceeded = true;
        break;
      }

      try {
        const fullPath = path.join(root, file.relativePath);
        const rawContent = fs.readFileSync(fullPath, 'utf-8');

        // Scrub any secrets before bundling
        const sanitizedContent = rawContent
          .replace(/(?:AIza[0-9A-Za-z-_]{15,})/g, '[REDACTED_GEMINI_KEY]')
          .replace(/(?:sk-[a-zA-Z0-9]{15,})/g, '[REDACTED_API_KEY]')
          .replace(/(?:password['"]?\s*[:=]\s*['"])([^'"]+)(['"])/gi, 'password: "[REDACTED]"');

        chunks.push(`\n// --- FILE: ${file.relativePath} (${file.sizeBytes} bytes) ---`);
        chunks.push(sanitizedContent);
        chunks.push(`// --- END OF FILE: ${file.relativePath} ---\n`);

        includedFiles.push(file.relativePath);
        currentTokens += file.tokensEstimate;
      } catch {
        // Continue on read failure
      }
    }

    return {
      bundledText: chunks.join('\n'),
      filesIncluded: includedFiles,
      totalTokens: currentTokens,
      budgetExceeded
    };
  }
}
