import crypto from 'crypto';

// Use a consistent encryption key safely derived or from env
// Fallback for dev only - in prod this MUST be set
const ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || 'dev-fallback-secret-key-32-chars!!';
const IV_LENGTH = 16; // For AES, this is always 16

// Ensure key is 32 bytes for aes-256-cbc
const getKey = () => {
    return crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest('base64').substring(0, 32);
};

export function encrypt(text: string): string {
    if (!text) return text;
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const key = getKey();
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (e) {
        console.error('Encryption failed', e);
        return text;
    }
}

export function decrypt(text: string): string {
    if (!text) return text;
    try {
        const textParts = text.split(':');
        if (textParts.length !== 2) return text; // Not encrypted or legacy

        const iv = Buffer.from(textParts[0], 'hex');
        const encryptedText = Buffer.from(textParts[1], 'hex');
        const key = getKey();
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (e) {
        // console.error('Decryption failed', e); 
        // Likely because it wasn't encrypted
        return text;
    }
}

export function encryptObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;
    const newObj: any = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (typeof value === 'string') {
                // Heuristic: Encrypt if it looks like a token/key or is in a known set?
                // The user wants EVERYTHING encrypted in this context essentially.
                // But simple strings like "true"/"false" toggles?
                // Let's encrypt EVERYTHING in expansionSettings strings just to be safe and uniform?
                // Or checking keys: 'key', 'token', 'secret', 'password', 'id' (maybe not id)
                // Let's rely on the caller to pass specific objects or encrypt all strings in generic set.
                // For expansionSettings specifically, we will encrypt ALL strings.
                newObj[key] = encrypt(value);
            } else if (typeof value === 'object') {
                newObj[key] = encryptObject(value);
            } else {
                newObj[key] = value;
            }
        }
    }
    return newObj;
}

export function decryptObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;
    const newObj: any = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (typeof value === 'string') {
                newObj[key] = decrypt(value);
            } else if (typeof value === 'object') {
                newObj[key] = decryptObject(value);
            } else {
                newObj[key] = value;
            }
        }
    }
    return newObj;
}
