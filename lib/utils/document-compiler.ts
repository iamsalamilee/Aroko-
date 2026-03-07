// Pure utility functions for document compilation - NO server actions

// Define the interface locally to avoid circular imports
export interface GeneratedSectionData {
    id: string;
    number: string;
    title: string;
    wordCount: number;
    chapterId: string;
    chapterNumber: number;
    chapterTitle: string;
    content: string;
    status: 'pending' | 'generating' | 'done' | 'error';
}

// Compile outline as headings only (no content) for immediate insertion
export function compileOutlineOnly(
    topic: string,
    sections: GeneratedSectionData[]
): string {
    let html = `<h1>${topic}</h1>\n\n`;
    let currentChapter = '';

    for (const section of sections) {
        // Add chapter heading if new chapter
        if (section.chapterId !== currentChapter) {
            html += `<h2>CHAPTER ${section.chapterNumber}: ${section.chapterTitle}</h2>\n\n`;
            currentChapter = section.chapterId;
        }

        // Add section heading with unique placeholder text marker
        // Using a unique marker format: <!--SECTION:id--> that's easy to find/replace
        html += `<h3>${section.number} ${section.title}</h3>\n`;
        html += `<p><em>[GENERATING_${section.id}]</em></p>\n\n`;
    }

    return html;
}

// Compile all sections into full document HTML
export function compileDocument(
    topic: string,
    sections: GeneratedSectionData[]
): string {
    let html = '';
    let currentChapter = '';

    for (const section of sections) {
        // Add chapter heading if new chapter
        if (section.chapterId !== currentChapter) {
            html += `<h2>CHAPTER ${section.chapterNumber}: ${section.chapterTitle}</h2>\n\n`;
            currentChapter = section.chapterId;
        }

        // Add section heading and content
        html += `<h3>${section.number} ${section.title}</h3>\n`;
        html += section.content + '\n\n';
    }

    return html;
}

