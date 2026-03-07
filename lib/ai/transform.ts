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
            // Simplified prompt - trust AI to understand context naturally
            const hasSources = knowledgeContext && knowledgeContext.trim().length > 0;

            console.log('=== WRITE MODE ===');
            console.log('Topic:', topic);
            console.log('Has sources:', hasSources);
            console.log('==================');

            prompt = `You are an expert academic writing assistant.

DOCUMENT TOPIC: "${topic || 'Academic paper'}"

${hasSources ? `RESEARCH SOURCES (use for citations):
${knowledgeContext}

CITATION RULES:
- Use ONLY citations from [CITE AS: (Author, Year)] labels above
- Format: (AuthorName, Year) as shown in the labels
- NEVER invent citations - only use what's provided
` : ''}

CONTEXT TO CONTINUE FROM:
---
${text}
---

TASK: Read the context carefully. Notice the section heading (if present) and the existing content. Continue writing 2-3 sentences that:
1. Match the section's purpose (e.g., "Problem Statement" = problems, "Objectives" = goals, "Literature Review" = research findings)
2. Flow naturally from the existing text
3. Stay on topic and maintain academic style
${hasSources ? `4. Synthesize citations naturally (avoid "as seen in X", "as discussed in Y" repetitive patterns)
5. CITATION FORMAT: Use ONLY parenthetical style like (Author, Year). NEVER use narrative style like "Author (Year)" or "as explored by Author (Year)"` : `4. DO NOT include ANY citations or references like (Author, Year). No sources were provided, so you MUST NOT fabricate, invent, or hallucinate any author names, years, or references.`}

NEGATIVE CONSTRAINTS (CRITICAL):
- DO NOT repeat phrases verbatim (e.g., never repeat "By leveraging these technologies..." if used recently).
- DO NOT start every sentence with "The use of..." or "The integration of...". Vary your sentence structure.
- DO NOT just list citations one by one; group ideas together.
${!hasSources ? `- ABSOLUTELY DO NOT include ANY citations. No (Author, Year), no (Smith, 2021), no references at all. Write general academic prose ONLY.` : ''}

Return ONLY the continuation text, nothing else:`;
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
            // Remove (Author, Year) patterns like (Smith, 2021) or (López et al., 2019)
            cleanedResult = cleanedResult.replace(/\s*\([A-Z][a-zA-Záéíóúñü]+(?:\s+(?:et\s+al\.|&\s+[A-Z][a-zA-Z]+))?,?\s*\d{4}\)/g, '');
            // Remove any leftover double spaces
            cleanedResult = cleanedResult.replace(/\s{2,}/g, ' ');
        }

        return { success: true, result: cleanedResult };
    } catch (error: any) {
        console.error('Transform error (internal):', error?.message || error);
        return { success: false, error: sanitizeAIError(error) };
    }
}
