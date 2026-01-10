# 🌸 Bloomx

> **The Headless AI Email Engine.**
> 100% Open Source. Serverless. Extensible.

Bloomx is not just a mail client. It's a **programmable messaging infrastructure** designed for developers who want full control over their email experience. Built for the **Vercel** ecosystem (but deployable anywhere), it combines modern stack choices with powerful AI capabilities to give you:

- **Universal Inbox**: Clean, unified interface for all your emails.
- **AI-Powered**: Auto-categorization, summarization, smart replies, and more.
- **Headless & API-First**: Build your own frontend or use our robust API.
- **Expansion Engine**: Plugin system to hook into email events (webhooks, cron, UI buttons).

![Bloomx Banner](bloomx_banner.png)

## 🚀 Features

- **📨 Headless Email**: Send and receive via simple REST APIs.
- **🧠 AI Core**: Plug-and-play support for OpenAI, Gemini, Anthropic, and Cohere.
- **🔌 Expansions**: Create custom workflows (e.g., "Add to Notion", "Slack Alert") with full UI/Backend access.
- **📏 Resizable UI**: A premium, customizable desktop experience with resizable composer windows.
- **🛡️ Privacy Focused**: Your data, your database (Postgres), your storage (S3/R2).
- **⚡ Serverless Ready**: Optimized for Next.js 15+ App Router.
- **🔍 Full Text Search**: PostgreSQL-based search for instant results.
- **🎉 Context Actions**: Integrated "Confetti", "Toast", and "Live Recipient" manipulation for expansions.

## 🛠️ Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **Database**: PostgreSQL (Prisma ORM)
- **Storage**: S3-compatible (AWS S3, Cloudflare R2, Backblaze B2, MinIO)
- **Email Provider**: Resend (Inbound Webhooks + Outbound API)
- **AI SDK**: Vercel AI SDK

## 📦 One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Farubiku%2Fbloomx&env=DATABASE_URL,RESEND_API_KEY,REGISTRATION_SECRET,AI_KEY)

## 🔧 Configuration

Bloomx is configured entirely via Environment Variables. See `.env.example` for details.

### Required
- `DATABASE_URL`: Connection string for PostgreSQL.
- `RESEND_API_KEY`: API Key from Resend.com.
- `REGISTRATION_SECRET`: Secret token to allow new user registration.

### Storage (S3 Compatible, B2 Compatible)
- `S3_ENDPOINT` || `B2_ENDPOINT`
- `S3_REGION` || `B2_REGION`
- `S3_ACCESS_KEY` || `B2_ACCESS_KEY`
- `S3_SECRET_KEY` || `B2_SECRET_KEY`
- `S3_BUCKET` || `B2_BUCKET`

### AI Capabilities
- `AI_PROVIDER`: `openai`, `gemini`, `anthropic`, `cohere`
- `AI_KEY`: Your API Key.

## 🧩 Expansions

Expansions are the heart of Bloomx. They allow you to:
1. **Intercept** events (email received, cron job, UI interaction).
2. **Execute** custom logic (call fetch, db, AI).
3. **Render** custom UI (buttons, sidebars, modals).

[View Full List of Expansions & Configuration](./expansions.md)

Located in `src/lib/expansions`.

## 🤝 Contributing

We love open source! Please read `CONTRIBUTING.md` (coming soon) for details.

## 📄 License

MIT © Kynto Group
