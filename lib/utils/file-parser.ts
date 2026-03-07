// Client-side file parsing for Knowledge Base
// Parses PDF and DOCX files entirely in the browser

export interface ParseResult {
    success: boolean;
    text?: string;
    error?: string;
}

/**
 * Extract text from a PDF file using pdfjs-dist
 */
export async function extractTextFromPdf(file: File): Promise<ParseResult> {
    try {
        // Dynamic import to avoid server-side execution
        const pdfjsLib = await import('pdfjs-dist');

        // Set up PDF.js worker
        if (typeof window !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        }

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let fullText = '';

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
            fullText += pageText + '\n\n';
        }

        return { success: true, text: fullText.trim() };
    } catch (error: any) {
        console.error('PDF parsing error:', error);
        return { success: false, error: error.message || 'Failed to parse PDF' };
    }
}

/**
 * Extract text from a DOCX file using mammoth
 */
export async function extractTextFromDocx(file: File): Promise<ParseResult> {
    try {
        // Dynamic import to avoid server-side execution
        const { default: mammoth } = await import('mammoth');

        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });

        return { success: true, text: result.value.trim() };
    } catch (error: any) {
        console.error('DOCX parsing error:', error);
        return { success: false, error: error.message || 'Failed to parse DOCX' };
    }
}

/**
 * Parse any supported file type
 */
export async function parseFile(file: File): Promise<ParseResult> {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        return extractTextFromPdf(file);
    }

    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
        return extractTextFromDocx(file);
    }

    return {
        success: false,
        error: 'Unsupported file type. Please upload PDF or DOCX files.'
    };
}
