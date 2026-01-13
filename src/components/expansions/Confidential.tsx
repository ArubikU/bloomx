import React, { useState, useEffect } from 'react';
import { ClientExpansionContext } from '@/lib/expansions/client/types';
import { Lock, Unlock, Check, KeyRound, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { SealerSettings } from './SealerSettings';
import { useExpansionSettings } from '@/hooks/useExpansionSettings';
import { useRef } from 'react';
import { Popover } from '../ui/Popover';
import { useSearchParams } from 'next/navigation';

// --- Crypto Helpers ---

function str2ab(str: string) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

function ab2str(buf: ArrayBuffer) {
    // @ts-ignore
    return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function pemToBinary(pem: string) {
    const base64 = pem.replace(/-----BEGIN [^-]+-----/, '').replace(/-----END [^-]+-----/, '').replace(/\s/g, '');
    const binaryString = window.atob(base64);
    return str2ab(binaryString);
}


async function importPublicKey(pem: string) {
    const binaryDer = pemToBinary(pem);
    return await window.crypto.subtle.importKey(
        "spki",
        binaryDer,
        {
            name: "RSA-OAEP",
            hash: "SHA-256"
        },
        true,
        ["encrypt"]
    );
}

async function importPrivateKey(pem: string) {
    const binaryDer = pemToBinary(pem);
    return await window.crypto.subtle.importKey(
        "pkcs8",
        binaryDer,
        {
            name: "RSA-OAEP",
            hash: "SHA-256"
        },
        true,
        ["decrypt"]
    );
}

async function hybridEncrypt(plainText: string, publicKeyPem: string) {
    // 1. Generate AES Session Key
    const sessionKey = await window.crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt"]
    );

    // 2. Encrypt Data with Session Key
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(plainText);

    const encryptedData = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        sessionKey,
        encodedData
    );

    // 3. Encrypt Session Key with RSA Public Key
    const rawSessionKey = await window.crypto.subtle.exportKey("raw", sessionKey);
    const publicKey = await importPublicKey(publicKeyPem);

    const encryptedSessionKey = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        publicKey,
        rawSessionKey
    );

    // 4. Pack
    // Format: Version|IV(Base64)|EncryptedSessionKey(Base64)|EncryptedData(Base64)
    const b64IV = Buffer.from(iv).toString('base64');
    const b64Key = Buffer.from(encryptedSessionKey).toString('base64');
    const b64Data = Buffer.from(encryptedData).toString('base64');

    return `BLOOMX-SEAL-V1:${b64IV}:${b64Key}:${b64Data}`;
}

async function hybridDecrypt(payload: string, privateKeyPem: string) {
    const parts = payload.split(':');
    if (parts[0] !== 'BLOOMX-SEAL-V1' || parts.length !== 4) {
        throw new Error('Invalid payload format. Must be BLOOMX-SEAL-V1.');
    }

    const iv = new Uint8Array(str2ab(window.atob(parts[1])));
    const encryptedSessionKey = str2ab(window.atob(parts[2]));
    const encryptedData = str2ab(window.atob(parts[3]));

    // 1. Import Private Key
    const privateKey = await importPrivateKey(privateKeyPem);

    // 2. Decrypt Session Key
    const sessionKeyRaw = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        encryptedSessionKey
    );

    // 3. Import Session Key (AES-GCM)
    const sessionKey = await window.crypto.subtle.importKey(
        "raw",
        sessionKeyRaw,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
    );

    // 4. Decrypt Data
    const decryptedData = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        sessionKey,
        encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
}


import { useSession, getSession } from '@/components/SessionProvider';
import { useSecureSync } from '@/hooks/useSecureSync';
import { secureRead } from '@/lib/expansions/client/secure-storage';

// --- Secure Handler ---

async function encryptionHandler(details: { to: string[], subject: string, body: string, cc: string[], bcc: string[] }) {
    // 1. Get Session for User ID (needed for key derivation)
    const session = await getSession();
    const userId = session?.user?.email || 'default-user'; // Fallback if no session

    // 2. Read Secure State
    const state = await secureRead('confidential-state', userId);

    if (!state || !state.activeSealerId) return;

    const { activeSealerId, sealers } = state;
    const sealer = sealers.find((s: any) => s.id === activeSealerId);
    if (!sealer) return;

    const id = toast.loading(`Encrypting with ${sealer.name}...`);

    try {
        // Perform Hybrid Encryption
        const payload = await hybridEncrypt(details.body, sealer.keys.public);

        toast.dismiss(id);
        toast.success('Encryption successful');

        const wrapper = `
            <div contenteditable="false" style="margin: 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <table cellpadding="0" cellspacing="0" border="0" class="bloomx-editor-table" style="background-color: #fafafa; border: 1px solid #e2e8f0; border-radius: 12px; width: 100%; max-width: 420px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden;">
                    <tr>
                        <td style="padding: 20px;">
                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                <tr>
                                    <td width="48" valign="top" style="padding-right: 16px;">
                                        <div style="background-color: #f1f5f9; border-radius: 10px; width: 48px; height: 48px; text-align: center; line-height: 48px;">
                                            <span style="font-size: 24px;">🔒</span>
                                        </div>
                                    </td>
                                    <td valign="top">
                                        <div style="font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">Secured Message</div>
                                        <div style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 12px;">
                                            This message is encrypted with <strong>${sealer.name}</strong>. Access is restricted to authorized readers.
                                        </div>
                                        <div style="margin-bottom: 16px;">
                                            <a href="${window.location.origin}/extensions/decrypt?payload=${encodeURIComponent(payload)}" target="_blank" style="display: inline-block; padding: 8px 16px; background: #1e293b; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600;">Decrypt Message</a>
                                        </div>
                                        <div style="font-size: 11px; color: #94a3b8;">
                                            Encrypted with Bloomx Sealer
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </div>
        `;

        return { body: wrapper };

    } catch (e) {
        console.error(e);
        toast.error('Encryption Failed');
        return { stop: true };
    }
}


// --- Components ---

export const ConfidentialClientExpansion = ({ context }: { context: ClientExpansionContext }) => {
    const { settings, loading } = useExpansionSettings('core-sealer');
    const { data: session } = useSession();
    const userId = session?.user?.email || 'default-user';

    // Use Secure Sync for State (Active Sealer + Sealers List)
    // Initial value is empty, will effectively be populated by user selection or hydration
    const [secureState, setSecureState] = useSecureSync<{ activeSealerId: string | null, sealers: any[] }>('confidential-state', { activeSealerId: null, sealers: [] }, userId);

    const activeSealerId = secureState.activeSealerId;
    const sealers = settings?.sealers || [];

    // When 'sealers' from settings change, update the secure storage so handler has latest keys
    // We only update if sealers actually changed to avoid loops, or if secureState options are empty
    useEffect(() => {
        if (sealers.length > 0 && JSON.stringify(sealers) !== JSON.stringify(secureState.sealers)) {
            setSecureState({ ...secureState, sealers });
        }
    }, [sealers, secureState, setSecureState]);

    const activeSealer = sealers.find((s: any) => s.id === activeSealerId);

    const togglePopover = () => {
        if (!buttonRef.current || !context.openPopover) return;
        const rect = buttonRef.current.getBoundingClientRect();

        context.openPopover(rect, (
            <div className="p-2">
                <div className="text-xs font-semibold text-muted-foreground mb-2 px-1">Select Sealer</div>
                {sealers.length === 0 ? (
                    <div className="text-xs text-center py-2 text-muted-foreground">
                        No Sealers found. Create one in Settings.
                    </div>
                ) : (
                    <div className="space-y-1">
                        {sealers.map((s: any) => (
                            <button
                                key={s.id}
                                onClick={() => {
                                    // Update Secure and Local State
                                    const newId = s.id === activeSealerId ? null : s.id;
                                    setSecureState({ ...secureState, activeSealerId: newId, sealers }); // Ensure sealers are fresh too
                                    context.close?.();
                                }}
                                className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center justify-between ${s.id === activeSealerId ? 'bg-emerald-50 text-emerald-700 font-medium' : 'hover:bg-gray-100'
                                    }`}
                            >
                                <span>{s.name}</span>
                                {s.id === activeSealerId && <Check className="h-3 w-3" />}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        ), { width: 256, header: true });
    };

    // Ref Buttons
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    return (
        <button
            ref={buttonRef}
            onClick={togglePopover}
            className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-8 w-8 
                ${activeSealer ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
            title={activeSealer ? `Encrypted with ${activeSealer.name}` : "Encrypt Message"}
        >
            {activeSealer ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
        </button>
    );
};

export const ConfidentialDecryptPage = () => {
    const searchParams = useSearchParams();
    const [payload, setPayload] = useState('');

    useEffect(() => {
        const p = searchParams.get('payload');
        if (p) setPayload(p);
    }, [searchParams]);

    const [keyFile, setKeyFile] = useState<File | null>(null);
    const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleKeyUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setKeyFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleDecrypt = async () => {
        if (!payload) return setError('Please paste the encrypted payload.');
        if (!keyFile) return setError('Please upload your Reader Key (.pem).');

        setLoading(true);
        setError(null);
        setDecryptedContent(null);

        try {
            const keyText = await keyFile.text();
            const content = await hybridDecrypt(payload.trim(), keyText);
            setDecryptedContent(content);
            toast.success('Message decrypted successfully');
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Decryption failed. Ensure you are using the correct key.');
            toast.error('Decryption failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto rounded-xl shadow-lg border border-slate-200 overflow-hidden bg-white my-10">
            <div className="bg-slate-900 text-white p-6">
                <div className="flex items-center gap-3 mb-2">
                    <Lock className="w-6 h-6 text-emerald-400" />
                    <h1 className="text-xl font-bold">Bloomx Decrypt</h1>
                </div>
                <p className="text-slate-400 text-sm">
                    Decrypt messages secured with Client-Side Encryption.
                </p>
            </div>

            <div className="p-6 space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        1. Encrypted Payload
                    </label>
                    <textarea
                        value={payload}
                        onChange={(e) => setPayload(e.target.value)}
                        placeholder="BLOOMX-SEAL-V1:..."
                        className="w-full h-32 p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <KeyRound className="w-4 h-4" />
                        2. Upload Reader Key
                    </label>
                    <input
                        type="file"
                        accept=".pem,.key,.txt"
                        onChange={handleKeyUpload}
                        className="block w-full text-sm text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-primary/10 file:text-primary
                        hover:file:bg-primary/20
                        cursor-pointer"
                    />
                    {keyFile && (
                        <p className="text-xs text-earth-600 font-medium pl-1">
                            Loaded: {keyFile.name}
                        </p>
                    )}
                </div>

                <button
                    onClick={handleDecrypt}
                    disabled={loading || !payload || !keyFile}
                    className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                    {loading ? 'Decrypting...' : <><Unlock className="w-4 h-4" /> Decrypt Message</>}
                </button>

                {error && (
                    <div className="p-4 rounded-lg bg-red-50 text-red-600 text-sm flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                {decryptedContent && (
                    <div className="mt-8 pt-8 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Unlock className="w-5 h-5 text-emerald-500" />
                                Decrypted Message
                            </h3>
                            <button
                                onClick={() => {
                                    setDecryptedContent(null);
                                    setPayload('');
                                    toast.info('Cleared');
                                }}
                                className="text-xs text-slate-500 hover:text-slate-800"
                            >
                                Clear
                            </button>
                        </div>
                        <div className="prose prose-sm max-w-none p-6 bg-slate-50 rounded-xl border border-slate-200">
                            <div dangerouslySetInnerHTML={{ __html: decryptedContent }} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export const ConfidentialClientExpansionDefinition = {
    id: 'core-sealer',
    mounts: [
        {
            point: 'COMPOSER_TOOLBAR',
            Component: ConfidentialClientExpansion,
            title: 'Encrypt Message',
            icon: Lock
        },
        {
            point: 'CUSTOM_SETTINGS_TAB',
            Component: SealerSettings,
            title: 'Sealer Encryption',
            icon: Lock
        },
        {
            point: 'EXTENSION_PAGE',
            Component: ConfidentialDecryptPage,
            routePath: 'decrypt'
        },
        {
            point: 'BEFORE_SEND_HANDLER',
            handler: encryptionHandler,
            priority: 'LOW'
        }
    ]
};
