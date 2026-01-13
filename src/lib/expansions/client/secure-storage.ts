
// Logic for rotating key encryption for localStorage

async function deriveKey(userId: string, epoch: number): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const secret = `${userId}-BLOOMX-SECURE-SYNC-${epoch}`;
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: encoder.encode("BLOOMX-SALT"), // In prod, use random salt
            iterations: 1000, // Faster for client sync than high security storage
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

const EPOCH_LENGTH = 300000; // 5 minutes

function getCurrentEpoch() {
    return Math.floor(Date.now() / EPOCH_LENGTH);
}

export async function secureWrite(key: string, value: any, userId: string): Promise<void> {
    const epoch = getCurrentEpoch();
    const cryptoKey = await deriveKey(userId, epoch);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(value));

    const encryptedContent = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        cryptoKey,
        data
    );

    // Format: EPOCH:IV:DATA
    const b64IV = Buffer.from(iv).toString('base64');
    const b64Data = Buffer.from(encryptedContent).toString('base64');
    const payload = `${epoch}:${b64IV}:${b64Data}`;

    localStorage.setItem(key, payload);
}

export async function secureRead(key: string, userId: string): Promise<any | null> {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parts = raw.split(':');
    if (parts.length !== 3) return null;

    const storedEpoch = parseInt(parts[0], 10);
    const currentEpoch = getCurrentEpoch();

    // Allow current epoch or previous epoch (grace period)
    if (storedEpoch !== currentEpoch && storedEpoch !== currentEpoch - 1) {
        return null; // Expired
    }

    try {
        const cryptoKey = await deriveKey(userId, storedEpoch);
        const iv = new Uint8Array(Buffer.from(parts[1], 'base64'));
        const data = new Uint8Array(Buffer.from(parts[2], 'base64'));

        const decrypted = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            cryptoKey,
            data
        );

        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(decrypted));
    } catch (e) {
        console.error("Secure read failed", e);
        return null;
    }
}
