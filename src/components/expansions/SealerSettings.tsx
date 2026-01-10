'use client';

import { useState, useEffect } from 'react';
import { KeyRound, Download, Trash2, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// WebCrypto Helper
async function generateKeyPair() {
    return await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
    );
}

async function exportKey(key: CryptoKey, type: 'pkcs8' | 'spki') {
    const exported = await window.crypto.subtle.exportKey(type, key);
    // Convert to PEM-like base64 for file download
    const exportedAsBase64 = Buffer.from(exported).toString('base64');
    const label = type === 'pkcs8' ? 'PRIVATE KEY' : 'PUBLIC KEY';
    return `-----BEGIN ${label}-----\n${exportedAsBase64.match(/.{1,64}/g)?.join('\n')}\n-----END ${label}-----`;
}

interface Sealer {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    keys: {
        public: string; // PEM (Encryption Component)
        private: string; // PEM (Decryption Component - 'Reader Key')
    }
}

interface SealerSettingsProps {
    settings: {
        sealers?: Sealer[];
    };
    onSave: (settings: any) => void;
}

export function SealerSettings({ settings, onSave }: SealerSettingsProps) {
    const [sealers, setSealers] = useState<Sealer[]>(settings?.sealers || []);
    const [generating, setGenerating] = useState(false);
    const [newName, setNewName] = useState('');

    useEffect(() => {
        onSave({ sealers });
    }, [sealers]);

    const createSealer = async () => {
        if (!newName) return toast.error('Enter a name for the sealer');
        setGenerating(true);
        try {
            const keyPair = await generateKeyPair();
            const publicKeyPEM = await exportKey(keyPair.publicKey, 'spki');
            const privateKeyPEM = await exportKey(keyPair.privateKey, 'pkcs8');

            const newSealer: Sealer = {
                id: crypto.randomUUID(),
                name: newName,
                createdAt: new Date().toISOString(),
                keys: {
                    public: publicKeyPEM,  // Used by Sender to Encrypt
                    private: privateKeyPEM // Used by Recipient to Decrypt
                }
            };

            setSealers([...sealers, newSealer]);
            setNewName('');
            toast.success('Sealer created successfully');
        } catch (e) {
            console.error(e);
            toast.error('Failed to generate keys');
        } finally {
            setGenerating(false);
        }
    };

    const downloadReaderKey = (sealer: Sealer) => {
        const blob = new Blob([sealer.keys.private], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${sealer.name.replace(/\s+/g, '_')}_Reader_Key.pem`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.info(`Downloaded Reader Key for ${sealer.name}`);
    };

    const deleteSealer = (index: number) => {
        if (confirm('Are you sure? Messages encrypted with this sealer cannot be recovered without the backup key.')) {
            setSealers(sealers.filter((_, i) => i !== index));
        }
    };

    return (
        <div className="space-y-6">
            <div className="p-4 border border-blue-100 bg-blue-50/50 rounded-lg text-sm text-blue-800">
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <KeyRound className="h-4 w-4" />
                    How Sealers Work
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-1 opacity-90">
                    <li>Create a <strong>Sealer</strong> to generate a secure encryption key pair.</li>
                    <li>Download the <strong>Reader Key</strong> and share it physically (USB) or securely with recipients.</li>
                    <li>When composing, click <strong>Encrypt</strong> and choose this Sealer.</li>
                    <li>Only people with the Reader Key can decrypt the message.</li>
                </ul>
            </div>

            <div className="flex gap-2 items-end border-b pb-6">
                <div className="grid gap-1.5 flex-1">
                    <label className="text-sm font-medium">New Sealer Name</label>
                    <input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Project Top Secret"
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                    />
                </div>
                <button
                    onClick={createSealer}
                    disabled={generating || !newName}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground h-9 px-4 hover:bg-primary/90 disabled:opacity-50"
                >
                    {generating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Create Sealer
                </button>
            </div>

            <div className="space-y-3">
                {sealers.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                        No Sealers found. Create one to start sending encrypted mail.
                    </div>
                )}
                {sealers.map((sealer, i) => (
                    <div key={sealer.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:shadow-sm transition-all md:flex-row flex-col gap-4 md:gap-0">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <KeyRound className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-medium">{sealer.name}</h3>
                                <p className="text-xs text-muted-foreground">Created: {new Date(sealer.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <button
                                onClick={() => downloadReaderKey(sealer)}
                                className="flex-1 md:flex-none inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                                title="Download the key your friends need to read messages"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Reader Key
                            </button>
                            <button
                                onClick={() => deleteSealer(i)}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 h-9 w-9"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export const SealerSettingsDefinition = {
    id: 'core-sealer',
    title: 'Sealer Encryption',
    icon: KeyRound,
    Component: SealerSettings
};
