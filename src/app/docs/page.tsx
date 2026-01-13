import Link from 'next/link';
import { BadgeCheck, Zap, Globe, Lock, ArrowRight, Layers } from 'lucide-react';

export default function DocsIntroduction() {
    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Header */}
            <div className="space-y-4 border-b pb-10">
                <div className="flex items-center gap-2 text-primary font-medium text-sm">
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">v2.1.0</span>
                    <span>Documentation</span>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Bloomx Documentation</h1>
                <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
                    Welcome to the definitive guide for <strong>Bloomx</strong>. Learn how to configure your headless email engine, build custom AI expansions, and deploy to serverless infrastructure.
                </p>
                <div className="flex gap-4 pt-4">
                    <Link href="/docs/expansions" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors">
                        Explore Expansions <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link href="/docs/api" className="inline-flex items-center gap-2 px-5 py-2.5 bg-muted text-foreground font-medium rounded-md hover:bg-muted/80 transition-colors border">
                        API Reference
                    </Link>
                </div>
            </div>

            {/* Core Pillars */}
            <div className="grid md:grid-cols-2 gap-8">
                <FeatureCard
                    icon={Globe}
                    title="Universal Inbox"
                    desc="A unified, distraction-free interface for all your email accounts. Supports Gmail, Outlook, and custom IMAP."
                />
                <FeatureCard
                    icon={Zap}
                    title="AI Native"
                    desc="Built from the ground up with Vercel AI SDK. Smart replies, auto-summarization, and semantic search are standard."
                />
                <FeatureCard
                    icon={Layers}
                    title="Headless & Extensible"
                    desc="Don't like the UI? Use our REST API. Need a custom workflow? Write an Expansion in TypeScript."
                />
                <FeatureCard
                    icon={Lock}
                    title="Private & Secure"
                    desc="Zero-trust architecture. Credentials are AES-256 encrypted. You own your data in your own Postgres database."
                />
            </div>

            {/* Quick Start Links */}
            <div className="space-y-6 pt-8">
                <h2 className="text-2xl font-bold tracking-tight">Rapid Access</h2>
                <div className="grid sm:grid-cols-3 gap-4">
                    <Link href="/docs/expansions" className="group p-4 border rounded-lg hover:border-primary/50 hover:bg-accent/50 transition-all">
                        <h3 className="font-semibold group-hover:text-primary transition-colors mb-1">Browse Expansions</h3>
                        <p className="text-sm text-muted-foreground">See what's possible with plugins.</p>
                    </Link>
                    <Link href="/docs/architecture" className="group p-4 border rounded-lg hover:border-primary/50 hover:bg-accent/50 transition-all">
                        <h3 className="font-semibold group-hover:text-primary transition-colors mb-1">Architecture</h3>
                        <p className="text-sm text-muted-foreground">Understanding the stack.</p>
                    </Link>
                    <Link href="/docs/api" className="group p-4 border rounded-lg hover:border-primary/50 hover:bg-accent/50 transition-all">
                        <h3 className="font-semibold group-hover:text-primary transition-colors mb-1">API Reference</h3>
                        <p className="text-sm text-muted-foreground">Enderspoints and schemas.</p>
                    </Link>
                </div>
            </div>
        </div>
    );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
    return (
        <div className="flex gap-4 p-6 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
            <div className="shrink-0">
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <div className="space-y-1">
                <h3 className="font-semibold leading-none">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
        </div>
    )
}
