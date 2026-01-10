import React, { useState, useEffect } from 'react';
import { ClientExpansionContext } from '@/lib/expansions/client/types';
import { Users, Loader2, UserPlus, Check, X, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useExpansionUI } from '@/contexts/ExpansionUIContext';
import { HubSpotSettings } from './HubSpotSettings';
import { useExpansionSettings } from '@/hooks/useExpansionSettings';

const HubSpotContactModal = ({ context, onClose }: { context: ClientExpansionContext, onClose: () => void }) => {
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [existingContact, setExistingContact] = useState<any | null>(null);

    // Form state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    const { settings, loading: settingsLoading } = useExpansionSettings('core-hubspot');

    useEffect(() => {
        if (settingsLoading) return;
        // Extract basic info from context
        const fromEmail = extractEmail(context.from || '');
        const fromName = extractName(context.from || '');

        setEmail(fromEmail);
        if (fromName) {
            const parts = fromName.split(' ');
            setFirstName(parts[0]);
            if (parts.length > 1) setLastName(parts.slice(1).join(' '));
        }

        checkContact(fromEmail);
    }, []);

    const extractEmail = (text: string) => {
        const match = text.match(/<(.+)>/);
        return match ? match[1] : text;
    };

    const extractName = (text: string) => {
        if (text.includes('<')) {
            return text.split('<')[0].trim().replace(/"/g, '');
        }
        return '';
    };

    const checkContact = async (emailToCheck: string) => {
        setChecking(true);
        try {
            const res = await fetch(`/api/expansions?trigger=check_contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailToCheck })
            });
            const json = await res.json();
            if (json.success && json.data.found) {
                setExistingContact(json.data.contact);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setChecking(false);
        }
    };

    const createContact = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/expansions?trigger=create_contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    firstname: firstName,
                    lastname: lastName,
                    phone
                })
            });
            const json = await res.json();
            if (json.success) {
                toast.success('Contact created in HubSpot');
                setExistingContact(json.data); // Show success state
            } else {
                toast.error(json.message || 'Failed to create contact');
            }
        } catch (e) {
            toast.error('Error creating contact');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/20">
                <h3 className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-orange-600" />
                    HubSpot CRM
                </h3>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="p-6 space-y-4">
                {checking ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : existingContact ? (
                    <div className="text-center space-y-4">
                        <div className="mx-auto bg-green-100 text-green-600 p-3 rounded-full w-fit">
                            <Check className="h-6 w-6" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-lg">Contact Exists</h4>
                            <p className="text-muted-foreground text-sm">{existingContact.properties.firstname} {existingContact.properties.lastname}</p>
                            <p className="text-muted-foreground text-xs">{existingContact.properties.email}</p>
                        </div>
                        <a
                            href={`https://app.hubspot.com/contacts/${process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID || 'undefined'}/contact/${existingContact.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                            View in HubSpot <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <UserPlus className="h-5 w-5 text-muted-foreground" />
                            <h4 className="font-medium">Create New Contact</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">First Name</label>
                                <input
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Last Name</label>
                                <input
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Email</label>
                            <input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Phone</label>
                            <input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="px-6 py-4 bg-muted/20 flex justify-end gap-2 border-t">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors"
                >
                    Close
                </button>
                {!checking && !existingContact && (
                    <button
                        onClick={createContact}
                        disabled={loading || !email}
                        className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Create Contact
                    </button>
                )}
            </div>
        </div>
    );
};

export const HubSpotClientExpansion = ({ context }: { context: ClientExpansionContext }) => {
    const { openModal, closeModal } = useExpansionUI();

    if (!context.emailContent) return null;

    return (
        <button
            onClick={() => openModal(<HubSpotContactModal context={context} onClose={closeModal} />)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8 text-muted-foreground"
            title="Add to HubSpot"
        >
            <Users className="h-4 w-4" />
        </button>
    );
};

export const HubSpotClientExpansionDefinition = {
    id: 'core-hubspot',
    mounts: [
        {
            point: 'EMAIL_TOOLBAR',
            Component: HubSpotClientExpansion,
            title: 'HubSpot CRM',
            icon: Users
        },
        {
            point: 'CUSTOM_SETTINGS_TAB',
            Component: HubSpotSettings,
            title: 'HubSpot',
            icon: Users
        }
    ]
};
