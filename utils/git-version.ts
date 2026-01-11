/**
 * Git commit hash utility
 * Reads the commit hash from a file generated during git pre-commit hook
 */

let cachedCommitHash: string | null = null;

/**
 * Get the current git commit hash
 * Falls back to 'dev' if not available
 */
export function getGitCommitHash(): string {
  if (cachedCommitHash !== null) {
    return cachedCommitHash;
  }

  try {
    // The pre-commit hook will generate a file that exports the hash
    // Using require for React Native compatibility
    const gitInfo = require('@/constants/git-info.json') as { commitHash?: string };
    cachedCommitHash = gitInfo.commitHash || 'dev';
  } catch (error) {
    // Fallback if file doesn't exist
    cachedCommitHash = 'dev';
  }

  return cachedCommitHash;
}

