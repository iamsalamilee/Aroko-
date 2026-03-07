/**
 * Citation Registry
 * 
 * Central storage for REAL citation data from:
 * 1. Uploaded PDFs (extracted metadata)
 * 2. Paper Search (OpenAlex data)
 * 3. Manual user input
 * 
 * This eliminates AI hallucination - references come from actual sources.
 */

import { getCurrentDocumentId } from './document-store';

// Full citation record with all metadata needed for reference generation
export interface CitationRecord {
    key: string;                    // Unique key: "AuthorLastName-Year" e.g., "Emeana-2020"

    // Core citation data
    authors: string[];              // ["Emeana, M. O.", "Okoro, O. E.", "Ekeke, C. E."]
    authorDisplay: string;          // "Emeana et al." or "Emeana & Okoro" for in-text
    year: string;                   // "2020"
    title: string;                  // Full paper title

    // Publication details
    journal?: string;               // "Journal of Environmental Science and Health"
    volume?: string;                // "55"
    issue?: string;                 // "4"
    pages?: string;                 // "347-355"
    publisher?: string;             // For books
    doi?: string;                   // "10.1080/..."
    url?: string;                   // Direct link

    // Source tracking
    source: 'pdf' | 'search' | 'manual';
    sourceId?: string;              // ID of the PDF/search result
    linkedChunkIds?: string[];      // Chunk IDs from this source (for context)

    // Timestamps
    addedAt: string;
    documentId: string;
}

const STORAGE_KEY_PREFIX = 'aroko_citations_';

// Get storage key for current document
function getStorageKey(documentId?: string): string {
    const docId = documentId || getCurrentDocumentId() || 'global';
    return `${STORAGE_KEY_PREFIX}${docId}`;
}

// Generate citation key from author and year
export function generateCitationKey(authorLastName: string, year: string): string {
    const cleanAuthor = authorLastName
        .split(',')[0]  // Get last name only
        .trim()
        .replace(/[^a-zA-Z]/g, '');  // Remove non-letters
    return `${cleanAuthor}-${year}`;
}

// Get all citations for current document
export function getCitationRegistry(documentId?: string): CitationRecord[] {
    if (typeof window === 'undefined') return [];
    try {
        const key = getStorageKey(documentId);
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Failed to load citation registry', e);
        return [];
    }
}

// Get citation by key
export function getCitationByKey(key: string, documentId?: string): CitationRecord | undefined {
    const registry = getCitationRegistry(documentId);
    return registry.find(c => c.key.toLowerCase() === key.toLowerCase());
}

// Find citation by author name and year (flexible matching)
export function findCitation(author: string, year: string, documentId?: string): CitationRecord | undefined {
    const registry = getCitationRegistry(documentId);
    const searchKey = generateCitationKey(author, year).toLowerCase();

    // Exact match first
    let found = registry.find(c => c.key.toLowerCase() === searchKey);
    if (found) return found;

    // Fuzzy match: check if any citation's author contains the search term
    found = registry.find(c => {
        const authorMatch = c.authors.some(a =>
            a.toLowerCase().includes(author.toLowerCase()) ||
            author.toLowerCase().includes(a.split(',')[0].toLowerCase())
        );
        return authorMatch && c.year === year;
    });

    return found;
}

// Add citation to registry
export function addCitation(citation: Omit<CitationRecord, 'key' | 'addedAt' | 'documentId'>): CitationRecord {
    const docId = getCurrentDocumentId() || 'global';
    const registry = getCitationRegistry(docId);

    // Generate key from first author's last name
    const firstAuthor = citation.authors[0] || 'Unknown';
    const authorLastName = firstAuthor.split(',')[0].trim();
    const key = generateCitationKey(authorLastName, citation.year);

    // Check if already exists
    const existing = registry.find(c => c.key === key);
    if (existing) {
        // Update existing citation with new data (merge)
        Object.assign(existing, citation, { key });
        localStorage.setItem(getStorageKey(docId), JSON.stringify(registry));
        return existing;
    }

    // Create new citation
    const newCitation: CitationRecord = {
        ...citation,
        key,
        addedAt: new Date().toISOString(),
        documentId: docId,
    };

    registry.push(newCitation);
    localStorage.setItem(getStorageKey(docId), JSON.stringify(registry));

    console.log(`📚 Citation added to registry: ${key}`);
    return newCitation;
}

// Add citation from OpenAlex paper search result
export function addCitationFromSearch(paper: {
    title: string;
    authors: string[];
    year: number;
    venue?: string;
    citationCount?: number;
    url?: string;
    paperId?: string;
}): CitationRecord {
    return addCitation({
        authors: paper.authors,
        authorDisplay: formatAuthorDisplay(paper.authors),
        year: String(paper.year),
        title: paper.title,
        journal: paper.venue,
        url: paper.url,
        source: 'search',
        sourceId: paper.paperId,
    });
}

// Add citation from uploaded PDF (with extracted metadata)
export function addCitationFromPDF(metadata: {
    author?: string;
    title?: string;
    year?: string;
    journal?: string;
    doi?: string;
}, sourceId: string, chunkIds: string[]): CitationRecord {
    // Parse author string into array
    const authors = metadata.author
        ? metadata.author.split(/[,&]/).map(a => a.trim()).filter(a => a.length > 0)
        : ['Unknown Author'];

    return addCitation({
        authors,
        authorDisplay: formatAuthorDisplay(authors),
        year: metadata.year || 'n.d.',
        title: metadata.title || 'Untitled Document',
        journal: metadata.journal,
        doi: metadata.doi,
        source: 'pdf',
        sourceId,
        linkedChunkIds: chunkIds,
    });
}

// Format author display for in-text citation
function formatAuthorDisplay(authors: string[]): string {
    if (authors.length === 0) return 'Unknown';

    const firstLastName = authors[0].split(',')[0].trim();

    if (authors.length === 1) {
        return firstLastName;
    } else if (authors.length === 2) {
        const secondLastName = authors[1].split(',')[0].trim();
        return `${firstLastName} & ${secondLastName}`;
    } else {
        return `${firstLastName} et al.`;
    }
}

// Format full reference in specified style
export function formatReference(citation: CitationRecord, style: 'APA' | 'Harvard' | 'Chicago' = 'APA'): string {
    const { authors, year, title, journal, volume, issue, pages, doi, publisher } = citation;

    // Format authors based on style
    const formatAuthors = () => {
        if (style === 'APA') {
            // APA: Last, F. M., & Last, F. M.
            return authors.map((a, i) => {
                if (i === authors.length - 1 && authors.length > 1) {
                    return `& ${a}`;
                }
                return a;
            }).join(', ').replace(', &', ' &');
        } else if (style === 'Harvard') {
            // Harvard: Last, F.M. and Last, F.M.
            return authors.map((a, i) => {
                if (i === authors.length - 1 && authors.length > 1) {
                    return `and ${a}`;
                }
                return a;
            }).join(', ').replace(', and', ' and');
        } else {
            // Chicago: Last, First M., and First M. Last
            return authors.join(', ');
        }
    };

    let ref = '';

    if (style === 'APA') {
        // APA 7th: Author, A. A. (Year). Title of article. Journal Name, Volume(Issue), Pages. DOI
        ref = `${formatAuthors()} (${year}). ${title}.`;
        if (journal) ref += ` <em>${journal}</em>`;
        if (volume) ref += `, ${volume}`;
        if (issue) ref += `(${issue})`;
        if (pages) ref += `, ${pages}`;
        ref += '.';
        if (doi) ref += ` https://doi.org/${doi.replace('https://doi.org/', '')}`;
    } else if (style === 'Harvard') {
        // Harvard: Author, A.A. (Year) Title of article. Journal Name, Volume(Issue), pp.Pages.
        ref = `${formatAuthors()} (${year}) ${title}.`;
        if (journal) ref += ` <em>${journal}</em>`;
        if (volume) ref += `, ${volume}`;
        if (issue) ref += `(${issue})`;
        if (pages) ref += `, pp.${pages}`;
        ref += '.';
    } else {
        // Chicago: Author. "Title." Journal Volume, no. Issue (Year): Pages. DOI.
        ref = `${formatAuthors()}. "${title}."`;
        if (journal) ref += ` <em>${journal}</em>`;
        if (volume) ref += ` ${volume}`;
        if (issue) ref += `, no. ${issue}`;
        if (year) ref += ` (${year})`;
        if (pages) ref += `: ${pages}`;
        ref += '.';
        if (doi) ref += ` https://doi.org/${doi.replace('https://doi.org/', '')}`;
    }

    return ref;
}

// Delete citation by key
export function deleteCitation(key: string, documentId?: string): void {
    const docId = documentId || getCurrentDocumentId() || 'global';
    const registry = getCitationRegistry(docId).filter(c => c.key !== key);
    localStorage.setItem(getStorageKey(docId), JSON.stringify(registry));
}

// Clear all citations for a document
export function clearCitationRegistry(documentId?: string): void {
    const docId = documentId || getCurrentDocumentId() || 'global';
    localStorage.removeItem(getStorageKey(docId));
}

// Get all citation keys as a set (for quick lookup)
export function getCitationKeys(documentId?: string): Set<string> {
    const registry = getCitationRegistry(documentId);
    return new Set(registry.map(c => c.key.toLowerCase()));
}
