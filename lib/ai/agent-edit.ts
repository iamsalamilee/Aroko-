'use server';

import { generateText } from 'ai';
import { getTextModel } from './models';
import { sanitizeAIError } from '@/lib/utils/error-sanitizer';

// A single proposed edit from the AI
export interface SectionEdit {
    sectionId: string;
    sectionTitle: string;
    impact: 'MAJOR' | 'MINOR';
    explanation: string;
    originalContent: string;
    newContent: string;
}

// The full result from the agent
export interface AgentEditResult {
    success: boolean;
    instruction: string;
    edits: SectionEdit[];
    summary?: string;
    error?: string;
}

// Simplified section info that we send to the server (no ProseMirror positions)
export interface SectionInfo {
    id: string;
    title: string;
    headingLevel: number;
    content: string;
}

/**
 * The main agentic edit pipeline.
 * 
 * Step 1: Send the document skeleton + user instruction to the AI.
 *         Ask it to identify which sections need editing and why.
 * Step 2: For each affected section, generate the replacement text
 *         with awareness of previously generated edits (for coherence).
 * 
 * This is designed for documents up to ~5-10 pages.
 * For larger documents, we'd use embedding-based retrieval first.
 */
export async function agentEditAction(
    instruction: string,
    sections: SectionInfo[],
    knowledgeContext?: string
): Promise<AgentEditResult> {
    if (!instruction.trim()) {
        return { success: false, instruction, edits: [], error: 'No instruction provided' };
    }

    if (sections.length === 0) {
        return { success: false, instruction, edits: [], error: 'Document has no sections. Add some headings first.' };
    }

    try {
        const model = getTextModel();

        // ─── STEP 1: PLAN ─── Ask AI which sections need editing ───
        const sectionSummaries = sections.map(s => {
            // Send first 300 chars of each section so AI understands content
            const preview = s.content.substring(0, 300);
            return `[${s.id}] ${'#'.repeat(s.headingLevel)} ${s.title}\n${preview}${s.content.length > 300 ? '...' : ''}`;
        }).join('\n\n---\n\n');

        const planPrompt = `You are an expert academic document editor. A user wants to make changes to their research paper.

USER INSTRUCTION: "${instruction}"

DOCUMENT SECTIONS:
${sectionSummaries}

${knowledgeContext ? `REFERENCE SOURCES (for citations if needed):\n${knowledgeContext}\n` : ''}

YOUR TASK:
Analyze the user's instruction and determine which sections need to be modified.
Consider BOTH direct mentions AND logical connections (e.g., if removing a limitation, also update the discussion, conclusion, etc.).

Return your analysis as valid JSON (no markdown, no code fences):
{
  "affected_sections": [
    {
      "section_id": "sec-0",
      "impact": "MAJOR",
      "reason": "Brief explanation of why this section needs changing"
    }
  ],
  "summary": "One sentence describing the overall change"
}

RULES:
- Only include sections that genuinely need changing
- "MAJOR" = significant rewrite needed, "MINOR" = small wording/reference change
- If the instruction is about a specific section (e.g. "section 2.4"), find it by title
- Think about logical dependencies: methodology changes affect results, scope changes affect abstract, etc.
- Return ONLY valid JSON, nothing else`;

        const planResponse = await generateText({
            model,
            prompt: planPrompt,
            temperature: 0.3,
        });

        // Parse the plan
        let plan: {
            affected_sections: Array<{ section_id: string; impact: string; reason: string }>;
            summary: string;
        };

        try {
            // Clean the response: strip markdown code fences if the model added them
            let cleanedText = planResponse.text.trim();
            cleanedText = cleanedText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
            plan = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error('Failed to parse plan JSON:', planResponse.text);
            return {
                success: false,
                instruction,
                edits: [],
                error: 'AI returned invalid plan. Please try rephrasing your instruction.'
            };
        }

        if (!plan.affected_sections || plan.affected_sections.length === 0) {
            return {
                success: true,
                instruction,
                edits: [],
                summary: 'No sections need to be changed for this instruction.'
            };
        }

        // ─── STEP 2: EDIT ─── Rewrite each affected section ───
        const edits: SectionEdit[] = [];
        const previousEdits: string[] = []; // Track what we've already changed for coherence

        for (const affected of plan.affected_sections) {
            const section = sections.find(s => s.id === affected.section_id);
            if (!section) continue;

            // Build context of prior edits so AI stays coherent
            const priorContext = previousEdits.length > 0
                ? `\n\nSECTIONS ALREADY EDITED (maintain consistency with these):\n${previousEdits.join('\n---\n')}`
                : '';

            const editPrompt = `You are rewriting a section of an academic research paper.

OVERALL CHANGE: ${plan.summary}
USER INSTRUCTION: "${instruction}"

THIS SECTION TO REWRITE:
Title: ${section.title}
Why it needs changing: ${affected.reason}
Impact level: ${affected.impact}

CURRENT CONTENT:
${section.content}
${priorContext}

${knowledgeContext ? `REFERENCE SOURCES:\n${knowledgeContext}\n` : ''}

RULES:
- Rewrite this section to reflect the user's instruction
- Keep the SAME heading (do not change the section title)
- Keep approximately the same length unless the change requires expansion/reduction
- Maintain academic tone and style
- Preserve any citations that are still relevant
- For citations, use (Author, Year) format — NEVER use filenames
- Make sure this reads naturally and connects logically with the rest of the paper
- Return ONLY the replacement text (including the heading), nothing else
- Do NOT wrap in markdown code fences`;

            const editResponse = await generateText({
                model,
                prompt: editPrompt,
                temperature: 0.4,
            });

            const newContent = editResponse.text.trim();

            edits.push({
                sectionId: section.id,
                sectionTitle: section.title,
                impact: affected.impact === 'MAJOR' ? 'MAJOR' : 'MINOR',
                explanation: affected.reason,
                originalContent: section.content,
                newContent,
            });

            // Add to prior context for the next iteration
            previousEdits.push(`[${section.title}]: ${newContent.substring(0, 200)}...`);
        }

        return {
            success: true,
            instruction,
            edits,
            summary: plan.summary,
        };

    } catch (error: any) {
        console.error('Agent edit failed:', error);
        return {
            success: false,
            instruction,
            edits: [],
            error: sanitizeAIError(error),
        };
    }
}
