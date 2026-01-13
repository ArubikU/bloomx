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

export const metadata: Metadata = {
    title: 'Bloomx Mail',
    description: 'Serverless mail client',
}

import { ExpansionUIProvider } from '@/contexts/ExpansionUIContext';

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
                                    {children}
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
