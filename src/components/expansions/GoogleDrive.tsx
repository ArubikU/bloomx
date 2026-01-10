import React, { useState, useEffect } from 'react';
import { useExpansions } from '@/hooks/useExpansions';
import { ClientExpansion } from '@/lib/expansions/client/types';
import { Paperclip, Loader2, X, Upload, File as FileIcon, LogIn, List, Grid, LayoutGrid } from 'lucide-react';
import { useExpansionUI } from '@/contexts/ExpansionUIContext';
import { signIn } from 'next-auth/react';
import { SiGoogledrive } from "react-icons/si";
import { cn } from '@/lib/utils';

// Modal Component
const GoogleDriveFilesModal = ({ context, onClose }: { context: any, onClose: () => void }) => {
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState<any[]>([]);
    const [view, setView] = useState<'list' | 'upload'>('list');
    const [error, setError] = useState<string | null>(null);
    const [authRequired, setAuthRequired] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [displayMode, setDisplayMode] = useState<'list' | 'grid'>('list');

    // Local implementation of services API
    const services = {
        api: {
            trigger: async (expansionId: string, trigger: string, context: any) => {
                try {
                    const res = await fetch(`/api/expansions?trigger=${trigger}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(context)
                    });

                    if (!res.ok) {
                        const text = await res.text();
                        try {
                            return JSON.parse(text);
                        } catch (e) {
                            return { success: false, message: res.statusText };
                        }
                    }
                    return await res.json();
                } catch (e: any) {
                    return { success: false, message: e.message };
                }
            }
        }
    };

    const fetchFiles = async (search: string = '') => {
        setLoading(true);
        setError(null);
        setAuthRequired(false);
        try {
            const result = await services.api.trigger('core-google-drive', 'list_files', {
                ...context,
                search
            });
            if (result.success && result.data) {
                setFiles(result.data);
            } else if (result.code === 'AUTH_REQUIRED') {
                setAuthRequired(true);
            } else {
                if (result.message) {
                    console.error('Drive Error:', result.message);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'list') {
            const timer = setTimeout(() => {
                fetchFiles(searchQuery);
            }, searchQuery ? 400 : 0);
            return () => clearTimeout(timer);
        }
    }, [context, view, searchQuery]);

    const attachFile = (file: any) => {
        const link = `<a href="${file.webViewLink}" target="_blank" style="color: #0f172a; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; padding: 2px 6px; font-size: 13px; font-family: inherit; line-height: 1.4; vertical-align: middle; max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            <img src="${file.iconLink}" style="width: 14px; height: 14px; flex-shrink: 0;" />
            ${file.name}
        </a>&nbsp;`;

        if (context.onInsertBody) {
            context.onInsertBody(link);
            onClose();
        } else if (context.onAppendBody) {
            context.onAppendBody(link);
            onClose();
        } else if (context.onAppendContent) {
            // Fallback for legacy
            context.onAppendContent(link);
            onClose();
        } else {
            window.open(file.webViewLink, '_blank');
            onClose();
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const reader = new FileReader();
        reader.onload = async () => {
            const base64 = (reader.result as string).split(',')[1];
            try {
                const res = await services.api.trigger('core-google-drive', 'upload_file', {
                    ...context,
                    fileName: file.name,
                    mimeType: file.type,
                    fileContent: base64
                });

                if (res.success && res.data) {
                    attachFile({
                        name: res.data.name || file.name,
                        webViewLink: res.data.webViewLink,
                        iconLink: res.data.iconLink || 'https://ssl.gstatic.com/docs/doclist/images/icon_10_generic_list.png'
                    });
                } else if (res.code === 'AUTH_REQUIRED') {
                    setAuthRequired(true);
                    setUploading(false);
                } else {
                    setError(res.message || 'Upload failed');
                    setUploading(false);
                }
            } catch (err: any) {
                setError(err.message || 'Upload error');
                setUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleLogin = () => {
        signIn('google', { callbackUrl: window.location.href });
    };

    if (authRequired) {
        return (
            <div className="bg-background rounded-lg shadow-xl w-[calc(100vw-2rem)] sm:max-w-sm flex flex-col p-6 items-center text-center gap-4">
                <div className="bg-primary/10 p-3 rounded-full">
                    <LogIn className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h3 className="font-semibold text-lg">Connect Google Drive</h3>
                    <p className="text-sm text-muted-foreground mt-1">Sign in to access and upload files.</p>
                </div>
                <button
                    onClick={handleLogin}
                    className="w-full py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
                >
                    Sign In with Google
                </button>
                <button onClick={onClose} className="text-sm text-muted-foreground hover:underline">Cancel</button>
            </div>
        );
    }

    return (
        <div className={cn(
            "bg-background rounded-lg shadow-xl w-[calc(100vw-2rem)] flex flex-col max-h-[85vh] transition-all duration-300",
            displayMode === 'grid' ? "sm:max-w-xl" : "sm:max-w-sm"
        )}>
            <div className="flex items-center justify-between p-3 ">
                <div className="flex gap-2">
                    <button
                        onClick={() => setView('list')}
                        className={`text-sm font-medium px-2 py-1 rounded transition-colors ${view === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
                    >
                        Files
                    </button>
                    <button
                        onClick={() => setView('upload')}
                        className={`text-sm font-medium px-2 py-1 rounded transition-colors ${view === 'upload' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
                    >
                        Upload
                    </button>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-muted rounded text-muted-foreground">
                    <X className="h-4 w-4" />
                </button>
            </div>

            {view === 'list' && (
                <div className="p-2 space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Search Drive..."
                                className="w-full text-sm py-1.5 pl-8 pr-3 bg-muted/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/20 border-transparent focus:border-primary/20 transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center bg-muted/50 rounded-md p-0.5 shrink-0">
                            <button
                                onClick={() => setDisplayMode('list')}
                                className={`p-1 rounded ${displayMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                title="List view"
                            >
                                <List className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setDisplayMode('grid')}
                                className={`p-1 rounded ${displayMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                title="Grid view"
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto min-h-[300px]">
                {view === 'list' ? (
                    loading && !files.length ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="animate-spin h-6 w-6 text-primary" />
                        </div>
                    ) : files.length > 0 ? (
                        <div className={cn(
                            "p-3",
                            displayMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-5 gap-3" : "flex flex-col gap-0.5"
                        )}>
                            {files.map((file) => (
                                <div key={file.id}
                                    className={cn(
                                        "cursor-pointer transition-all group",
                                        displayMode === 'grid'
                                            ? "flex flex-col items-center p-3 text-center hover:bg-muted rounded-lg"
                                            : "flex items-center gap-3 p-2.5 hover:bg-muted rounded-md"
                                    )}
                                    onClick={() => attachFile(file)}>

                                    <div className={cn(
                                        "bg-muted/50 rounded flex items-center justify-center shrink-0",
                                        displayMode === 'grid' ? "h-12 w-12 mb-2" : "h-7 w-7"
                                    )}>
                                        <img src={file.iconLink || ''} alt="" className={cn(
                                            "opacity-70 group-hover:opacity-100 transition-opacity",
                                            displayMode === 'grid' ? "h-6 w-6" : "h-4 w-4"
                                        )} />
                                    </div>

                                    <div className="flex flex-col min-w-0 w-full">
                                        <span className={cn(
                                            "font-medium truncate block",
                                            displayMode === 'grid' ? "text-[11px] px-1" : "text-sm"
                                        )}>{file.name}</span>
                                        {loading && searchQuery && displayMode === 'list' && (
                                            <span className="text-[10px] text-muted-foreground animate-pulse">Searching...</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground text-sm flex flex-col items-center gap-2">
                            <FileIcon className="h-8 w-8 opacity-20" />
                            <span>{searchQuery ? 'No matches found' : 'No recent files found'}</span>
                        </div>
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center p-8 h-full min-h-[300px]">
                        {uploading ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <span className="text-sm font-medium">Uploading to Drive...</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-6 w-full">
                                <div className="bg-primary/5 p-6 rounded-full border-2 border-dashed border-primary/20">
                                    <Upload className="h-8 w-8 text-primary" />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="font-semibold text-sm">Upload to Google Drive</p>
                                    <p className="text-xs text-muted-foreground">Select a file from your device</p>
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    id="drive-upload"
                                    onChange={handleUpload}
                                />
                                <label
                                    htmlFor="drive-upload"
                                    className="w-full flex justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 cursor-pointer transition-all shadow-sm active:scale-[0.98]"
                                >
                                    Choose File
                                </label>
                                {error && (
                                    <div className="p-2.5 bg-destructive/10 text-destructive text-[11px] rounded-md border border-destructive/20 w-full text-center">
                                        {error}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Extracted Component
const GoogleDriveComponent = ({ context }: { context: any }) => {
    const { openModal, closeModal } = useExpansionUI();

    const handleOpen = () => {
        openModal(<GoogleDriveFilesModal context={context} onClose={closeModal} />);
    };

    return (
        <button
            onClick={handleOpen}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Attach from Google Drive"
        >
            <SiGoogledrive className="h-5 w-5" />
        </button>
    );
};

// Import Settings
import { GoogleAuthSettings } from './GoogleAuthSettings';

export const GoogleDriveClientExpansion: ClientExpansion = {
    id: 'core-google-drive',
    label: 'Google Drive',
    mounts: [
        {
            point: 'COMPOSER_TOOLBAR',
            Component: ({ context }: { context: any }) => <GoogleDriveComponent context={context} />
        },
        {
            point: 'CUSTOM_SETTINGS_TAB',
            title: 'Google Drive',
            icon: SiGoogledrive,
            // @ts-ignore
            Component: GoogleAuthSettings
        }
    ]
};
