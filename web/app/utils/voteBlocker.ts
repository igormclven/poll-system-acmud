/**
 * Vote Blocker Utility
 * 
 * Manages soft blocking of votes using localStorage.
 * Prevents repeated votes from the same device for 12 hours per poll+key combination.
 */

const STORAGE_KEY = 'voteBlocks';
const BLOCK_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

interface VoteBlock {
  timestamp: number;
  expiresAt: number;
}

interface VoteBlocks {
  [key: string]: VoteBlock;
}

/**
 * Gets all vote blocks from localStorage
 */
function getVoteBlocks(): VoteBlocks {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error reading vote blocks:', error);
    return {};
  }
}

/**
 * Saves vote blocks to localStorage
 */
function saveVoteBlocks(blocks: VoteBlocks): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
  } catch (error) {
    console.error('Error saving vote blocks:', error);
  }
}

/**
 * Generates a unique key for a poll+keyId combination
 */
function getBlockKey(pollId: string, keyId: string): string {
  return `${pollId}_${keyId}`;
}

/**
 * Removes expired blocks from storage
 */
export function clearExpiredBlocks(): void {
  const blocks = getVoteBlocks();
  const now = Date.now();
  let hasChanges = false;
  
  const filtered: VoteBlocks = {};
  
  for (const [key, block] of Object.entries(blocks)) {
    if (block.expiresAt > now) {
      filtered[key] = block;
    } else {
      hasChanges = true;
    }
  }
  
  if (hasChanges) {
    saveVoteBlocks(filtered);
  }
}

/**
 * Checks if a vote is blocked for the given poll+key combination
 * Also clears expired blocks as a side effect
 * 
 * @returns true if blocked, false if allowed to vote
 */
export function checkVoteBlock(pollId: string, keyId: string): boolean {
  if (!pollId || !keyId) return false;
  
  clearExpiredBlocks(); // Clean up expired blocks
  
  const blocks = getVoteBlocks();
  const blockKey = getBlockKey(pollId, keyId);
  const block = blocks[blockKey];
  
  if (!block) return false;
  
  const now = Date.now();
  return block.expiresAt > now;
}

/**
 * Registers a vote block for the given poll+key combination
 * This should be called after a successful vote
 */
export function setVoteBlock(pollId: string, keyId: string): void {
  if (!pollId || !keyId) return;
  
  const blocks = getVoteBlocks();
  const blockKey = getBlockKey(pollId, keyId);
  const now = Date.now();
  
  blocks[blockKey] = {
    timestamp: now,
    expiresAt: now + BLOCK_DURATION_MS,
  };
  
  saveVoteBlocks(blocks);
}

/**
 * Gets the remaining time until the block expires
 * 
 * @returns A human-readable string like "11 hours 30 minutes" or null if not blocked
 */
export function getRemainingTime(pollId: string, keyId: string): string | null {
  if (!pollId || !keyId) return null;
  
  const blocks = getVoteBlocks();
  const blockKey = getBlockKey(pollId, keyId);
  const block = blocks[blockKey];
  
  if (!block) return null;
  
  const now = Date.now();
  const remaining = block.expiresAt - now;
  
  if (remaining <= 0) return null;
  
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  
  if (hours > 0) {
    return `${hours} ${hours === 1 ? 'hora' : 'horas'}${minutes > 0 ? ` ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}` : ''}`;
  } else if (minutes > 0) {
    return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  } else {
    return 'menos de 1 minuto';
  }
}

/**
 * Manually clears a specific vote block (useful for testing/admin purposes)
 */
export function clearVoteBlock(pollId: string, keyId: string): void {
  if (!pollId || !keyId) return;
  
  const blocks = getVoteBlocks();
  const blockKey = getBlockKey(pollId, keyId);
  
  if (blocks[blockKey]) {
    delete blocks[blockKey];
    saveVoteBlocks(blocks);
  }
}

/**
 * Clears all vote blocks (useful for testing/admin purposes)
 */
export function clearAllVoteBlocks(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing all vote blocks:', error);
  }
}

