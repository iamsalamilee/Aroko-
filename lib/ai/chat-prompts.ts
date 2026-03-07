/**
 * AI Chat Prompts and Greeting Detection
 */

export const GREETING_RESPONSE = `Hello! 👋 I'm **AROKO**, your AI research writing assistant.

I can help you with:
- 📝 **Writing academic content** - use "/" in the editor for quick access
- 🔍 **Finding research papers** from academic databases
- 📚 **Managing citations** in APA, Harvard, Chicago, or IEEE
- ✍️ **Improving your writing** style and structure
- 💡 **Brainstorming ideas** and discussing your research

**Quick Start:**
- Upload PDFs/DOCXs to your Knowledge Base
- Type "/" in the editor for AI writing help
- Chat with me for research advice

What would you like to work on today?`;

export function isGreeting(message: string): boolean {
    const trimmed = message.toLowerCase().trim();
    const greetings = [
        'hi', 'hello', 'hey', 'greetings', 'hola',
        'good morning', 'good afternoon', 'good evening',
        'start', 'begin', 'help'
    ];

    return greetings.some(g => trimmed === g || trimmed.startsWith(g + ' '));
}

