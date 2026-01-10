'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Archive, ArchiveX, Trash2, Clock, Reply, ReplyAll, Forward, MoreVertical, MousePointerClick, Star, Tag, Check, ArrowLeft, X, Sparkles } from 'lucide-react';
import { useCache } from '@/contexts/CacheContext';
import { useCompose } from '@/contexts/ComposeContext';
import { formatDate, cn } from '@/lib/utils';
import DOMPurify from 'isomorphic-dompurify';
import { toast } from 'sonner';
import { fetchDeduped } from '@/lib/fetchdedupe';
import { ClientExpansions } from '@/lib/expansions/client/renderer';
import { ensureClientExpansions } from '@/lib/expansions/client/core-expansions';
ensureClientExpansions();
import { ExpansionResult } from '@/lib/expansions/types';
import * as Icons from 'lucide-react';
import { SafeIframe } from './ui/SafeIframe';

interface EmailDetails {
    email: {
        id: string;
        from: string;
        to: string;
        subject: string;
        createdAt: string;
        read: boolean;
        starred: boolean;
        folder: string;
        attachments: any[];
        labels: any[];
    };
    content: string;
}

export function MailView() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get('id');
    const [data, setLocalData] = useState<EmailDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);

    const [availableLabels, setAvailableLabels] = useState<any[]>([]);
    const [showLabelMenu, setShowLabelMenu] = useState(false);
    const { getData, setData: setCacheData, invalidate } = useCache();

    const { openCompose } = useCompose();

    useEffect(() => {
        if (!id) return;

        async function fetchEmailAndLabels() {
            setLoading(true);
            try {
                // Fetch Email
                const emailKey = `email-${id}`;
                let emailData = await getData<EmailDetails>(emailKey);

                if (!emailData) {
                    emailData = await fetchDeduped(`/api/emails/${id}`);
                    if (emailData?.email) {
                        setCacheData(emailKey, emailData);
                    }
                }

                // Fetch Common Labels
                const labelsKey = 'labels-all';
                let labelsData = await getData<any[]>(labelsKey);

                if (!labelsData) {
                    const resLabels = await fetch('/api/labels');
                    labelsData = await resLabels.json();
                    if (Array.isArray(labelsData)) {
                        setCacheData(labelsKey, labelsData);
                    }
                }

                if (emailData?.email) {
                    setLocalData(emailData);
                }
                if (Array.isArray(labelsData)) {
                    setAvailableLabels(labelsData);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchEmailAndLabels();
    }, [id, getData, setCacheData]);

    const handleUpdate = async (updates: any) => {
        if (!data) return;

        const previousData = { ...data };
        const newData = {
            ...previousData,
            email: { ...previousData.email, ...updates }
        };

        setLocalData(newData);
        setCacheData(`email-${data.email.id}`, newData);

        try {
            const res = await fetch(`/api/emails/${data.email.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            if (!res.ok) throw new Error('Failed to update');

            if (updates.toggleLabelId) {
                const json = await res.json();
                const updatedData = { ...previousData, email: json };
                setLocalData(updatedData);
                setCacheData(`email-${data.email.id}`, updatedData);
            }

            toast.success('Updated');
        } catch (error) {
            setLocalData(previousData);
            setCacheData(`email-${data.email.id}`, previousData);
            toast.error('Failed to update');
        }
    };

    const toggleLabel = (labelId: string) => {
        handleUpdate({ toggleLabelId: labelId });
    };

    const trashEmail = async () => {
        if (!data) return;

        // Trust the URL param first if available, otherwise fallback to email data
        const folderParam = searchParams.get('folder');
        const isTrashContext = folderParam === 'trash' || data.email.folder === 'trash';
        const currentFolder = data.email.folder || 'inbox';

        if (isTrashContext) {
            const toastId = toast.loading('Deleting permanently...');
            try {
                const res = await fetch(`/api/emails/${data.email.id}/delete`, { method: 'DELETE' });
                if (res.ok) {
                    toast.success('Deleted permanently', { id: toastId });

                    // Invalidate both potential keys to be safe
                    invalidate(`emails-trash`);
                    invalidate(`emails-${currentFolder}`);

                    router.push(`/?folder=${folderParam || 'inbox'}`);
                } else {
                    toast.error('Failed to delete', { id: toastId });
                }
            } catch (e) {
                toast.error('Failed to delete', { id: toastId });
            }
        } else {
            await handleUpdate({ folder: 'trash' });
            invalidate(`email-${data.email.id}`);
            invalidate(`emails-${currentFolder}`);
            invalidate('emails-trash'); // Ensure trash count/list updates
            router.push('/');
        }
    };

    const handleReply = () => {
        if (!data) return;
        const { email } = data;
        const quoteHeader = `<div dir="ltr" class="gmail_attr">On ${formatDate(email.createdAt)}, ${email.from} wrote:<br></div>`;
        const quoteBody = `<blockquote class="gmail_quote" style="margin:0 0 0 .8ex;border-left:1px #999 solid;padding-left:1ex">${data.content}</blockquote>`;

        openCompose({
            id: crypto.randomUUID(),
            to: email.from,
            subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
            body: `<p></p><br><div class="gmail_quote">${quoteHeader}${quoteBody}</div>`,
            minimized: false
        });
    };

    const handleForward = () => {
        if (!data) return;
        const { email } = data;
        openCompose({
            id: crypto.randomUUID(),
            to: '',
            subject: email.subject.startsWith('Fwd:') ? email.subject : `Fwd: ${email.subject}`,
            body: `<p></p><p>---------- Forwarded message ---------<br>From: ${email.from}<br>Date: ${formatDate(email.createdAt)}<br>Subject: ${email.subject}<br>To: ${email.to}</p><br>${data.content}`,
            minimized: false
        });
    };

    const { email, content } = data || {};
    const cleanHtml = DOMPurify.sanitize(content || "", {
        USE_PROFILES: { html: true },
        ADD_ATTR: ['class', 'style', 'dir', 'target', 'id'],
        ADD_TAGS: ['style', 'center', 'font']
    });

    const [smartReplies, setSmartReplies] = useState<string[]>([]);
    const [loadingSmartReplies, setLoadingSmartReplies] = useState(false);

    if (!id || !data) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center text-muted-foreground">
                <MousePointerClick className="h-8 w-8 opacity-50" />
                No message selected
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 p-2 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
                <button onClick={() => router.push('/')} className="md:hidden p-2"><ArrowLeft className="h-5 w-5" /></button>
                <div className="flex items-center gap-1">
                    <button onClick={() => handleUpdate({ folder: 'archive' })} className="p-2"><Archive className="h-4 w-4" /></button>
                    <button onClick={() => handleUpdate({ folder: 'spam' })} className="p-2"><ArchiveX className="h-4 w-4" /></button>
                    <button onClick={trashEmail} className="p-2"><Trash2 className="h-4 w-4" /></button>
                    <button onClick={handleReply} className="p-2"><Reply className="h-4 w-4 text-muted-foreground" /></button>
                    <button onClick={handleForward} className="p-2"><Forward className="h-4 w-4 text-muted-foreground" /></button>
                </div>
                <div className="h-5 w-px bg-border mx-1" />
                <button onClick={() => handleUpdate({ starred: !email?.starred })} className={cn("p-2", email?.starred && "text-yellow-500")}>
                    <Star className={cn("h-4 w-4", email?.starred && "fill-current")} />
                </button>
                <ClientExpansions
                    mountPoint="EMAIL_TOOLBAR"
                    context={{
                        emailId: email?.id,
                        emailContent: cleanHtml,
                        onUpdateSummary: (newContent: string) => setSummary(newContent),
                        onUpdateSuggestions: (replies: string[]) => setSmartReplies(replies),
                        onUpdateContent: (newContent: string) => {
                            if (!data) return;
                            setLocalData({ ...data, content: newContent });
                        }
                    }}
                />
            </div>

            <div className="p-6 pb-4">
                {summary && (
                    <div className="mb-6 p-4 rounded-lg bg-purple-50 border border-purple-100 text-sm text-purple-900 shadow-sm">
                        <div className="flex items-center gap-2 mb-1 text-purple-700 font-semibold">
                            <Sparkles className="h-3 w-3" />
                            <span>AI Summary</span>
                        </div>
                        {summary}
                    </div>
                )}
                <div className="flex items-start justify-between gap-4 mb-4">
                    <h2 className="text-xl font-semibold leading-tight">{email?.subject || '(No Subject)'}</h2>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                            {email?.from.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">{email?.from}</span>
                            <span className="text-xs text-muted-foreground">to {email?.to}</span>
                        </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{formatDate(email?.createdAt!)}</div>
                </div>
                <ClientExpansions
                    mountPoint="EMAIL_HEADER"
                    context={{
                        emailId: email?.id,
                        emailContent: cleanHtml,
                        onUpdateSummary: (content: string) => setSummary(content)
                    }}
                />
            </div>

            <div className="h-px bg-border mx-6" />

            <div className="flex-1 overflow-y-auto p-6">
                <SafeIframe html={cleanHtml} />

                {smartReplies.length > 0 && (
                    <div className="mt-8 pt-4 border-t flex flex-wrap gap-2">
                        {smartReplies.map((reply, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    if (!data) return;
                                    const { email } = data;
                                    const quoteHeader = `<div dir="ltr" class="gmail_attr">On ${formatDate(email.createdAt)}, ${email.from} wrote:<br></div>`;
                                    const quoteBody = `<blockquote class="gmail_quote" style="margin:0 0 0 .8ex;border-left:1px #999 solid;padding-left:1ex">${data.content}</blockquote>`;
                                    openCompose({
                                        id: crypto.randomUUID(),
                                        to: email.from,
                                        subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
                                        body: `<p>${reply}</p><br><div class="gmail_quote">${quoteHeader}${quoteBody}</div>`,
                                        minimized: false
                                    });
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-background hover:bg-purple-50 transition-colors text-sm shadow-sm"
                            >
                                <Sparkles className="h-3 w-3 text-purple-500" />
                                {reply}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {email?.attachments && email.attachments.length > 0 && (
                <div className="p-4 border-t bg-muted/5">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        {email.attachments.length} Attachment{email.attachments.length > 1 ? 's' : ''}
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {email.attachments.map((att: any) => (
                            <a key={att.id} href={att.url || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-accent transition-colors max-w-sm">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                    <Icons.File className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-sm font-medium truncate">{att.filename}</span>
                                    <span className="text-xs text-muted-foreground">{att.size ? (att.size / 1024).toFixed(1) + ' KB' : 'Unknown size'}</span>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
