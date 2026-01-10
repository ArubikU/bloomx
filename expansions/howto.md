# BloomX Expansion System Guide

This guide explains how to create and integrate expansions into BloomX, covering both Client (UI) and Server (Logic) layers.

---

## 1. Client Expansions (`ClientExpansion`)

Client expansions are React components that run in the user's browser. They are used for UI interactions, toolbar buttons, slash commands, and editor manipulations.

### Mount Points
- `COMPOSER_TOOLBAR`: Button in the composer footer.
- `SLASH_COMMAND`: Triggered via `/` in the editor.
- `COMPOSER_OVERLAY`: UI floating above the toolbar.
- `CUSTOM_SETTINGS_TAB`: A full page in Settings.
- `SIDEBAR_PANEL`: A persistent panel in the main sidebar.

### The Client Context (`ClientExpansionContext`)
The `context` prop provides everything you need to interact with the editor:
- **Editor**: `onInsertBody()`, `onSetBody()`, `onAppendBody()`, `onUpdateSubject()`.
- **Recipients**: `onAddRecipient()`, `onUpdateTo()`, `onRemoveRecipient()`.
- **Feedback**: `onToast(msg, type)`, `onShowConfetti()`.
- **UI Actions**: `openPopover(anchor, content)`, `onClose()`.

---

## 2. Server Expansions (`Expansion`)

Server expansions run in the backend (Next.js API routes or Background workers). They handle data processing, AI generation, and scheduled tasks.

### Triggers (`ExpansionTrigger`)
- `EMAIL_RECEIVED`: Runs when a new email is fetched.
- `EMAIL_PRE_SEND`: Middleware before an email leaves the server.
- `EMAIL_POST_SEND`: Cleanup or logging after sending.
- `ORGANIZATION_CRON`: Periodic tasks (e.g. daily cleanup).
- `API`: Custom endpoints called from the client UI.

### Internal Services (`ExpansionServices`)
Server intercepts receive a `services` object to interact with the system securely:
- **`services.ai`**: Generate text using optimized BloomX prompts.
- **`services.auth`**: Get refreshed Google OAuth tokens (`getGoogleToken()`).
- **`services.storage`**: Upload files to S3/Cloud storage.
- **`services.user`**: Read/Write user settings and preferences.
- **`services.email`**: Fetch emails, update labels, or move folders.

### Example Server Intercept:
```typescript
{
    type: 'BACKGROUND',
    trigger: 'EMAIL_RECEIVED',
    execute: async (context, services) => {
        const summary = await services.ai.generate("Summarize this:", context.emailContent);
        await services.email.updateLabels(context.emailId, ['AI_SUMMARY']);
        return { success: true, data: { summary } };
    }
}
```

---

## 3. Settings & Persistence

BloomX provides built-in sync for expansion settings.

### `useExpansionSettings(id)`
Use this hook in your client components to save/load configuration.
```tsx
const { settings, saveSettings, loading } = useExpansionSettings('my-expansion-id');

// settings is automatically decrypted and synced across devices
const apiKey = settings?.apiKey;
saveSettings({ ...settings, apiKey: 'new-key' });
```

### `SettingsComponent`
Register this in your `ClientExpansion` to provide a UI in the global Settings menu.
```tsx
export const MySettings = ({ settings, onSave, saving }) => (
    <div>
        <input 
            value={settings.apiKey} 
            onChange={e => onSave({ ...settings, apiKey: e.target.value })} 
        />
        {saving && <span>Saving...</span>}
    </div>
);
```

---

## 4. UI Library Utilities

BloomX exposes premium UI utilities to keep expansions consistent:

### `useExpansionUI()` (Modals)
Trigger full-screen centered modals from anywhere.
```tsx
const { openModal, closeModal } = useExpansionUI();

openModal(
    <div className="bg-white p-6 rounded-xl shadow-2xl">
        <h2>Confirm Action</h2>
        <button onClick={closeModal}>Close</button>
    </div>
);
```

### `Popover` Component
A flexible, anchored floating box.
```tsx
<Popover 
    trigger={buttonRef} 
    isOpen={true} 
    onClose={() => setOpen(false)}
    header="My Tool"
>
    <div>Content here...</div>
</Popover>
```

---

## 5. Development Workflow

1. **Define Types**: Add your logic to `src/lib/expansions/types.ts` if adding new triggers.
2. **Implement**: Create your components in `src/components/expansions/` and your server logic in `src/lib/expansions/core/`.
3. **Register**:
    - Add to `src/lib/expansions/server.ts` for backend triggers.
    - Add to `src/lib/expansions/client/core-expansions.ts` for UI mount points.
4. **Environment Controls**: Enable/Disable via `.env`: `EXPANSION_MY_ID=true`.

---

## Best Practices
- **Isolation**: Keep expansions self-contained. Use `decryptObject` if storing sensitive keys in settings.
- **Performance**: Use the BloomX Cache (`useCache`) for expensive operations.
- **Stability**: Wrap complex editor insertions in `<div contenteditable="false">` blocks.
- **Feedback**: Always use `context.onToast` to inform the user of background actions.
