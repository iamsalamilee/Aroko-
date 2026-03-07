// Chat context store - shared across components
// Stores recent chat conversations for use in writing assistance

const CHAT_CONTEXT_KEY = 'aroko_chat_context';
const MAX_CONTEXT_MESSAGES = 10;

export interface ChatMessage {
    role: 'user' | 'ai';
    content: string;
}

/**
 * Save recent chat messages to localStorage for cross-component access
 */
export function saveChatContext(messages: ChatMessage[]): void {
    // Keep only recent messages to limit context size
    const recentMessages = messages.slice(-MAX_CONTEXT_MESSAGES);
    try {
        localStorage.setItem(CHAT_CONTEXT_KEY, JSON.stringify(recentMessages));
    } catch (e) {
        console.error('Failed to save chat context:', e);
    }
}

/**
 * Get chat context as a formatted string for AI prompts
 * Works for ANY topic - no hardcoded keywords
 */
export function getChatContextString(): string {
    try {
        const stored = localStorage.getItem(CHAT_CONTEXT_KEY);
        if (!stored) return '';

        const messages: ChatMessage[] = JSON.parse(stored);
        if (messages.length === 0) return '';

        // Format as conversation summary (limit each message to 150 chars)
        const formatted = messages.map(m =>
            `${m.role === 'user' ? 'User' : 'AI'}: ${m.content.substring(0, 150)}${m.content.length > 150 ? '...' : ''}`
        ).join('\n');

        return formatted;
    } catch (e) {
        console.error('Failed to get chat context:', e);
        return '';
    }
}

/**
 * Get raw saved messages for UI restoration
 */
export function getSavedMessages(): ChatMessage[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(CHAT_CONTEXT_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
}

/**
 * Get user preferences/requirements from chat history
 * Dynamic approach - passes full context rather than extracting keywords
 * Works for ANY field: medicine, law, arts, science, etc.
 */
export function getPreferenceContext(): string {
    const chatHistory = getChatContextString();
    if (!chatHistory) return '';

    return `PREVIOUS CONVERSATION (apply any discussed preferences, focus areas, or requirements):
${chatHistory}`;
}

