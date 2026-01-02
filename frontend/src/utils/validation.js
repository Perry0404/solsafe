// Security validation utilities for SolSafe

import { PublicKey } from '@solana/web3.js';

/**
 * Validate case ID
 * @param {number|string} caseId - Case ID to validate
 * @returns {number} Validated case ID
 * @throws {Error} If invalid
 */
export function validateCaseId(caseId) {
  const id = typeof caseId === 'string' ? parseInt(caseId, 10) : caseId;
  
  if (isNaN(id)) {
    throw new Error('Case ID must be a number');
  }
  
  if (id < 1) {
    throw new Error('Case ID must be greater than 0');
  }
  
  if (id > Number.MAX_SAFE_INTEGER) {
    throw new Error('Case ID exceeds maximum safe integer');
  }
  
  return id;
}

/**
 * Validate Solana public key address
 * @param {string} address - Solana address to validate
 * @returns {PublicKey} Validated PublicKey object
 * @throws {Error} If invalid
 */
export function validateSolanaAddress(address) {
  if (!address || typeof address !== 'string') {
    throw new Error('Address must be a non-empty string');
  }
  
  try {
    const pubkey = new PublicKey(address);
    
    // Check if it's a valid base58 string (44 chars for Solana addresses)
    if (address.length !== 44 && address.length !== 43) {
      throw new Error('Invalid address length');
    }
    
    return pubkey;
  } catch (error) {
    throw new Error('Invalid Solana address format: ' + error.message);
  }
}

/**
 * Validate evidence URL or hash
 * @param {string} evidence - Evidence URL or hash to validate
 * @param {number} maxLength - Maximum allowed length (default 500)
 * @returns {string} Validated evidence string
 * @throws {Error} If invalid
 */
export function validateEvidence(evidence, maxLength = 500) {
  if (!evidence || typeof evidence !== 'string') {
    throw new Error('Evidence must be a non-empty string');
  }
  
  if (evidence.trim().length === 0) {
    throw new Error('Evidence cannot be empty');
  }
  
  if (evidence.length > maxLength) {
    throw new Error(`Evidence exceeds maximum length of ${maxLength} characters`);
  }
  
  // Basic URL validation for non-ZK evidence
  if (!evidence.startsWith('zkproof:')) {
    try {
      new URL(evidence);
    } catch {
      throw new Error('Evidence must be a valid URL or ZK proof hash');
    }
  }
  
  return evidence;
}

/**
 * Sanitize string input to prevent XSS
 * @param {string} input - String to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return String(input);
  }
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate vote commitment data from localStorage
 * @param {Object} commitment - Commitment object to validate
 * @returns {boolean} True if valid
 */
export function validateVoteCommitment(commitment) {
  if (!commitment || typeof commitment !== 'object') {
    return false;
  }
  
  const required = ['commitment', 'nullifier', 'salt', 'vote', 'caseId'];
  for (const field of required) {
    if (!(field in commitment)) {
      return false;
    }
  }
  
  // Check array lengths
  if (!Array.isArray(commitment.commitment) || commitment.commitment.length !== 32) {
    return false;
  }
  
  if (!Array.isArray(commitment.nullifier) || commitment.nullifier.length !== 32) {
    return false;
  }
  
  if (!Array.isArray(commitment.salt) || commitment.salt.length !== 32) {
    return false;
  }
  
  if (typeof commitment.vote !== 'boolean') {
    return false;
  }
  
  if (typeof commitment.caseId !== 'number' || commitment.caseId < 1) {
    return false;
  }
  
  return true;
}

/**
 * Rate limiting check for user actions
 * @param {string} action - Action name (e.g., 'submitCase', 'vote')
 * @param {number} cooldownMs - Cooldown period in milliseconds (default 10000)
 * @returns {boolean} True if action is allowed
 */
export function checkRateLimit(action, cooldownMs = 10000) {
  const key = `solsafe_ratelimit_${action}`;
  const lastAction = localStorage.getItem(key);
  
  if (!lastAction) {
    localStorage.setItem(key, Date.now().toString());
    return true;
  }
  
  const elapsed = Date.now() - parseInt(lastAction, 10);
  
  if (elapsed < cooldownMs) {
    const remainingSeconds = Math.ceil((cooldownMs - elapsed) / 1000);
    throw new Error(`Please wait ${remainingSeconds} seconds before ${action} again`);
  }
  
  localStorage.setItem(key, Date.now().toString());
  return true;
}

/**
 * Validate ZK proof hash format
 * @param {string} hash - Hash string to validate
 * @returns {boolean} True if valid
 */
export function validateZkProofHash(hash) {
  if (!hash || typeof hash !== 'string') {
    return false;
  }
  
  // Check zkproof: prefix
  if (!hash.startsWith('zkproof:')) {
    return false;
  }
  
  // Extract hex part
  const hexPart = hash.slice(8);
  
  // SHA-256 produces 64 hex characters
  if (hexPart.length !== 64) {
    return false;
  }
  
  // Check if valid hex
  return /^[0-9a-f]{64}$/i.test(hexPart);
}

/**
 * Secure localStorage operations with integrity check
 */
export const SecureStorage = {
  /**
   * Save data to localStorage with integrity check
   * @param {string} key - Storage key
   * @param {any} data - Data to store
   */
  save(key, data) {
    const serialized = JSON.stringify(data);
    const timestamp = Date.now();
    const checksum = this._generateChecksum(serialized);
    
    const envelope = {
      data: serialized,
      timestamp,
      checksum,
    };
    
    localStorage.setItem(key, JSON.stringify(envelope));
  },
  
  /**
   * Load data from localStorage with integrity check
   * @param {string} key - Storage key
   * @returns {any|null} Parsed data or null if invalid
   */
  load(key) {
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return null;
    }
    
    try {
      const envelope = JSON.parse(stored);
      
      // Verify structure
      if (!envelope.data || !envelope.checksum) {
        console.warn('Invalid storage envelope');
        return null;
      }
      
      // Verify integrity
      const computedChecksum = this._generateChecksum(envelope.data);
      if (computedChecksum !== envelope.checksum) {
        console.error('Storage integrity check failed - data may be tampered');
        localStorage.removeItem(key);
        return null;
      }
      
      return JSON.parse(envelope.data);
    } catch (error) {
      console.error('Failed to load secure storage:', error);
      return null;
    }
  },
  
  /**
   * Generate simple checksum for data
   * @private
   */
  _generateChecksum(data) {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  },
};

export default {
  validateCaseId,
  validateSolanaAddress,
  validateEvidence,
  sanitizeInput,
  validateVoteCommitment,
  checkRateLimit,
  validateZkProofHash,
  SecureStorage,
};
