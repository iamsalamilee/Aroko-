'use server';

import { generateText } from 'ai';
import { getTextModel } from '@/lib/ai/models';

// Basic metadata (backwards compatible)
export interface ExtractedMetadata {
    author: string;      // Last name of first author for display
    year: string;
    title: string;
}

// Full citation metadata for registry
export interface FullCitationMetadata extends ExtractedMetadata {
    authors: string[];   // All authors in "LastName, F.M." format
    journal?: string;    // Journal or conference name
    volume?: string;
    issue?: string;
    pages?: string;
    doi?: string;
    publisher?: string;
    abstract?: string;
}

/**
 * Use AI to extract FULL citation metadata from academic paper text
 * Returns all fields needed for proper reference generation
 */
export async function extractMetadataWithAI(
    text: string,
    filename: string
): Promise<ExtractedMetadata> {
    // Call the full extraction and return basic format for backwards compatibility
    const full = await extractFullMetadataWithAI(text, filename);
    return {
        author: full.author,
        year: full.year,
        title: full.title,
    };
}

/**
 * Extract FULL citation metadata for Citation Registry
 * Includes all authors, journal, DOI, etc.
 */
export async function extractFullMetadataWithAI(
    text: string,
    filename: string
): Promise<FullCitationMetadata> {
    try {
        // Use first 3000 chars - need more for journal/DOI info
        const textSample = text.substring(0, 3000);

        const prompt = `Extract complete bibliographic metadata from this academic paper.

TEXT (first portion of document):
"""
${textSample}
"""

FILENAME: "${filename}"

INSTRUCTIONS:
1. Find ALL AUTHORS of this document (the people who wrote it, NOT citations within)
2. Find the PUBLICATION YEAR
3. Find the TITLE
4. Find the JOURNAL or CONFERENCE name (if applicable)
5. Find VOLUME, ISSUE, PAGES if this is a journal article
6. Find the DOI if present (usually starts with 10.)

RESPOND IN THIS EXACT FORMAT:
AUTHORS: [Comma-separated list in "LastName, F.M." format, e.g., "Smith, J.D., Johnson, A.B."]
YEAR: [4-digit year, or "n.d." if not found]
TITLE: [Full title of the paper]
JOURNAL: [Journal/conference name, or "none" if not applicable]
VOLUME: [Volume number, or "none"]
ISSUE: [Issue number, or "none"]
PAGES: [Page range like "123-145", or "none"]
DOI: [DOI string, or "none"]

Example response:
AUTHORS: Emeana, M.O., Okoro, O.E., Ekeke, C.E.
YEAR: 2020
TITLE: Assessing the impact of climate change on food security in sub-Saharan Africa
JOURNAL: Journal of Environmental Science and Health, Part B
VOLUME: 55
ISSUE: 4
PAGES: 347-355
DOI: 10.1080/03601234.2020.1234567`;

        const { text: result } = await generateText({
            model: getTextModel(),
            prompt,
        });

        // Parse the response
        const authorsMatch = result.match(/AUTHORS:\s*(.+)/i);
        const yearMatch = result.match(/YEAR:\s*(\d{4}|n\.d\.)/i);
        const titleMatch = result.match(/TITLE:\s*(.+)/i);
        const journalMatch = result.match(/JOURNAL:\s*(.+)/i);
        const volumeMatch = result.match(/VOLUME:\s*(.+)/i);
        const issueMatch = result.match(/ISSUE:\s*(.+)/i);
        const pagesMatch = result.match(/PAGES:\s*(.+)/i);
        const doiMatch = result.match(/DOI:\s*(10\.[^\s]+|none)/i);

        // Parse authors into array
        const authorsString = authorsMatch?.[1]?.trim() || 'Unknown Author';
        const authors = authorsString
            .split(/[,;](?=\s*[A-Z])/)  // Split on comma followed by capital letter
            .map(a => a.trim())
            .filter(a => a.length > 0 && a.toLowerCase() !== 'none');

        // Get first author's last name for display
        const firstAuthor = authors[0] || 'Unknown';
        const authorLastName = firstAuthor.split(',')[0].trim();
        const authorDisplay = authors.length > 2
            ? `${authorLastName} et al.`
            : authors.length === 2
                ? `${authorLastName} & ${authors[1].split(',')[0].trim()}`
                : authorLastName;

        const parseField = (match: RegExpMatchArray | null): string | undefined => {
            const value = match?.[1]?.trim();
            return value && value.toLowerCase() !== 'none' ? value : undefined;
        };

        const metadata: FullCitationMetadata = {
            author: authorDisplay,
            authors: authors.length > 0 ? authors : ['Unknown Author'],
            year: yearMatch?.[1]?.trim() || 'n.d.',
            title: titleMatch?.[1]?.trim() || filename.replace(/\.[^.]+$/, ''),
            journal: parseField(journalMatch),
            volume: parseField(volumeMatch),
            issue: parseField(issueMatch),
            pages: parseField(pagesMatch),
            doi: parseField(doiMatch),
        };

        console.log('📄 Full metadata extracted:', {
            author: metadata.author,
            year: metadata.year,
            title: metadata.title?.substring(0, 50) + '...',
            journal: metadata.journal,
            doi: metadata.doi,
        });

        return metadata;
    } catch (error) {
        console.error('AI metadata extraction failed:', error);
        // Fallback to filename-based extraction
        const yearFromFilename = filename.match(/(\d{4})/)?.[1] || 'n.d.';
        const nameFromFilename = filename
            .replace(/\.[^.]+$/, '')
            .replace(/[-_]/g, ' ')
            .split(' ')[0];

        return {
            author: nameFromFilename || 'Unknown',
            authors: [nameFromFilename || 'Unknown Author'],
            year: yearFromFilename,
            title: filename.replace(/\.[^.]+$/, ''),
        };
    }
}
