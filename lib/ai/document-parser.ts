// Document Section Parser — Client-side utility
// Extracts sections from a Tiptap editor instance by splitting on headings.
// Each section has an ID, title, content text, and ProseMirror position range.

export interface DocumentSection {
    id: string;
    title: string;
    headingLevel: number;
    content: string;       // Plain text content of the section
    htmlContent: string;   // HTML content of the section
    from: number;          // ProseMirror start position (inclusive)
    to: number;            // ProseMirror end position (inclusive)
}

export interface DocumentMap {
    title: string;         // Document title (first H1, or "Untitled")
    sections: DocumentSection[];
    skeleton: string;      // A short summary of all section titles for the AI planner
    fullText: string;      // The entire document as plain text
}

/**
 * Parse a Tiptap editor instance into a structured section map.
 * 
 * Walks the ProseMirror document tree and splits on heading nodes.
 * Each section starts at a heading and ends at the next heading of the same
 * or higher level (or at the end of the document).
 */
export function parseDocumentSections(editor: any): DocumentMap {
    if (!editor || !editor.state) {
        return { title: 'Untitled', sections: [], skeleton: '', fullText: '' };
    }

    const doc = editor.state.doc;
    // Use textBetween with newline separators so paragraphs don't get squashed together
    const fullText = doc.textBetween(0, doc.content.size, '\n', '\n') || '';

    // Step 1: Find all heading positions
    interface HeadingInfo {
        level: number;
        text: string;
        pos: number;       // Position of the heading node itself
        nodeSize: number;  // Size of the heading node
    }

    const headings: HeadingInfo[] = [];

    doc.descendants((node: any, pos: number) => {
        if (node.type.name === 'heading') {
            headings.push({
                level: node.attrs.level || 1,
                text: node.textContent.trim(),
                pos,
                nodeSize: node.nodeSize,
            });
        }
    });

    // If no headings found, fall back to chunking by paragraphs so surgical edit still works
    if (headings.length === 0) {
        const sections: DocumentSection[] = [];
        let pIndex = 0;

        doc.descendants((node: any, pos: number) => {
            if (node.type.name === 'paragraph' && node.textContent.trim().length > 0) {
                const text = node.textContent.trim();
                sections.push({
                    id: `sec-p-${pIndex}`,
                    title: `Paragraph ${pIndex + 1}`,
                    headingLevel: 0,
                    content: text,
                    htmlContent: `<p>${text}</p>`,
                    from: pos,
                    to: pos + node.nodeSize,
                });
                pIndex++;
            }
        });

        // If there are literally no paragraphs either, return empty
        if (sections.length === 0) {
            return { title: 'Untitled', sections: [], skeleton: '', fullText: '' };
        }

        const skeleton = sections.map(s => `[${s.id}] ${s.title} — "${s.content.substring(0, 50)}..."`).join('\n');
        
        return {
            title: 'Untitled Document',
            sections,
            skeleton,
            fullText,
        };
    }

    // Step 2: Build sections from heading boundaries
    const sections: DocumentSection[] = [];
    let docTitle = 'Untitled';

    for (let i = 0; i < headings.length; i++) {
        const heading = headings[i];
        const nextHeading = headings[i + 1];

        // Section starts at this heading's position
        const from = heading.pos;
        // Section ends at the next heading's position, or end of document
        const to = nextHeading ? nextHeading.pos : doc.content.size;

        // Extract the plain text between these positions
        let sectionText = '';
        try {
            sectionText = doc.textBetween(from, to, '\n', '\n').trim();
        } catch {
            sectionText = heading.text;
        }

        // For the AI pipeline we only need plain text, so htmlContent is just a fallback
        const htmlContent = sectionText;

        // Use first H1 as document title
        if (heading.level === 1 && docTitle === 'Untitled') {
            docTitle = heading.text;
        }

        const section: DocumentSection = {
            id: `sec-${i}`,
            title: heading.text,
            headingLevel: heading.level,
            content: sectionText,
            htmlContent,
            from,
            to,
        };

        sections.push(section);
    }

    // Step 3: Build the skeleton summary
    const skeleton = sections.map(s => {
        const indent = '  '.repeat(Math.max(0, s.headingLevel - 1));
        const preview = s.content.substring(s.title.length, s.title.length + 80).trim();
        return `${indent}[${s.id}] ${'#'.repeat(s.headingLevel)} ${s.title} (${s.content.length} chars)${preview ? ` — "${preview}..."` : ''}`;
    }).join('\n');

    return { title: docTitle, sections, skeleton, fullText };
}

/**
 * Get a compact skeleton of the document for the AI planner.
 * This is small enough to always fit in the AI's context window,
 * even for very large documents.
 */
export function getDocumentSkeleton(editor: any): string {
    const map = parseDocumentSections(editor);
    return `DOCUMENT: "${map.title}"\n\nSECTIONS:\n${map.skeleton}`;
}
