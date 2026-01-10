import { ExpansionServices } from './types';
import { prisma } from '@/lib/prisma';
import { generateText } from '@/lib/ai';
import { decryptObject } from '@/lib/encryption';

export class DefaultExpansionServices implements ExpansionServices {
    user = {
        getIdByEmail: async (email: string) => {
            const user = await prisma.user.findUnique({
                where: { email },
                select: { id: true }
            });
            return user?.id || null;
        },


        getSettings: async (userId: string) => {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { expansionSettings: true }
            });
            const raw = user?.expansionSettings || {};
            return decryptObject(raw);
        },
        updateSettings: async (userId: string, settings: any) => {
            await prisma.user.update({
                where: { id: userId },
                data: { expansionSettings: settings }
            });
        }
    };

    email = {
        findUnlabelled: async (userId: string, limit: number) => {
            return await prisma.email.findMany({
                where: {
                    userId: userId,
                    labels: { none: {} },
                    folder: { notIn: ['trash', 'spam', 'sent', 'drafts'] }
                } as any,
                take: limit,
                select: { id: true, subject: true, snippet: true, from: true }
            });
        },
        updateLabels: async (emailId: string, labelIds: string[]) => {
            await prisma.email.update({
                where: { id: emailId },
                data: {
                    labels: {
                        connect: labelIds.map(id => ({ id }))
                    }
                }
            });
        },
        getById: async (id: string) => {
            return await prisma.email.findUnique({ where: { id } });
        }
    };

    label = {
        upsert: async (userId: string, name: string, color?: string) => {
            const safeLabel = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
            return await prisma.label.upsert({
                where: {
                    userId_name: { userId, name: safeLabel }
                },
                update: {},
                create: {
                    name: safeLabel,
                    userId,
                    color: color || '#888888'
                },
                select: { id: true }
            });
        }
    };

    ai = {
        generate: async (system: string, prompt: string, options?: any) => {
            return await generateText({
                system,
                prompt,
                ...options
            });
        }
    };

    env = {
        get: (key: string) => {
            // Allow-list for safe keys.
            const SAFE_KEYS = ['GOOGLE_CLIENT_ID', 'NEXT_PUBLIC_APP_URL', 'RESEND_API_KEY'];
            if (SAFE_KEYS.includes(key) || key.startsWith('EXPANSION_')) {
                return process.env[key];
            }
            return undefined;
        }
    };

    auth = {
        getGoogleToken: async (userId: string) => {
            try {
                // @ts-ignore
                const account = await prisma.account.findFirst({
                    where: {
                        userId: userId,
                        provider: 'google'
                    },
                    select: {
                        id: true,
                        access_token: true,
                        refresh_token: true,
                        expires_at: true
                    }
                });

                if (!account) return null;

                // Check expiration (expires_at is in Seconds)
                // Give a 5 minute buffer (300 seconds)
                const nowSeconds = Math.floor(Date.now() / 1000);
                const isExpired = !account.expires_at || (account.expires_at < nowSeconds + 300);

                if (isExpired) {
                    if (!account.refresh_token) {
                        console.warn('Google token expired and no refresh token available for user', userId);
                        return null; // Force re-login
                    }

                    // Refresh token logic
                    const clientId = process.env.GOOGLE_CLIENT_ID;
                    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

                    if (!clientId || !clientSecret) {
                        console.error('Missing Google Client ID/Secret for token refresh');
                        return null;
                    }

                    const response = await fetch("https://oauth2.googleapis.com/token", {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: new URLSearchParams({
                            client_id: clientId,
                            client_secret: clientSecret,
                            grant_type: "refresh_token",
                            refresh_token: account.refresh_token,
                        }),
                    });

                    const tokens = await response.json();

                    if (!response.ok) {
                        console.error("Failed to refresh Google token", tokens);
                        return null;
                    }

                    if (!tokens.access_token) return null;

                    // Calculate new expires_at
                    const newExpiresAt = Math.floor(Date.now() / 1000 + tokens.expires_in);

                    // Update DB
                    // @ts-ignore
                    await prisma.account.update({
                        where: { id: account.id },
                        data: {
                            access_token: tokens.access_token,
                            expires_at: newExpiresAt,
                            ...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {})
                        }
                    });

                    return tokens.access_token;
                }

                return account.access_token || null;
            } catch (e) {
                console.error('Failed to get google token', e);
                return null;
            }
        },
        isGoogleLinked: async (userId: string) => {
            try {
                // @ts-ignore
                const count = await prisma.account.count({
                    where: {
                        userId: userId,
                        provider: 'google'
                    }
                });
                return count > 0;
            } catch (e) {
                return false;
            }
        }
    };

    storage = {
        upload: async (key: string, body: Buffer | string | ReadableStream, contentType: string) => {
            // Lazy load to avoid circular deps if any, or just direct import
            const { uploadToStorage } = await import('@/lib/storage');
            return await uploadToStorage(key, body, contentType);
        },
        getSignedUrl: async (key: string) => {
            const { getSignedDownloadUrl } = await import('@/lib/storage');
            return await getSignedDownloadUrl(key);
        }
    };
}
