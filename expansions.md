# 🧩 Bloomx Expansions

Expansions extend the functionality of the Bloomx email engine, adding integrations, AI features, and UI enhancements. They can be enabled or disabled via Environment Variables, and many now support per-user configuration via the Settings UI.

## 🌟 Top-Level Integrations

These expansions provide deep integration with external tools and are fully configurable via the **Settings -> Expansions** tab.

| Expansion | ID | Env Variable | Features | Mount Points |
| :--- | :--- | :--- | :--- | :--- |
| **Giphy** | `core-giphy` | `EXPANSION_CORE_GIPHY` | Insert GIFs. **New**: Resizable UI & Pagination. | `SLASH_COMMAND`, `SETTINGS` |
| **Notion** | `core-notion` | `EXPANSION_CORE_NOTION` | Save emails to Notion databases. | `EMAIL_TOOLBAR`, `SETTINGS` |
| **Slack** | `core-slack` | `EXPANSION_CORE_SLACK` | Share email content to Slack channels. | `EMAIL_TOOLBAR`, `SETTINGS` |
| **Trello** | `core-trello` | `EXPANSION_CORE_TRELLO` | Create Trello cards from emails. | `EMAIL_TOOLBAR`, `SETTINGS` |
| **HubSpot** | `core-hubspot` | `EXPANSION_CORE_HUBSPOT` | Create/Link contacts in HubSpot CRM. | `EMAIL_TOOLBAR`, `SETTINGS` |
| **Zoom** | `core-zoom` | `EXPANSION_CORE_ZOOM` | **v2.1**: Elegant "Smart Chips". UI-driven meeting creation. | `COMPOSER_TOOLBAR`, `SETTINGS`, `SLASH_COMMAND` |
| **Calendar** | `core-calendar` | `EXPANSION_CORE_CALENDAR` | **v2.1**: "Smart Chips" & ICS generation UI. | `COMPOSER_TOOLBAR`, `SETTINGS`, `SLASH_COMMAND` |

### 🔒 Security & Configuration

**v2.0+**: Sensitive credentials (API Keys, Tokens) are encrypted using **AES-256** server-side before storage in the cloud. Users can provide their own credentials in the Settings panel for private expansions.

---

## 🤖 AI & Utilities

| Expansion | Features | Env Variable | Default |
| :--- | :--- | :--- | :--- |
| **Organizer** | Auto-categorizes emails (Newsletters, Receipts, etc.) | `EXPANSION_CORE_ORGANIZER` | `true` |
| **Summarizer** | Generates concise summaries of long threads | `EXPANSION_CORE_SUMMARIZER` | `true` |
| **Smart Reply** | Suggests quick AI-generated responses | `EXPANSION_CORE_SMART_REPLY` | `true` |
| **Composer Helper** | AI writing assistant in the composer | `EXPANSION_CORE_COMPOSER_HELPER` | `true` |
| **Translator** | Auto-translates foreign emails to English | `EXPANSION_CORE_TRANSLATOR` | `true` |
| **Google Drive** | Quickly attach recent Drive files | `EXPANSION_CORE_GOOGLE_DRIVE` | `true` |

---

## 🚀 Recent Improvements

### Resizable Composer (Desktop)
The composer modal now supports **active resizing**. Hover over the top or left edges to stretch the window to your preference. This state is maintained during your session.

### Expansion Context 2.0
Expansions now have direct access to more powerful actions:
- `onUpdateSubject(text)`: Change the email subject dynamically.
- `onAddRecipient(email, type)`: Programmatically add recipients.
- `onShowConfetti()`: Trigger a celebratory effect for successful integrations.
- `onToast(msg, type)`: Show native notifications from within an expansion.

---

## 🛠️ Developer Notes

### Mount Points
*   `EMAIL_TOOLBAR`: Top action bar in MailView.
*   `COMPOSER_TOOLBAR`: Footer of the compose modal.
*   `SLASH_COMMAND`: Triggered via `/` in the editor.
*   `COMPOSER_OVERLAY`: Floating UI above the toolbar.
*   `COMPOSER_INIT`: Headless logic (e.g. signatures/auto-expand tags).
*   `CUSTOM_SETTINGS_TAB`: Dedicated configuration tabs.

### Expansion Services (Server)
Server-side intercepts (`DLP`, `Summarizer`) use `ExpansionServices` for:
- **`services.ai`**: LLM access.
- **`services.auth`**: Token management.
- **`services.storage`**: File handling.
- **`services.email`**: Database access.

### Encryption
The `encryption.ts` library ensures that `user.expansionSettings` are always encrypted at rest.
- **Method**: AES-256-CBC
- **Key**: Derived from `DATA_ENCRYPTION_KEY`.
