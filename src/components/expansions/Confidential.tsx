import React, { useState, useEffect } from 'react';
import { ClientExpansionContext } from '@/lib/expansions/client/types';
import { Lock, Unlock, Check } from 'lucide-react';
import { toast } from 'sonner';
import { SealerSettings } from './SealerSettings';

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

import { useExpansionSettings } from '@/hooks/useExpansionSettings';

// --- Component ---

import { useRef } from 'react';
import { Popover } from '../ui/Popover';

export const ConfidentialClientExpansion = ({ context }: { context: ClientExpansionContext }) => {
    const { settings, loading } = useExpansionSettings('core-sealer');
    const [activeSealerId, setActiveSealerId] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const sealers = settings?.sealers || [];

    // Middleware
    useEffect(() => {
        if (!context.registerBeforeSend) return;

        context.registerBeforeSend(async (details: any) => {
            if (!activeSealerId) return;

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
                                                <div style="margin-bottom: 8px;">
                                                    <a href="https://bloomx.app/decrypt" style="display: inline-block; padding: 8px 16px; background: #1e293b; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600;">Decrypt Message</a>
                                                </div>
                                                <div style="font-size: 11px; color: #94a3b8;">
                                                    Encrypted with Bloomx Sealer
                                                </div>
                                            </td>
                                        </tr>
                                    </table>
                                    <p class="bloomx-encrypted-payload" style="display:none">${payload}</p>
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
        });
    }, [activeSealerId, sealers, context.registerBeforeSend]);

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
                                    setActiveSealerId(s.id === activeSealerId ? null : s.id);
                                    context.onClose?.();
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

export const ConfidentialClientExpansionDefinition = {
    id: 'core-sealer', // Renamed ID but kept variable export name for compat with registry hookup in Step 2642
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
        }
    ]
};
