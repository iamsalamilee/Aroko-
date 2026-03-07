'use server';

import { generateText } from 'ai';
import { getTextModel } from '@/lib/ai/models';
import { sanitizeAIError } from '@/lib/utils/error-sanitizer';

export type TransformationType = 'paraphrase' | 'improve' | 'explain' | 'summarize' | 'formal' | 'casual' | 'write';

const CITATION_RULE = 'IMPORTANT: Preserve any existing citations exactly as they appear. Do NOT add, invent, or fabricate any new citations, references, author names, or years.';

const PROMPTS: Record<TransformationType, string> = {
    paraphrase: `Rewrite the following text using different words while keeping the same meaning. ${CITATION_RULE} Only return the rewritten text, nothing else:`,
    improve: `Improve the following text to make it more clear, professional, and well-written. ${CITATION_RULE} Only return the improved text, nothing else:`,
    explain: `Expand and explain the following text in more detail. ${CITATION_RULE} Only return the expanded text, nothing else:`,
    summarize: `Summarize the following text concisely. ${CITATION_RULE} Only return the summary, nothing else:`,
    formal: `Rewrite the following text in a formal academic tone. ${CITATION_RULE} Only return the formal version, nothing else:`,
    casual: `Rewrite the following text in a more casual, conversational tone. ${CITATION_RULE} Only return the casual version, nothing else:`,
    write: `Continue writing the following text naturally, maintaining the same style, tone, and topic. Write 2-3 sentences. ${CITATION_RULE} Only return the continuation, nothing else:`,
};

export async function transformTextAction(
    text: string,
    type: TransformationType,
    topic?: string,
    knowledgeContext?: string
): Promise<{ success: boolean; result?: string; error?: string }> {
    try {
        let prompt = '';

        if (type === 'write') {
            // Only true if actual research papers are in the context (not just chat history)
            const hasSources = knowledgeContext && knowledgeContext.includes('[CITE AS:');

            console.log('=== WRITE MODE ===');
            console.log('Topic:', topic);
            console.log('Has sources:', hasSources);
            console.log('==================');

            if (hasSources) {
                // WITH sources: full academic mode with citations
                prompt = `You are an expert academic writing assistant.

DOCUMENT TOPIC: "${topic || 'Academic paper'}"

RESEARCH SOURCES (use for citations):
${knowledgeContext}

CITATION RULES:
- Use ONLY citations from [CITE AS: (Author, Year)] labels above
- Format: (AuthorName, Year) as shown in the labels
- NEVER invent citations - only use what's provided

CONTEXT TO CONTINUE FROM:
---
${text}
---

TASK: Continue writing 2-3 sentences that:
1. Match the section's purpose
2. Flow naturally from the existing text
3. Maintain academic style
4. Synthesize citations naturally
5. CITATION FORMAT: Use ONLY parenthetical style like (Author, Year)

NEGATIVE CONSTRAINTS:
- DO NOT repeat phrases verbatim.
- DO NOT start every sentence the same way. Vary sentence structure.
- DO NOT list citations one by one; group ideas together.

Return ONLY the continuation text, nothing else:`;
            } else {
                // WITHOUT sources: clean writing, NO academic citation behavior
                prompt = `Continue writing the following text. Write 2-3 clear, well-written sentences that flow naturally from what's already written. Stay on the same topic.

Topic: "${topic || 'General'}"

Text so far:
---
${text}
---

Rules:
- Continue naturally from where the text left off
- Match the tone and style of the existing text
- Do NOT add any references, sources, or parenthetical notes
- Do NOT add author names with years in parentheses
- Just write clean, informative prose
- Return ONLY the continuation, nothing else:`;
            }
        } else {
            prompt = `${PROMPTS[type]}\n\n"${text}"`;
        }

        const { text: result } = await generateText({
            model: getTextModel(),
            prompt,
        });

        let cleanedResult = result.trim();

        // Strip hallucinated citations when no sources are uploaded
        if (type === 'write' && (!knowledgeContext || knowledgeContext.trim().length === 0)) {
            // Remove ALL parenthetical citation patterns:
            // (Smith, 2020) | (Smith & Jones, 2021) | (Smith et al., 2019)
            // (Smith, 2020; Jones, 2021) | (e.g., Smith, 2020)
            cleanedResult = cleanedResult.replace(/\s*\([^)]*\d{4}[^)]*\)/g, '');
            // Remove any leftover double spaces or trailing punctuation issues
            cleanedResult = cleanedResult.replace(/\s{2,}/g, ' ').replace(/\s+\./g, '.').replace(/\s+,/g, ',');
        }

        return { success: true, result: cleanedResult };
    } catch (error: any) {
        console.error('Transform error (internal):', error?.message || error);
        return { success: false, error: sanitizeAIError(error) };
    }
}
