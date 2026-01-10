import { useEffect, useState } from 'react';
import { ClientExpansion, ClientExpansionContext } from '@/lib/expansions/client/types';
import { Editor } from '../Editor';
import { useExpansionSettings } from '@/hooks/useExpansionSettings';

const SignatureComponent = ({ context }: { context: ClientExpansionContext }) => {
    const { settings, loading } = useExpansionSettings('core-signature');

    useEffect(() => {
        if (loading) return;

        if (settings && settings.content) {
            if (context.onAppendBody) {
                context.onAppendBody(settings.content);
            } else if (context.onAppendContent) {
                context.onAppendContent(settings.content);
            }
        }
    }, [settings, loading, context]);

    return null; // Invisible component
};

const SignatureSettings = ({ settings, onSave, saving }: { settings: any, onSave: (s: any) => Promise<void> | void, saving?: boolean }) => {
    const [content, setContent] = useState(settings?.content || '');

    const handleSave = async () => {
        await onSave({ ...settings, content });
    };

    return (
        <div className="space-y-4">
            <div className="rounded-md min-h-[150px] border bg-background">
                <Editor
                    value={content}
                    onChange={setContent}
                    simple={true}
                    context={null}
                />
            </div>
            <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                    This signature will be automatically added to new emails.
                </p>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Signature'}
                </button>
            </div>
        </div>
    );
};

export const SignatureClientExpansion: ClientExpansion = {
    id: 'core-signature',
    mounts: [{
        point: 'COMPOSER_INIT',
        Component: SignatureComponent
    }],
    label: 'Email Signature',
    SettingsComponent: SignatureSettings,
    defaultSettings: { content: '' }
};
