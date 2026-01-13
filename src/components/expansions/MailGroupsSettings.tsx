'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';

interface MailGroupsSettingsProps {
    settings: {
        groups?: Array<{ name: string, emails: string }>;
    };
    onSave: (settings: any) => void;
}

export function MailGroupsSettings({ settings, onSave }: MailGroupsSettingsProps) {
    const [groups, setGroups] = useState<Array<{ name: string, emails: string }>>(
        settings?.groups || []
    );

    // Sync from props (external source)
    useEffect(() => {
        if (settings?.groups) {
            setGroups(settings.groups);
        }
    }, [settings?.groups]);

    // Sync to parent (save)
    useEffect(() => {
        onSave({ groups });
    }, [groups, onSave]);

    const addGroup = () => {
        setGroups([...groups, { name: '@team', emails: '' }]);
    };

    const removeGroup = (index: number) => {
        setGroups(groups.filter((_, i) => i !== index));
    };

    const updateGroup = (index: number, field: 'name' | 'emails', value: string) => {
        const newGroups = [...groups];
        newGroups[index] = { ...newGroups[index], [field]: value };
        setGroups(newGroups);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Mail Groups
                </label>
                <button
                    onClick={addGroup}
                    className="inline-flex items-center justify-center gap-1 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 h-7 px-2 transition-colors"
                >
                    <Plus className="h-3 w-3" />
                    Add Group
                </button>
            </div>

            <div className="space-y-3">
                {groups.length === 0 && (
                    <div className="text-sm text-muted-foreground italic text-center py-4 border border-dashed rounded-md">
                        No groups defined. Click "Add Group" to create one.
                    </div>
                )}
                {groups.map((group, i) => (
                    <div key={i} className="flex gap-2 items-start p-3 rounded-md bg-muted/90 group-hover:bg-muted/20 transition-colors">
                        <div className="grid gap-2 flex-1">
                            <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                                <label className="text-xs font-medium text-muted-foreground text-right">Alias</label>
                                <input
                                    value={group.name}
                                    onChange={(e) => updateGroup(i, 'name', e.target.value)}
                                    placeholder="@myteam"
                                    className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-[100px_1fr] gap-2 items-start">
                                <label className="text-xs font-medium text-muted-foreground text-right pt-2">Emails</label>
                                <textarea
                                    value={group.emails}
                                    onChange={(e) => updateGroup(i, 'emails', e.target.value)}
                                    placeholder="alice@example.com, bob@example.com"
                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                                />
                            </div>
                        </div>
                        <button
                            onClick={() => removeGroup(i)}
                            className="text-muted-foreground hover:text-destructive p-1"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
            <p className="text-xs text-muted-foreground">
                Type the alias (e.g. <strong>@team</strong>) in the To/Cc/Bcc fields and press Enter to expand.
            </p>
        </div>
    );
}
