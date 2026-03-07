'use server';

// PDF Parsing has been disabled per user request.
// This function now returns a placeholder to prevent errors if called.

export async function extractTextFromPdf(formData: FormData): Promise<{ success: boolean; text?: string; error?: string }> {
    console.log('⚠️ PDF Parsing is disabled.');
    return {
        success: false,
        error: 'PDF Parsing feature has been disabled.'
    };
}
