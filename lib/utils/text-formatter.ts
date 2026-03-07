// Text formatting utilities for detecting and styling document content
// These functions run CLIENT-SIDE only

import { UniversityTemplate } from '@/lib/presets/universities';

// Common heading keywords that indicate section starts
const HEADING_KEYWORDS = [
    'abstract', 'introduction', 'background', 'literature review',
    'methodology', 'methods', 'results', 'discussion', 'conclusion',
    'recommendations', 'references', 'bibliography', 'appendix',
    'acknowledgement', 'acknowledgment', 'dedication', 'table of contents',
    'list of tables', 'list of figures', 'chapter'
];

// Detect if a line is likely a heading
export function isHeading(line: string): boolean {
    const trimmed = line.trim();

    // Empty lines are not headings
    if (!trimmed) return false;

    // Check 1: ALL CAPS (at least 3 words)
    if (/^[A-Z][A-Z\s\d]+$/.test(trimmed) && trimmed.length > 3) {
        return true;
    }

    // Check 2: Numbered section (1.0, 1.1, 2.0, etc.)
    if (/^\d+\.[\d\.]*\s+\w/.test(trimmed)) {
        return true;
    }

    // Check 3: Known heading keywords (case insensitive)
    const lowerTrimmed = trimmed.toLowerCase();
    for (const keyword of HEADING_KEYWORDS) {
        if (lowerTrimmed === keyword || lowerTrimmed.startsWith(keyword + ' ') || lowerTrimmed.startsWith(keyword + ':')) {
            return true;
        }
    }

    // Check 4: "CHAPTER X" pattern
    if (/^chapter\s+\d+/i.test(trimmed)) {
        return true;
    }

    return false;
}

// Apply formatting to HTML content based on template
// This uses regex instead of DOMParser to work in all environments
export function applyTemplateFormatting(html: string, template: UniversityTemplate): string {
    // Apply styles to paragraphs
    let formattedHtml = html;

    // Add base styles to all paragraphs
    const bodyStyle = `font-family: '${template.bodyText.fontFamily}', serif; font-size: ${template.bodyText.fontSize}pt; line-height: ${template.bodyText.lineSpacing}; text-align: justify;`;

    // Replace <p> tags with styled <p> tags
    formattedHtml = formattedHtml.replace(/<p>/gi, `<p style="${bodyStyle}">`);
    formattedHtml = formattedHtml.replace(/<p\s+style="([^"]*)"/gi, `<p style="${bodyStyle} $1"`);

    // Apply heading styles
    const headingStyle = `font-family: '${template.sectionHeading.fontFamily}', serif; font-size: ${template.sectionHeading.fontSize}pt; font-weight: bold; line-height: ${template.bodyText.lineSpacing};`;

    // Style h1, h2, h3 tags
    formattedHtml = formattedHtml.replace(/<h1>/gi, `<h1 style="${headingStyle}">`);
    formattedHtml = formattedHtml.replace(/<h2>/gi, `<h2 style="${headingStyle}">`);
    formattedHtml = formattedHtml.replace(/<h3>/gi, `<h3 style="${headingStyle}">`);
    formattedHtml = formattedHtml.replace(/<h4>/gi, `<h4 style="${headingStyle}">`);

    return formattedHtml;
}

// Convert plain text to formatted HTML with heading detection
export function textToFormattedHtml(text: string, template: UniversityTemplate): string {
    const lines = text.split('\n');
    let html = '';

    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) {
            // Empty line = paragraph break
            return;
        }

        if (isHeading(trimmed)) {
            html += `<p style="font-family: '${template.sectionHeading.fontFamily}'; font-size: ${template.sectionHeading.fontSize}pt; font-weight: bold; line-height: ${template.bodyText.lineSpacing};"><strong>${trimmed}</strong></p>`;
        } else {
            html += `<p style="font-family: '${template.bodyText.fontFamily}'; font-size: ${template.bodyText.fontSize}pt; line-height: ${template.bodyText.lineSpacing};">${trimmed}</p>`;
        }
    });

    return html;
}
