
import { Layers, Database, Cloud, Lock, Cpu } from 'lucide-react';

export default function ArchitectureDocs() {
    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-4">Architecture Deep Dive</h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                    Bloomx is designed to be <strong>headless first</strong>. It separates the email "engine" from the "interface", allowing entirely new clients to be built on top of the same diverse infrastructure.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <ArchCard
                    title="The Engine (Next.js App Router)"
                    icon={Cpu}
                    desc="Bloomx runs entirely on Next.js 14+ Server Actions and Route Handlers. It uses a mix of Edge Runtime (for speed) and Node.js Runtime (for complex parsing/AI)."
                />
                <ArchCard
                    title="The Memory (PostgreSQL)"
                    icon={Database}
                    desc="We use Prisma ORM to interact with Postgres. This ensures type safety from the DB all the way to the React Component. No more `any` types."
                />
                <ArchCard
                    title="The Store (S3/R2)"
                    icon={Cloud}
                    desc="Attachments are streamed directly to S3-compatible storage (AWS or Cloudflare R2). We generate pre-signed URLs, so your server never bottlenecks on file uploads."
                />
                <ArchCard
                    title="The Vault (Encryption)"
                    icon={Lock}
                    desc="User credentials for expansions are encrypted at rest using AES-256-CBC. Keys are derived from a master server secret, ensuring even database dumps are useless to attackers."
                />
            </div>

            <section className="space-y-6">
                <h2 className="text-2xl font-bold">The Expansion Lifecycle</h2>
                <div className="prose prose-zinc max-w-none">
                    <p>
                        When an event occurs (e.g. an email is received via Webhook), the flow is as follows:
                    </p>
                    <ol>
                        <li><strong>Ingestion</strong>: Resend POSTs to <code>/api/webhooks/resend</code>.</li>
                        <li><strong>Parsing</strong>: We use <code>simple-mail-parser</code> to extract body, headers, and attachments.</li>
                        <li><strong>Storage</strong>: Raw email is stored in Postgres; attachments streamed to R2.</li>
                        <li><strong>Expansion Trigger</strong>: The <code>ExpansionRegistry</code> checks for any expansions compliant with <code>EMAIL_RECEIVED</code>.</li>
                        <li><strong>Execution</strong>:
                            <ul>
                                <li><strong>Organizer</strong>: Classifies the email using Vercel AI SDK.</li>
                                <li><strong>Summarizer</strong>: Generates a summary if the thread is long.</li>
                                <li><strong>Webhooks</strong>: Forwards the payload to user-defined URLs if configured.</li>
                            </ul>
                        </li>
                    </ol>
                </div>
            </section>
        </div>
    );
}

function ArchCard({ title, icon: Icon, desc }: { title: string, icon: any, desc: string }) {
    return (
        <div className="p-6 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
            <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary/10 rounded-md">
                    <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{title}</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">{desc}</p>
        </div>
    )
}
