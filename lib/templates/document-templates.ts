// Document structure templates for Nigerian universities

export interface Section {
    id: string;
    number: string;      // e.g., "1.1", "2.3"
    title: string;
    description: string; // Guide for AI on what to write
    wordCount: number;
}

export interface Chapter {
    id: string;
    number: number;      // e.g., 1, 2, 3
    title: string;
    sections: Section[];
}

export interface DocumentTemplate {
    id: string;
    name: string;
    description: string;
    chapters: Chapter[];
}

// Seminar Report Template (based on user's screenshot)
export const SEMINAR_REPORT_TEMPLATE: DocumentTemplate = {
    id: 'seminar-report',
    name: 'Seminar Report',
    description: 'Standard seminar/project report format',
    chapters: [
        {
            id: 'ch1',
            number: 1,
            title: 'INTRODUCTION',
            sections: [
                { id: '1.1', number: '1.1', title: 'Background to the Study', description: 'Provide context and background information about the research topic', wordCount: 400 },
                { id: '1.2', number: '1.2', title: 'Statement of the Problem', description: 'Clearly define the problem being addressed', wordCount: 300 },
                { id: '1.3', number: '1.3', title: 'Aim and Objectives of the Study', description: 'State the main aim and specific objectives', wordCount: 200 },
                { id: '1.4', number: '1.4', title: 'Significance of the Study', description: 'Explain why this research is important', wordCount: 200 },
                { id: '1.5', number: '1.5', title: 'Scope and Limitations', description: 'Define the boundaries and limitations of the study', wordCount: 200 },
            ]
        },
        {
            id: 'ch2',
            number: 2,
            title: 'LITERATURE REVIEW',
            sections: [
                { id: '2.1', number: '2.1', title: 'Conceptual Review', description: 'Review key concepts and definitions related to the topic', wordCount: 500 },
                { id: '2.2', number: '2.2', title: 'Theoretical Framework', description: 'Discuss relevant theories that underpin the research', wordCount: 400 },
                { id: '2.3', number: '2.3', title: 'Empirical Review', description: 'Review previous research and studies on the topic', wordCount: 500 },
                { id: '2.4', number: '2.4', title: 'Summary of Literature', description: 'Summarize key findings from the literature', wordCount: 200 },
            ]
        },
        {
            id: 'ch3',
            number: 3,
            title: 'METHODOLOGY',
            sections: [
                { id: '3.1', number: '3.1', title: 'Research Design', description: 'Describe the research design and approach', wordCount: 300 },
                { id: '3.2', number: '3.2', title: 'Data Collection Methods', description: 'Explain how data will be collected', wordCount: 300 },
                { id: '3.3', number: '3.3', title: 'System Design/Implementation', description: 'Describe the proposed system architecture or implementation approach', wordCount: 400 },
                { id: '3.4', number: '3.4', title: 'Tools and Technologies', description: 'List and describe tools, technologies, or frameworks to be used', wordCount: 300 },
            ]
        },
        {
            id: 'references',
            number: 4,
            title: 'REFERENCES',
            sections: [
                { id: 'refs', number: '', title: 'References', description: 'List all references cited in the document. NOTE: This section will be left for user to fill in with actual sources.', wordCount: 0 },
            ]
        }
    ]
};

// Research Paper Template
export const RESEARCH_PAPER_TEMPLATE: DocumentTemplate = {
    id: 'research-paper',
    name: 'Research Paper',
    description: 'Academic research paper format',
    chapters: [
        {
            id: 'ch1',
            number: 1,
            title: 'INTRODUCTION',
            sections: [
                { id: '1.1', number: '1.1', title: 'Background', description: 'Introduce the research topic and its context', wordCount: 400 },
                { id: '1.2', number: '1.2', title: 'Problem Statement', description: 'Define the research problem', wordCount: 300 },
                { id: '1.3', number: '1.3', title: 'Research Questions', description: 'State the research questions', wordCount: 200 },
                { id: '1.4', number: '1.4', title: 'Objectives', description: 'List the research objectives', wordCount: 200 },
            ]
        },
        {
            id: 'ch2',
            number: 2,
            title: 'LITERATURE REVIEW',
            sections: [
                { id: '2.1', number: '2.1', title: 'Related Work', description: 'Review related research and studies', wordCount: 600 },
                { id: '2.2', number: '2.2', title: 'Theoretical Background', description: 'Discuss relevant theories', wordCount: 400 },
            ]
        },
        {
            id: 'ch3',
            number: 3,
            title: 'METHODOLOGY',
            sections: [
                { id: '3.1', number: '3.1', title: 'Research Approach', description: 'Describe the methodology used', wordCount: 400 },
                { id: '3.2', number: '3.2', title: 'Data Collection', description: 'Explain data collection methods', wordCount: 300 },
                { id: '3.3', number: '3.3', title: 'Analysis Methods', description: 'Describe how data was analyzed', wordCount: 300 },
            ]
        },
        {
            id: 'ch4',
            number: 4,
            title: 'RESULTS',
            sections: [
                { id: '4.1', number: '4.1', title: 'Findings', description: 'Present research findings', wordCount: 500 },
                { id: '4.2', number: '4.2', title: 'Analysis', description: 'Analyze the findings', wordCount: 400 },
            ]
        },
        {
            id: 'ch5',
            number: 5,
            title: 'CONCLUSION',
            sections: [
                { id: '5.1', number: '5.1', title: 'Summary and Conclusion', description: 'Summarize and conclude', wordCount: 300 },
                { id: '5.2', number: '5.2', title: 'Future Work', description: 'Suggest future research directions', wordCount: 200 },
            ]
        }
    ]
};

// Essay Template (simpler format)
export const ESSAY_TEMPLATE: DocumentTemplate = {
    id: 'essay',
    name: 'Essay',
    description: 'Simple essay format',
    chapters: [
        {
            id: 'ch1',
            number: 1,
            title: 'INTRODUCTION',
            sections: [
                { id: '1.1', number: '1.1', title: 'Introduction', description: 'Introduce the topic and thesis statement', wordCount: 400 },
            ]
        },
        {
            id: 'ch2',
            number: 2,
            title: 'BODY',
            sections: [
                { id: '2.1', number: '2.1', title: 'Main Argument', description: 'Present the main arguments', wordCount: 600 },
                { id: '2.2', number: '2.2', title: 'Supporting Evidence', description: 'Provide supporting evidence', wordCount: 500 },
                { id: '2.3', number: '2.3', title: 'Counter Arguments', description: 'Address counter arguments', wordCount: 400 },
            ]
        },
        {
            id: 'ch3',
            number: 3,
            title: 'CONCLUSION',
            sections: [
                { id: '3.1', number: '3.1', title: 'Conclusion', description: 'Summarize and conclude', wordCount: 300 },
            ]
        }
    ]
};

// All templates
export const DOCUMENT_TEMPLATES: Record<string, DocumentTemplate> = {
    'seminar-report': SEMINAR_REPORT_TEMPLATE,
    'research-paper': RESEARCH_PAPER_TEMPLATE,
    'essay': ESSAY_TEMPLATE,
};

// Helper to get total word count for a template
export function getTemplateWordCount(template: DocumentTemplate): number {
    return template.chapters.reduce((total, chapter) => {
        return total + chapter.sections.reduce((sectionTotal, section) => {
            return sectionTotal + section.wordCount;
        }, 0);
    }, 0);
}

// Helper to get total sections count
export function getTemplateSectionCount(template: DocumentTemplate): number {
    return template.chapters.reduce((total, chapter) => total + chapter.sections.length, 0);
}
