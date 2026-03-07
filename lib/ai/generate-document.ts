'use server';

import { generateText } from 'ai';
import { getTextModel } from '@/lib/ai/models';
import { DocumentTemplate, Section, Chapter } from '@/lib/templates/document-templates';

export interface OutlineSection {
    id: string;
    number: string;
    title: string;
    wordCount: number;
    chapterId: string;
    chapterNumber: number;
    chapterTitle: string;
}

export interface GeneratedSection extends OutlineSection {
    content: string;
    status: 'pending' | 'generating' | 'done' | 'error';
}

export interface DocumentOutline {
    topic: string;
    template: DocumentTemplate;
    sections: OutlineSection[];
    totalWords: number;
    estimatedPages: number;
}

// Step 1: Generate customized outline based on topic
export async function generateOutlineAction(
    topic: string,
    template: DocumentTemplate
): Promise<{ success: boolean; outline?: DocumentOutline; error?: string }> {
    try {
        // For now, use the template as-is but allow AI to customize section titles
        const sections: OutlineSection[] = [];

        for (const chapter of template.chapters) {
            for (const section of chapter.sections) {
                sections.push({
                    id: section.id,
                    number: section.number,
                    title: section.title,
                    wordCount: section.wordCount,
                    chapterId: chapter.id,
                    chapterNumber: chapter.number,
                    chapterTitle: chapter.title,
                });
            }
        }

        const totalWords = sections.reduce((sum, s) => sum + s.wordCount, 0);

        return {
            success: true,
            outline: {
                topic,
                template,
                sections,
                totalWords,
                estimatedPages: Math.ceil(totalWords / 250),
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Step 2: Generate content for a single section
export async function generateSectionAction(
    topic: string,
    section: OutlineSection,
    previousSections: { title: string; summary: string }[],
    academicLevel: string = 'undergraduate',
    knowledgeContext: string = ''
): Promise<{ success: boolean; content?: string; summary?: string; error?: string }> {
    try {
        const contextSummary = previousSections.length > 0
            ? `\n\nPREVIOUS SECTIONS COVERED:\n${previousSections.map(s => `- ${s.title}: ${s.summary}`).join('\n')}`
            : '';

        const researchContext = knowledgeContext
            ? `\n\nUSER'S RESEARCH DOCUMENTS (Use these as your ONLY sources for citations):\n${knowledgeContext}`
            : '';

        const citationGuidance = knowledgeContext
            ? `
📚 RESEARCH SOURCES PROVIDED (USE THESE CITATIONS):
${knowledgeContext}

⚠️ CRITICAL CITATION RULES:

1️⃣ **EXTRACT AUTHOR NAMES FROM [CITE AS: ...] LABELS ABOVE**
   - Each source has a [CITE AS: (AuthorName, Year)] label
   - USE THOSE EXACT NAMES - do NOT make up names
   - If label says (Oguya et al., 2020), write (Oguya et al., 2020)
   - If label says (Domingues, 2022), write (Domingues, 2022)

2️⃣ **FORBIDDEN - NEVER DO THESE:**
   ❌ NEVER use generic placeholders like "(Author, 2020)" or "(Another Author, 2021)"
   ❌ NEVER use filenames like "sustainability-12-00485.pdf"
   ❌ NEVER use "According to prior research (Author, Year)"
   ❌ NEVER invent author names that are not in the [CITE AS:] labels

3️⃣ **USE VARIED CITATION PHRASES:**
   • "Research by Oguya et al. (2020) demonstrates..."
   • "Recent studies indicate that... (Domingues, 2022)"
   • "As found in prior work (Hassan et al., 2021)..."
   • "Findings confirm... (Khalid, 2023)"

📖 TARGET: ${section.wordCount} words with 8-12 REAL citations from the sources above.
`
            : `
⚠️ NO RESEARCH MATERIALS PROVIDED

CITATION RULES:
- Do NOT include ANY citations or references
- Do NOT fabricate author names, years, or sources
- Write general academic prose only

Write WITHOUT citations - no sources were provided.
`;

        const prompt = `You are writing section "${section.number} ${section.title}" of Chapter ${section.chapterNumber}: ${section.chapterTitle} for an academic document about "${topic}".

${contextSummary}
${researchContext}

Requirements:
- Write approximately ${section.wordCount} words
- Use ${academicLevel} academic language
- This section should focus specifically on: ${section.title}
- Write in proper academic prose with clear paragraphs
- Do NOT include the section number or title in your response
- Do NOT use markdown formatting (no **, no *, no #)
- Write plain paragraphs only
- Separate paragraphs with blank lines
${citationGuidance}

Write the section content now:`;

        const { text: content } = await generateText({
            model: getTextModel(),
            prompt,
        });

        // Convert to HTML paragraphs
        const htmlContent = content
            .trim()
            .split(/\n\n+/)
            .map(para => para.trim())
            .filter(para => para.length > 0)
            .map(para => `<p>${para.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^#+\s*/gm, '')}</p>`)
            .join('\n');

        // Generate summary for context
        const summaryPrompt = `Summarize in ONE sentence what was covered in this section:\n\n${content.substring(0, 500)}...`;
        const { text: summary } = await generateText({
            model: getTextModel(),
            prompt: summaryPrompt,
        });

        return {
            success: true,
            content: htmlContent,
            summary: summary.trim(),
        };
    } catch (error: any) {
        console.error('Section generation error:', error);
        return { success: false, error: error.message };
    }
}

