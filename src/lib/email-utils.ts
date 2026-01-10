/**
 * Email normalization utilities for Gmail-style aliasing
 */

/**
 * Normalizes an email address by removing dots and plus-tags from the local part
 * Examples:
 * - john.doe@example.com -> johndoe@example.com
 * - john+tag@example.com -> john@example.com
 * - john.doe+tag@example.com -> johndoe@example.com
 */
export function normalizeEmailAddress(email: string): string {
    const [localPart, domain] = email.toLowerCase().split('@');

    if (!domain) return email.toLowerCase();

    // Remove dots from local part
    let normalized = localPart.replace(/\./g, '');

    // Remove everything after and including the first '+'
    const plusIndex = normalized.indexOf('+');
    if (plusIndex !== -1) {
        normalized = normalized.substring(0, plusIndex);
    }

    return `${normalized}@${domain}`;
}

/**
 * Checks if an email belongs to the configured TOP_DOMAIN
 */
export function isValidDomain(email: string): boolean {
    const topDomain = process.env.TOP_DOMAIN;
    if (!topDomain) return true; // No domain restriction if not configured

    const domain = email.toLowerCase().split('@')[1];
    return domain === topDomain.toLowerCase();
}

/**
 * Extracts the domain from an email address
 */
export function extractDomain(email: string): string | null {
    const parts = email.split('@');
    return parts.length === 2 ? parts[1] : null;
}

/**
 * Parses an email string in the format "Name <email@domain.com>" or just "email@domain.com"
 * Returns { name, email }
 */
export function parseEmailAddress(emailString: string): { name: string | null; email: string } {
    const match = emailString.match(/^(.+?)\s*<(.+?)>$/);

    if (match) {
        return {
            name: match[1].trim(),
            email: match[2].trim()
        };
    }

    return {
        name: null,
        email: emailString.trim()
    };
}

/**
 * Formats an email address as "Name <email@domain.com>"
 */
export function formatEmailAddress(name: string | null, email: string): string {
    if (!name) return email;
    return `${name} <${email}>`;
}
