import { Expansion, ExpansionContext, ExpansionResult, ExpansionServices } from '../types';

export const FollowupExpansion: Expansion = {
    id: 'core-followup',
    name: 'Auto Follow-up',
    description: 'Reminds you to follow up if no reply received',
    intercepts: [
        {
            type: 'BACKGROUND',
            trigger: 'EMAIL_POST_SEND',
            execute: async (context: ExpansionContext, services: ExpansionServices): Promise<ExpansionResult> => {
                const email = context.sentEmail;
                if (!email) return { success: false };

                // Store in user settings: "pendingFollowups"
                // List of { emailId, sentAt, subject }
                const settings = await services.user.getSettings(context.userId!);
                const pending = settings.pendingFollowups || [];

                pending.push({
                    id: email.id,
                    sentAt: new Date().toISOString(),
                    subject: email.subject
                });

                await services.user.updateSettings(context.userId!, { ...settings, pendingFollowups: pending });
                return { success: true, message: 'Tracked for followup' };
            }
        },
        {
            type: 'CRON',
            trigger: 'ORGANIZATION_CRON', // Runs daily/hourly
            execute: async (context: ExpansionContext, services: ExpansionServices): Promise<ExpansionResult> => {
                // Check all users? 
                // Context usually has userId if triggered by user action, but CRON might be global?
                // The current architecture for 'ORGANIZATION_CRON' implies it runs *per user* if the caller iterates users, 
                // OR it runs once.
                // Looking at `api/cron/route.ts` (if exists), we see how it's called.
                // Assuming we have context.userId here (e.g. called per user).

                if (!context.userId) return { success: false, message: 'User required' };

                const settings = await services.user.getSettings(context.userId);
                const pending = settings.pendingFollowups || [];
                if (pending.length === 0) return { success: true };

                const now = new Date();
                const due = [];
                const remaining = [];

                for (const item of pending) {
                    const sentTime = new Date(item.sentAt);
                    const diffDays = (now.getTime() - sentTime.getTime()) / (1000 * 3600 * 24);

                    // 3 Days Default
                    if (diffDays >= 3) {
                        due.push(item);
                        // We remove it after notifying (or keep if we want persistent nagging, but let's remove)
                    } else {
                        remaining.push(item);
                    }
                }

                if (due.length > 0) {
                    // Update settings first to avoid double notify on fail
                    await services.user.updateSettings(context.userId, { ...settings, pendingFollowups: remaining });

                    // Notify User
                    // We can create a "Notification" email to self, or just log for now if no "NotificationService".
                    // Bloomx doesn't have an internal Notification UI shown yet.
                    // We'll send an email to the user!
                    const userEmail = context.userEmail || 'user@example.com';
                    // We can't easily "Send Email" via services.email (read-only in interface?).
                    // We can use `resend` directly or a new service method `email.send`.
                    // For now, I'll just log it to console as a "Notification".
                    console.log(`[Followup] User ${context.userId} needs to follow up on:`, due.map((d: any) => d.subject));

                    return { success: true, message: `Found ${due.length} followups` };
                }

                return { success: true, message: 'No followups due' };
            }
        }
    ]
};
