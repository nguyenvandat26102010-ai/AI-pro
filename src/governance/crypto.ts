/**
 * NDAWG PRO — Cryptographic and Redaction Utilities
 * Provides deterministic SHA-256, hash-chain tamper detection, and sensitive data redaction.
 */

import { AuditLogEntry } from './types.ts';

// Deterministic pure TypeScript SHA-256 implementation (works seamlessly in Node.js test runner & browser DOM)
export function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i = 0;
  let j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let compositeClearHex = '';
  for (; i < asciiBitLength; i += 8) {
    compositeClearHex += String.fromCharCode(ascii.charCodeAt(i / 8) & 0xff);
  }

  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return ''; // ASCII only
    words[i >> 2] |= j << ((3 - (i % 4)) * 8);
  }

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  const w: number[] = new Array(64);

  for (i = 0; i < words.length; i += 16) {
    const w16 = words.slice(i, i + 16);
    let a = hash[0];
    let b = hash[1];
    let c = hash[2];
    let d = hash[3];
    let e = hash[4];
    let f = hash[5];
    let g = hash[6];
    let h = hash[7];

    for (j = 0; j < 64; j++) {
      if (j < 16) {
        w[j] = w16[j] || 0;
      } else {
        const gamma0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const gamma1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = ((w[j - 16] + gamma0 + w[j - 7] + gamma1) | 0);
      }

      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + k[j] + w[j]) | 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (8 * j)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }

  return result;
}

/**
 * Anonymizes user identifiers to protect privacy in audit logs.
 */
export function hashActorId(rawActorId: string): string {
  const salt = 'NDAWG_PRO_PRIVACY_SALT_APEX';
  const full = sha256(`${salt}:${rawActorId}`);
  return `usr_${full.slice(0, 12)}`;
}

/**
 * Redaction patterns to catch API keys, passwords, bearer tokens, secrets.
 * Ensures zero secrets are logged or leaked in UI / outputs.
 */
export function redactSecrets(input: string): string {
  if (!input || typeof input !== 'string') return input;
  let redacted = input;

  // Mask Google / Gemini API keys (AIza...)
  redacted = redacted.replace(/AIza[0-9A-Za-z-_]{20,}/g, '[REDACTED_API_KEY]');

  // Mask OpenAI API keys (sk-...)
  redacted = redacted.replace(/sk-[a-zA-Z0-9_\-]{20,}/g, '[REDACTED_API_KEY]');

  // Mask Anthropic keys (sk-ant-...)
  redacted = redacted.replace(/sk-ant-[a-zA-Z0-9_\-]{15,}/g, '[REDACTED_API_KEY]');

  // Mask Bearer tokens
  redacted = redacted.replace(/(Bearer\s+)[A-Za-z0-9_\-\.]{16,}/gi, '$1[REDACTED_BEARER_TOKEN]');

  // Mask AWS access keys
  redacted = redacted.replace(/AKIA[0-9A-Z]{16}/g, '[REDACTED_AWS_KEY]');

  // Mask password, secret, token fields in JSON or strings
  redacted = redacted.replace(/("(?:password|api[_-]?key|secret|token)"\s*:\s*)"[^"]+"/gi, '$1"[REDACTED_SECRET]"');

  return redacted;
}

/**
 * Computes deterministic entry hash using parent hash and entry metadata
 */
export function computeAuditEntryHash(
  prevHash: string,
  entry: Omit<AuditLogEntry, 'hash'>
): string {
  const payload = [
    prevHash,
    entry.id,
    entry.timestamp,
    entry.requestId,
    entry.actorHash,
    entry.target,
    entry.actionTier || 'N/A',
    entry.decision,
    entry.reason || '',
    entry.durationMs.toString(),
    entry.estimatedCostUsd.toFixed(6),
    entry.policyVersion
  ].join('|');

  return sha256(payload);
}

/**
 * Verifies the mathematical integrity of the Audit Log hash chain.
 * Detects if any record was inserted, modified, or omitted.
 */
export function verifyAuditChainIntegrity(entries: AuditLogEntry[]): {
  valid: boolean;
  tamperedIndex?: number;
  expectedHash?: string;
  actualHash?: string;
  reason?: string;
} {
  if (!entries || entries.length === 0) {
    return { valid: true };
  }

  const GENESIS_PREV_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

  for (let i = 0; i < entries.length; i++) {
    const current = entries[i];
    const expectedPrev = i === 0 ? GENESIS_PREV_HASH : entries[i - 1].hash;

    if (current.prevHash !== expectedPrev) {
      return {
        valid: false,
        tamperedIndex: i,
        expectedHash: expectedPrev,
        actualHash: current.prevHash,
        reason: `Broken chain link at index ${i}: prevHash mismatch.`
      };
    }

    const calculatedHash = computeAuditEntryHash(current.prevHash, current);
    if (calculatedHash !== current.hash) {
      return {
        valid: false,
        tamperedIndex: i,
        expectedHash: calculatedHash,
        actualHash: current.hash,
        reason: `Cryptographic payload checksum mismatch at index ${i}. Entry was modified after creation.`
      };
    }
  }

  return { valid: true };
}
