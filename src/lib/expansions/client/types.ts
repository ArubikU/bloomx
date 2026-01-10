import React from 'react';

export type ClientExpansionMountPoint = 'COMPOSER_OVERLAY' | 'SIDEBAR_PANEL' | 'EMAIL_TOOLBAR' | 'EMAIL_FOOTER' | 'SIDEBAR_HEADER' | 'COMPOSER_INIT' | 'COMPOSER_TOOLBAR' | 'EMAIL_HEADER' | 'SIDEBAR_FOOTER' | 'SETTINGS_TAB' | 'CUSTOM_SETTINGS_TAB' | 'SLASH_COMMAND';

// ...

mounts: Array<{
    point: ClientExpansionMountPoint;
    Component: React.ComponentType<{ context: ClientExpansionContext }>;
    title?: string; // For CUSTOM_SETTINGS_TAB
    icon?: any; // React Component for tab icon
    slashCommand?: {
        key: string;
        description: string;
        arguments?: string; // e.g. "topic duration"
    };
}>;

export interface ClientExpansionContext {
    // Context provided to the component
    emailId?: string;
    emailContent?: string;
    subject?: string;
    to?: string[];
    cc?: string[];
    bcc?: string[];

    // Actions provided to the component
    onUpdateBody?: (content: string) => void;
    onSetBody?: (content: string) => void;
    onAppendBody?: (content: string) => void;
    onPrependBody?: (content: string) => void;
    onInsertBody?: (content: string) => void;
    onUpdateSubject?: (subject: string) => void;
    onUpdateSummary?: (content: string) => void;
    onUpdateSuggestions?: (suggestions: string[]) => void;
    onUpdateTo?: (recipients: string[]) => void;
    onUpdateCc?: (recipients: string[]) => void;
    onUpdateBcc?: (recipients: string[]) => void;
    onAddRecipient?: (email: string, type?: 'to' | 'cc' | 'bcc') => void;
    onRemoveRecipient?: (email: string, type?: 'to' | 'cc' | 'bcc') => void;
    addAttachment?: (attachment: any) => void;

    // Lifecycle & Middleware
    registerBeforeSend?: (handler: (details: { to: string[], subject: string, body: string, cc: string[], bcc: string[] }) => Promise<{ body?: string, stop?: boolean } | void>) => void;

    // UI Actions
    openPopover?: (anchor: HTMLElement | DOMRect, content: React.ReactNode, options?: { width?: number | string, header?: boolean }) => void;
    openOverlay?: (content: React.ReactNode) => void;
    uploadAttachment?: (file: File) => Promise<any>;
    onClose?: () => void;
    onToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
    onShowConfetti?: () => void;
    [key: string]: any;
}

export interface ClientExpansion {
    id: string; // Matches Server Expansion ID if paired

    // Multiple mount points supported
    mounts: Array<{
        point: ClientExpansionMountPoint;
        Component?: React.ComponentType<{ context: ClientExpansionContext }>;
        execute?: (context: ClientExpansionContext) => void;
        title?: string; // For CUSTOM_SETTINGS_TAB
        icon?: any; // React Component for tab icon
        slashCommand?: {
            key: string;
            description: string;
            arguments?: string;
        };
    }>;

    // Configurable Settings Interface
    SettingsComponent?: React.ComponentType<{
        settings: any;
        onSave: (newSettings: any) => Promise<void> | void;
        saving?: boolean;
    }>;
    defaultSettings?: any;
    label?: string; // For the settings list
}
