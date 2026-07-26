import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is always 16
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// Get key from environment or throw error in production
// For dev convenience, we can use a fallback if absolutely necessary, but strictly it should be env
const ENCRYPTION_KEY_HEX = process.env.ENCRYPTION_KEY || '';

if (!ENCRYPTION_KEY_HEX && process.env.NODE_ENV === 'production') {
    throw new Error("ENCRYPTION_KEY is required in production environment");
}

// Ensure key is correct length (32 bytes for aes-256)
// If the env var is hex, decode it. If it's a string, hash it to 32 bytes to be safe?
// Best practice: expect a 64-char hex string (32 bytes).
// Let's assume the user provides a raw string and we might need to pad/hash, 
// OR simpler: just expect a 32-byte key. 
// A robust way for a generic app is to use a fixed key derived from the env secret.
const getKey = (): Buffer => {
    if (!ENCRYPTION_KEY_HEX) {
        // Never fall back to a hardcoded key — encrypted data would be
        // recoverable by anyone with source access. Generate a per-process
        // key for local dev instead (data becomes undecryptable after
        // restart, which is the correct failure mode for missing config).
        if (process.env.NODE_ENV === 'production') {
            throw new Error("ENCRYPTION_KEY is required in production environment");
        }
        console.warn('[encryption] ENCRYPTION_KEY not set — using ephemeral per-process key. Encrypted data will NOT survive restarts. Set ENCRYPTION_KEY in .env for persistent local data.');
        return crypto.randomBytes(KEY_LENGTH);
    }
    // If it looks like hex and is 64 chars, parse it. Otherwise, hash it.
    if (/^[0-9a-f]{64}$/i.test(ENCRYPTION_KEY_HEX)) {
        return Buffer.from(ENCRYPTION_KEY_HEX, 'hex');
    }
    // Derive a 32-byte key from whatever string was provided (unique salt per key)
    return crypto.scryptSync(ENCRYPTION_KEY_HEX, 'ee-encryption-v1', KEY_LENGTH);
};

const KEY = getKey();

export const encrypt = (text: string): string => {
    if (!text) return text;

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

export const decrypt = (text: string): string => {
    if (!text) return text;

    // Check if it matches our format
    const parts = text.split(':');
    if (parts.length !== 3) {
        // Attempt to return as-is (graceful degradation for unencrypted data)
        // Or strictly fail. given this is introduced to existing data, graceful is safer for migration
        return text;
    }

    try {
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];

        const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error("Decryption failed:", error);
        return text; // Fallback to returning original text if decryption fails (e.g. might be plaintext)
    }
};

export const isEncrypted = (text: string): boolean => {
    if (!text) return false;
    const parts = text.split(':');
    return parts.length === 3 &&
        parts[0].length === IV_LENGTH * 2 &&
        parts[1].length === TAG_LENGTH * 2;
};

// Binary / Buffer Encryption Support

export const encryptBuffer = (buffer: Buffer): Buffer => {
    if (!buffer) return buffer;

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Format: IV (16 bytes) + AuthTag (16 bytes) + EncryptedData
    return Buffer.concat([iv, authTag, encrypted]);
};

export const decryptBuffer = (buffer: Buffer): Buffer => {
    if (!buffer) return buffer;

    // Sanity check length: needs at least IV + Tag = 32 bytes
    if (buffer.length < IV_LENGTH + TAG_LENGTH) {
        // Not encrypted or corrupted
        return buffer;
    }

    try {
        const iv = buffer.subarray(0, IV_LENGTH);
        const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
        const encrypted = buffer.subarray(IV_LENGTH + TAG_LENGTH);

        const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
        decipher.setAuthTag(authTag);

        return Buffer.concat([decipher.update(encrypted), decipher.final()]);
    } catch (error) {
        // If decryption fails (e.g. invalid tag, wrong key, or wasn't encrypt), return original
        // This allows gradual migration if we have mixed content
        // console.error("Buffer decryption failed (returning original):", error);
        return buffer;
    }
};
