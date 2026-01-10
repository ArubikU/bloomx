# BloomX Expansion System Guide

This guide explains how to create and integrate expansions into BloomX, covering Client (UI), Server (Middleware), and persistent configuration.

---

## 1. Client Expansions

Client expansions inject components into the BloomX UI.

### Mount Points
- `COMPOSER_TOOLBAR`: Bottom bar of the composer.
- `SLASH_COMMAND`: Triggered via `/` in the editor.
- `COMPOSER_OVERLAY`: UI above the toolbar (AI prompts, helpers).
- `CUSTOM_SETTINGS_TAB`: A dedicated tab in **Settings -> Expansions**.
- `EMAIL_TOOLBAR`: Action bar when viewing an email.

### The Client Context (`ClientExpansionContext`)
The `context` object is passed to every expansion component.

#### Editor Manipulation
- `onInsertBody(html)`: Inserts content at cursor.
- `onAppendBody(html)`: Adds content to footer.
- `onSetBody(html)`: Replaces entire body.
- `onUpdateSubject(val)`: Updates the subject line.

#### Recipient Management
- `onAddRecipient(email, type)`: Adds email to `to`, `cc`, or `bcc`.
- `onRemoveRecipient(email, type)`: Removes email from fields.

#### UI Utilities (Pro)
- `onToast(msg, type)`: Native BloomX notifications.
- `onShowConfetti()`: 🎉 Celebrate successful actions!
- **`openPopover(rect, content, options)`**: Launch anchored floating UIs.

**Example `openPopover` Usage:**
```tsx
const handleOpen = () => {
    if (!buttonRef.current || !context.openPopover) return;
    const rect = buttonRef.current.getBoundingClientRect();

    context.openPopover(rect, (
        <GiphySelector context={context} />
    ), { width: 320, header: false });
};
```

---

## 2. Server Expansions

Server expansions intercept email flows or provide background services.

### Triggers
- `EMAIL_RECEIVED`: Process incoming mail (e.g., auto-labeling).
- `EMAIL_PRE_SEND`: Validate or modify mail before it leaves.
- `ORGANIZATION_CRON`: Periodic cleanup or sync tasks.

### Expansion Services
The `services` object provides secure access to:
- `services.ai`: Optimized LLM prompts.
- `services.auth`: Securely access refreshed OAuth tokens.
- `services.storage`: Upload/Download from private user storage.
- `services.email`: Direct Prisma access to the email store.

---

## 3. Persistent Settings

BloomX handles AES-256 encryption and cross-device sync for expansion settings automatically.

### `useExpansionSettings(id)`
Hook for reading/writing configuration in your components.
```tsx
const { settings, saveSettings, loading } = useExpansionSettings('core-my-tool');

const apiKey = settings?.apiKey;
saveSettings({ ...settings, lastUsed: Date.now() });
```

### `SettingsComponent`
Define a UI for the global Settings menu:
```tsx
export const MySettingsUI = ({ settings, onSave, saving }) => (
    <div className="space-y-4">
        <label>API Key</label>
        <input 
            value={settings.apiKey || ''} 
            onChange={e => onSave({ ...settings, apiKey: e.target.value })} 
        />
        {saving && <p>Syncing to cloud...</p>}
    </div>
);
```

---

## 4. Best Practices

1. **Isolation**: Wrap complex HTML (like cards) in `<div contenteditable="false">` to protect them from manual edits.
2. **Execute Order**: For Slash Commands, *always* call `context.execute()` before inserting body content to clean up the query text.
3. **Icons**: Use `lucide-react` for a native look.
4. **Spacing**: Add `<br/>` or `&nbsp;` after inserting blocks to ensure the user has a place to click and continue typing.
