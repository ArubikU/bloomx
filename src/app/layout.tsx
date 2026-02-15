import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/components/SessionProvider'
import { ComposeProvider } from '@/contexts/ComposeContext'
import { CacheProvider } from '@/contexts/CacheContext'
import { OfflineProvider } from '@/contexts/OfflineContext'
import { ComposeWindows } from '@/components/ComposeWindows'
import { Toaster } from '@/components/ui/sonner'
import { RealTimeListener } from '@/components/RealTimeListener'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

import { headers } from 'next/headers';

export async function generateMetadata(): Promise<Metadata> {
    const headersList = await headers();
    const host = process.env.TOP_DOMAIN || headersList.get('x-forwarded-host') || headersList.get('host') || '';
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.bloomx.arubik.dev';

    try {
        const targetUrl = new URL(`${backendUrl}/api/config`);
        if (host) targetUrl.searchParams.set('domain', host.split(':')[0]);

        const res = await fetch(targetUrl.toString(), {
            headers: {
                'x-forwarded-host': host,
            },
            next: { revalidate: 60 }
        });

        if (!res.ok) {
            return {
                title: 'BloomX Mail',
                description: 'Serverless mail client'
            };
        }

        const data = await res.json();
        const config = data.config;

        return {
            title: config?.displayName || config?.name || 'BloomX Mail',
            description: 'Serverless mail client',
            icons: config?.logo ? [
                { rel: 'icon', url: config.logo },
                { rel: 'shortcut icon', url: config.logo },
                { rel: 'apple-touch-icon', url: config.logo }
            ] : undefined
        };
    } catch (e) {
        console.error("Metadata generation failed:", e);
        return {
            title: 'BloomX Mail',
            description: 'Serverless mail client'
        };
    }
}

import { ExpansionUIProvider } from '@/contexts/ExpansionUIContext';
import { ThemeProvider } from '@/components/ThemeProvider';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className="light" suppressHydrationWarning>
            <body className={`${inter.variable} font-sans antialiased bg-white text-slate-900`}>
                <SessionProvider>
                    <ComposeProvider>
                        <CacheProvider>
                            <OfflineProvider>
                                <ExpansionUIProvider>
                                    <ThemeProvider>
                                        {children}
                                    </ThemeProvider>
                                    <RealTimeListener />
                                    <ComposeWindows />
                                    <Toaster />
                                </ExpansionUIProvider>
                            </OfflineProvider>
                        </CacheProvider>
                    </ComposeProvider>
                </SessionProvider>
            </body>
        </html>
    )
}
