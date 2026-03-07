// Pure utility function for extracting citations - NO server action

export interface ExtractedCitation {
    inText: string;           // e.g., "(Sweller, 1988)"
    author: string;           // e.g., "Sweller"
    year: string;             // e.g., "1988"
    fullReference?: string;   // Full reference if AI can generate it
}

// Extract all in-text citations from document
export function extractCitationsFromText(text: string): ExtractedCitation[] {
    const citations: ExtractedCitation[] = [];
    const seen = new Set<string>();

    // Pattern for (Author, Year) or (Author et al., Year)
    const pattern = /\(([A-Z][a-zA-Z]+(?:\s+(?:et\s+al\.|\&\s+[A-Z][a-zA-Z]+))?),?\s*(\d{4})\)/g;

    let match;
    while ((match = pattern.exec(text)) !== null) {
        const inText = match[0];
        const author = match[1].trim();
        const year = match[2];

        // Avoid duplicates
        const key = `${author}-${year}`;
        if (!seen.has(key)) {
            seen.add(key);
            citations.push({ inText, author, year });
        }
    }

    // Sort by author name
    citations.sort((a, b) => a.author.localeCompare(b.author));

    return citations;
}
