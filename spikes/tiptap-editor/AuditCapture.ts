/**
 * AuditCapture.ts — Diff capture utility for the Tiptap editor spike.
 *
 * Provides a text-diff algorithm that produces structured ChangeRecord[]
 * suitable for an HR audit trail. Uses a simple longest-common-subsequence
 * (LCS) approach to identify insertions and deletions at the word level.
 */

export interface ChangeRecord {
  /** "insert" | "delete" */
  type: "insert" | "delete";
  /** Character offset in the *original* text (delete) or *current* text (insert) */
  position: number;
  /** The text that was inserted or deleted */
  text: string;
  /** Who made the change */
  author: string;
  /** ISO-8601 timestamp */
  timestamp: string;
  /** For deletes: the surrounding context (up to 40 chars on each side) */
  contextBefore?: string;
  contextAfter?: string;
}

/**
 * Token-level diff using a simple LCS algorithm.
 * Returns an array of ChangeRecords representing the diff from `original` to `current`.
 */
export function captureDiff(
  original: string,
  current: string,
  author: string = "HR Agent"
): ChangeRecord[] {
  const originalTokens = tokenize(original);
  const currentTokens = tokenize(current);

  const lcs = computeLCS(originalTokens, currentTokens);

  const changes: ChangeRecord[] = [];

  let origIdx = 0;
  let currIdx = 0;
  let lcsIdx = 0;

  // Track character positions in original and current
  let origPos = 0;
  let currPos = 0;

  const origPositions = computeTokenPositions(originalTokens);
  const currPositions = computeTokenPositions(currentTokens);

  while (lcsIdx < lcs.length || origIdx < originalTokens.length || currIdx < currentTokens.length) {
    const lcsToken = lcsIdx < lcs.length ? lcs[lcsIdx] : null;
    const origToken = origIdx < originalTokens.length ? originalTokens[origIdx] : null;
    const currToken = currIdx < currentTokens.length ? currentTokens[currIdx] : null;

    // Skip matching tokens (part of LCS)
    if (origToken && currToken && lcsToken && origToken === lcsToken && currToken === lcsToken) {
      origIdx++;
      currIdx++;
      lcsIdx++;
      continue;
    }

    // Deletions: tokens in original but not in LCS at this point
    if (origToken && (lcsToken === null || origToken !== lcsToken)) {
      // Collect consecutive deletions
      const deletedTokens: string[] = [];
      const deleteStartPos = origPositions[origIdx];

      while (origIdx < originalTokens.length && (lcsIdx >= lcs.length || originalTokens[origIdx] !== lcs[lcsIdx])) {
        deletedTokens.push(originalTokens[origIdx]);
        origIdx++;
      }

      const deletedText = deletedTokens.join("");
      const contextStart = Math.max(0, deleteStartPos - 40);
      const contextEnd = Math.min(original.length, deleteStartPos + deletedText.length + 40);

      changes.push({
        type: "delete",
        position: deleteStartPos,
        text: deletedText,
        author,
        timestamp: new Date().toISOString(),
        contextBefore: original.slice(contextStart, deleteStartPos),
        contextAfter: original.slice(deleteStartPos + deletedText.length, contextEnd),
      });
    }

    // Insertions: tokens in current but not in LCS at this point
    if (currToken && (lcsToken === null || currToken !== lcsToken)) {
      const insertedTokens: string[] = [];
      const insertStartPos = currPositions[currIdx];

      while (currIdx < currentTokens.length && (lcsIdx >= lcs.length || currentTokens[currIdx] !== lcs[lcsIdx])) {
        insertedTokens.push(currentTokens[currIdx]);
        currIdx++;
      }

      const insertedText = insertedTokens.join("");

      changes.push({
        type: "insert",
        position: insertStartPos,
        text: insertedText,
        author,
        timestamp: new Date().toISOString(),
      });
    }

    // Safety: prevent infinite loop
    if (
      origToken === null &&
      currToken === null &&
      lcsToken === null
    ) {
      break;
    }
  }

  return changes;
}

/**
 * Tokenize text into words and whitespace tokens, preserving structure.
 */
function tokenize(text: string): string[] {
  const tokens: string[] = [];
  const regex = /\S+|\s+/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    tokens.push(match[0]);
  }
  return tokens;
}

/**
 * Compute starting character positions for each token.
 */
function computeTokenPositions(tokens: string[]): number[] {
  const positions: number[] = [];
  let pos = 0;
  for (const token of tokens) {
    positions.push(pos);
    pos += token.length;
  }
  return positions;
}

/**
 * Simple LCS (Longest Common Subsequence) for token arrays.
 * Returns the LCS as a string array.
 */
function computeLCS(a: string[], b: string[]): string[] {
  const m = a.length;
  const n = b.length;

  // Build DP table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find LCS
  const result: string[] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      result.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return result;
}

/**
 * Convert ChangeRecord[] to a JSON string suitable for audit trail storage.
 */
export function changesToAuditJson(changes: ChangeRecord[]): string {
  return JSON.stringify(
    {
      version: 1,
      capturedAt: new Date().toISOString(),
      totalChanges: changes.length,
      insertions: changes.filter((c) => c.type === "insert").length,
      deletions: changes.filter((c) => c.type === "delete").length,
      changes: changes.map((c) => ({
        ...c,
        // Ensure consistent ordering for audit
        type: c.type,
        position: c.position,
        text: c.text,
        author: c.author,
        timestamp: c.timestamp,
      })),
    },
    null,
    2
  );
}
