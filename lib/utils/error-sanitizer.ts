/**
 * Error sanitization utility
 * Converts internal API errors to user-friendly messages
 * Keeps sensitive info (org IDs, API keys, rate limits) server-side only
 */

// Generate unique error ID for tracking
function getErrorId(): string {
    return 'ERR-' + Math.random().toString(36).substring(2, 7).toUpperCase();
}

// Patterns that indicate sensitive information
const SENSITIVE_PATTERNS = [
    /org[_-]?id/i,
    /api[_-]?key/i,
    /organization/i,
    /rate[_-]?limit/i,
    /quota/i,
    /billing/i,
    /subscription/i,
    /tier/i,
    /token[s]?\s*(per|limit|usage)/i,
];

// User-friendly error messages
const ERROR_MESSAGES: Record<string, string> = {
    'rate_limit': 'The AI service is busy. Please try again in a moment.',
    'quota_exceeded': 'Service temporarily unavailable. Please try again later.',
    'invalid_api_key': 'AI service configuration error. Please contact support.',
    'network': 'Unable to connect to AI service. Check your internet connection.',
    'timeout': 'Request timed out. Please try again.',
    'model_not_found': 'AI model unavailable. Please try again later.',
    'context_length': 'Your text is too long. Try with a shorter selection.',
    'default': 'Something went wrong. Please try again.',
};

/**
 * Sanitize an AI-related error for user display
 * Logs full error server-side, returns safe message for client
 */
export function sanitizeAIError(error: any): string {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    const errorId = getErrorId();

    // Always log full error server-side (will show in terminal, not browser)
    if (typeof window === 'undefined') {
        // Server-side only
        console.error(`[${errorId}] Full error:`, errorMessage);

        // Extra debug logging if DEBUG_ERRORS is set
        if (process.env.DEBUG_ERRORS === 'true') {
            console.error(`[${errorId}] Error stack:`, error?.stack);
            console.error(`[${errorId}] Error details:`, JSON.stringify(error, null, 2));
        }
    }

    // Determine user-friendly message
    const lowerMessage = errorMessage.toLowerCase();

    if (lowerMessage.includes('rate') || lowerMessage.includes('429')) {
        return ERROR_MESSAGES.rate_limit;
    }
    if (lowerMessage.includes('quota') || lowerMessage.includes('exceeded')) {
        return ERROR_MESSAGES.quota_exceeded;
    }
    if (lowerMessage.includes('api key') || lowerMessage.includes('unauthorized')) {
        return ERROR_MESSAGES.invalid_api_key;
    }
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('enotfound')) {
        return ERROR_MESSAGES.network;
    }
    if (lowerMessage.includes('timeout')) {
        return ERROR_MESSAGES.timeout;
    }
    if (lowerMessage.includes('context') || lowerMessage.includes('too long') || lowerMessage.includes('token')) {
        return ERROR_MESSAGES.context_length;
    }

    // Check if message contains sensitive info
    const containsSensitiveInfo = SENSITIVE_PATTERNS.some(pattern => pattern.test(errorMessage));

    if (containsSensitiveInfo) {
        return `${ERROR_MESSAGES.default} (Ref: ${errorId})`;
    }

    // If error seems safe, return it with ID
    if (errorMessage.length < 100 && !containsSensitiveInfo) {
        return `${errorMessage} (Ref: ${errorId})`;
    }

    return `${ERROR_MESSAGES.default} (Ref: ${errorId})`;
}

/**
 * Log error with context and return sanitized message
 */
export function logAndSanitize(error: any, context: string): { message: string; errorId: string } {
    const errorId = getErrorId();

    if (typeof window === 'undefined') {
        console.error(`[${errorId}] ${context}:`, error?.message || error);
    }

    return {
        message: sanitizeAIError(error),
        errorId
    };
}
