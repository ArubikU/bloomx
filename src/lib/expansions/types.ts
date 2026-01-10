export type ExpansionTrigger =
    | 'EMAIL_RECEIVED'          // Background: When email arrives
    | 'EMAIL_VIEW_TOOLBAR'       // UI: Toolbar button in MailView
    | 'EMAIL_VIEW_SIDEBAR'       // UI: Sidebar panel
    | 'COMPOSER_TOOLBAR'         // UI: Button in composer
    | 'EMAIL_COMPOSER'           // UI: Composer context
    | 'ORGANIZATION_CRON'        // Background: Scheduled task
    | 'EMAIL_PRE_SEND'           // Middleware: Before sending
    | 'EMAIL_POST_SEND';         // Background: After sending success

export type ExpansionType =
    | 'ACTION'           // Simple button -> Action
    | 'PANEL'            // Button -> Sidebar/Modal
    | 'BACKGROUND'       // Invisible hook
    | 'MIDDLEWARE';      // Intervention/Blocker

export interface ExpansionContext {
    emailId?: string;
    emailContent?: string;
    userEmail?: string;
    userId?: string;
    data?: any; // Generic payload for API triggers
    to?: string | string[]; // Added: Recipients for Pre-Send checks
    subject?: string;       // Added: Subject for Pre-Send checks
    sentEmail?: any;        // Added: Full email object for Post-Send hooks
    // Add more context as needed
}

export interface ExpansionResult {
    success: boolean;
    message?: string;
    code?: string; // e.g. 'AUTH_REQUIRED'
    data?: any; // e.g. summary text, smart replies array
    stop?: boolean; // Signal to halt the pipeline
}



export interface ExpansionServices {
    user: {
        getIdByEmail(email: string): Promise<string | null>;
        getSettings(userId: string): Promise<any>;
        updateSettings(userId: string, settings: any): Promise<void>;
    };
    email: {
        findUnlabelled(userId: string, limit: number): Promise<any[]>;
        updateLabels(emailId: string, labelIds: string[]): Promise<void>;
        getById(id: string): Promise<any | null>;
    };
    label: {
        upsert(userId: string, name: string, color?: string): Promise<{ id: string }>;
    };
    ai: {
        generate(system: string, prompt: string, options?: any): Promise<string>;
    };
    env: {
        get(key: string): string | undefined;
    };
    auth: {
        getGoogleToken(userId: string): Promise<string | null>;
        isGoogleLinked(userId: string): Promise<boolean>;
    };
    storage: {
        upload(key: string, body: Buffer | string | ReadableStream, contentType: string): Promise<string>;
        getSignedUrl(key: string): Promise<string | null>;
    };
}

export type InterceptType = 'API' | 'BACKGROUND' | 'CRON' | 'BLOCKING';

export interface ExpansionIntercept {
    type: InterceptType;
    trigger: string; // e.g. 'summarize', 'daily_cleanup'
    schedule?: string; // e.g. '0 * * * *' (Cron expression)
    execute: (context: ExpansionContext, services: ExpansionServices) => Promise<ExpansionResult>;
}

export interface Expansion {
    id: string;
    name: string;
    description: string;
    icon?: string; // Default icon

    // Authorization/Gatekeeping
    permissions?: string[]; // e.g., ['read:email', 'write:email']

    // Flexible points of interception
    intercepts: ExpansionIntercept[];
}
