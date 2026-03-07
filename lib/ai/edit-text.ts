'use server';

import { generateText } from 'ai';
import { getTextModel } from './models';

export type EditCommand =
    | 'improve'
    | 'shorten'
    | 'expand'
    | 'add_citations'
    | 'fix_grammar'
    | 'make_formal'
    | 'make_simple'
    | 'paraphrase'
    | 'custom';

interface EditResult {
    success: boolean;
    original: string;
    replacement?: string;
    explanation?: string;
    error?: string;
}

// Get prompt template for edit command
function getEditPrompt(command: EditCommand, customInstruction?: string): string {
    const prompts: Record<EditCommand, string> = {
        improve: 'Improve this text to be clearer, more engaging, and better written. Keep the same meaning and approximate length.',
        shorten: 'Make this text more concise. Remove unnecessary words while preserving the key meaning. Target 50-70% of original length.',
        expand: 'Expand this text with more detail, examples, or explanation. Target 150-200% of original length.',
        add_citations: 'Add appropriate academic citations (Author, Year) to this text. Use [CITE AS: ...] info if provided. NEVER use filenames.',
        fix_grammar: 'Fix any grammar, spelling, or punctuation errors in this text. Keep the same meaning.',
        make_formal: 'Rewrite this text in a more formal, academic tone suitable for scholarly publication.',
        make_simple: 'Simplify this text to be easier to understand. Use shorter sentences and simpler vocabulary.',
        paraphrase: 'Paraphrase this text to express the same ideas in different words. Maintain the same meaning and length.',
        custom: customInstruction || 'Edit this text according to the user\'s instructions.'
    };

    return prompts[command];
}

// Main surgical edit action
export async function editSelectedTextAction(
    selectedText: string,
    userMessage: string,
    contextBefore?: string,
    contextAfter?: string,
    knowledgeContext?: string
): Promise<EditResult> {
    if (!selectedText || selectedText.trim().length === 0) {
        return { success: false, original: '', error: 'No text selected' };
    }

    try {
        const model = getTextModel();

        // Detect edit intent from user message (inline to avoid 'use server' sync function error)
        const lower = userMessage.toLowerCase();
        let editCommand: EditCommand = 'custom';
        if (lower.includes('improve') || lower.includes('better') || lower.includes('enhance')) editCommand = 'improve';
        else if (lower.includes('short') || lower.includes('concise') || lower.includes('brief')) editCommand = 'shorten';
        else if (lower.includes('expand') || lower.includes('elaborate') || lower.includes('more detail')) editCommand = 'expand';
        else if (lower.includes('cit') || lower.includes('reference') || lower.includes('source')) editCommand = 'add_citations';
        else if (lower.includes('grammar') || lower.includes('spelling') || lower.includes('correct')) editCommand = 'fix_grammar';
        else if (lower.includes('formal') || lower.includes('academic') || lower.includes('professional')) editCommand = 'make_formal';
        else if (lower.includes('simple') || lower.includes('easy') || lower.includes('plain')) editCommand = 'make_simple';
        else if (lower.includes('paraphrase') || lower.includes('reword') || lower.includes('rephrase')) editCommand = 'paraphrase';

        const editInstruction = getEditPrompt(editCommand, userMessage);

        const prompt = `You are a precise academic text editor. Edit ONLY the selected text below.

${knowledgeContext ? `REFERENCE SOURCES (use for citations):
${knowledgeContext}

` : ''}SELECTED TEXT TO EDIT:
"${selectedText}"

${contextBefore ? `TEXT BEFORE SELECTION: "...${contextBefore.slice(-200)}"` : ''}
${contextAfter ? `TEXT AFTER SELECTION: "${contextAfter.slice(0, 200)}..."` : ''}

EDIT INSTRUCTION: ${editInstruction}
USER REQUEST: "${userMessage}"

RULES:
- Return ONLY the replacement text
- Do NOT include surrounding context
- Keep consistent style with surrounding text
- For citations: use (Author, Year) format, NEVER filenames
- Preserve paragraph structure

OUTPUT THE REPLACEMENT TEXT ONLY:`;

        const { text } = await generateText({
            model,
            prompt
        });
        const replacement = text.trim();

        // Generate brief explanation
        const explanations: Record<EditCommand, string> = {
            improve: 'Improved clarity and flow',
            shorten: `Shortened from ${selectedText.length} to ${replacement.length} chars`,
            expand: `Expanded with more detail`,
            add_citations: 'Added academic citations',
            fix_grammar: 'Fixed grammar/spelling',
            make_formal: 'Made more formal/academic',
            make_simple: 'Simplified for clarity',
            paraphrase: 'Paraphrased to new wording',
            custom: 'Applied your requested edit'
        };

        return {
            success: true,
            original: selectedText,
            replacement,
            explanation: explanations[editCommand]
        };

    } catch (error: any) {
        console.error('Edit failed:', error);
        return {
            success: false,
            original: selectedText,
            error: error.message || 'Failed to generate edit'
        };
    }
}
