// DOCX export utility
import { asBlob } from 'html-docx-js-typescript';
import { saveAs } from 'file-saver';
import { convertChartsToPNG } from './chart-to-svg';

interface ExportOptions {
    title?: string;
    margins?: {
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
    };
}

export async function exportToDocx(htmlContent: string, options: ExportOptions = {}): Promise<void> {
    const {
        title = 'document',
        margins = { top: 1440, right: 1440, bottom: 1440, left: 1440 } // 1 inch = 1440 twips
    } = options;

    // Convert horizontal rules to page breaks for export
    let cleanedContent = htmlContent;

    // Convert chart nodes to PNG images (async - uses Canvas)
    cleanedContent = await convertChartsToPNG(cleanedContent);

    // Replace <hr> tags with Word-compatible page break
    // Using <br clear="all" style="mso-special-character:line-break;page-break-before:always">
    cleanedContent = cleanedContent.replace(
        /<hr[^>]*>/gi,
        '<br clear="all" style="mso-special-character:line-break;page-break-before:always">'
    );

    // Wrap content in proper HTML structure for docx conversion
    const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {
                    font-family: 'Times New Roman', Times, serif;
                    font-size: 12pt;
                    line-height: 2;
                }
                p {
                    margin-bottom: 0;
                    text-align: justify;
                    text-indent: 0.5in;
                }
                h1, h2, h3, h4, h5, h6 {
                    font-weight: bold;
                    margin-top: 24pt;
                    margin-bottom: 12pt;
                    text-indent: 0;
                }
                h1 { font-size: 16pt; text-align: center; }
                h2 { font-size: 14pt; }
                h3 { font-size: 12pt; }
                table {
                    border-collapse: collapse;
                    width: 100%;
                    margin: 12pt 0;
                }
                td, th {
                    border: 1px solid black;
                    padding: 6pt;
                }
                .page-break {
                    page-break-after: always;
                    height: 0;
                    visibility: hidden;
                }
            </style>
        </head>
        <body>
            ${cleanedContent}
        </body>
        </html>
    `;

    try {
        const blob = await asBlob(fullHtml, {
            margins,
            orientation: 'portrait',
        }) as Blob;

        // Sanitize filename
        const safeTitle = title.replace(/[^a-zA-Z0-9\s-_]/g, '').trim() || 'document';
        saveAs(blob, `${safeTitle}.docx`);
    } catch (error) {
        console.error('DOCX export error:', error);
        throw new Error('Failed to export document');
    }
}

// Insert page break HTML (to be used in editor)
// Uses very faint line in editor, but class triggers actual page break in DOCX
export function getPageBreakHtml(): string {
    return '<div class="page-break" style="page-break-after: always; margin: 32px 0; position: relative;" contenteditable="false"><hr style="border: none; border-top: 1px dashed #f3f4f6; margin: 0;"><span class="page-break-label" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 0 16px; color: #e5e7eb; font-size: 10px; font-style: italic; letter-spacing: 0.05em;">page break</span></div>';
}

// Clean page break for export (removes visual indicator, keeps page break)
export function cleanPageBreaksForExport(html: string): string {
    // Remove the visual span label but keep the page-break div with proper CSS
    return html.replace(/<span class="page-break-label"[^>]*>[^<]*<\/span>/gi, '')
        .replace(/<hr[^>]*>/gi, ''); // Remove hr in page breaks
}
