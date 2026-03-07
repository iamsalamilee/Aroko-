'use server';

import { generateText } from 'ai';
import { getTextModel } from '@/lib/ai/models';
import {
    getCitationRegistry,
    findCitation,
    formatReference,
    type CitationRecord
} from '@/lib/storage/citation-registry';

// Citation extraction interface
export interface ExtractedCitation {
    inText: string;
    author: string;
    year: string;
    fullReference?: string;
}

// Paper interface
export interface AcademicPaper {
    paperId: string;
    title: string;
    authors: string[];
    year: number;
    abstract: string;
    citationCount: number;
    url: string;
    relevanceScore: number;
    venue?: string; // Journal or conference name
}

// Extract all in-text citations from document
function extractCitationsFromText(text: string): ExtractedCitation[] {
    const citations: ExtractedCitation[] = [];
    const seen = new Set<string>();
    const pattern = /\(([A-Z][a-zA-Z]+(?:\s+(?:et\s+al\.|\&\s+[A-Z][a-zA-Z]+))?),?\s*(\d{4})\)/g;

    let match;
    while ((match = pattern.exec(text)) !== null) {
        const inText = match[0];
        const author = match[1].trim();
        const year = match[2];
        const key = `${author}-${year}`;
        if (!seen.has(key)) {
            seen.add(key);
            citations.push({ inText, author, year });
        }
    }
    citations.sort((a, b) => a.author.localeCompare(b.author));
    return citations;
}

// Generate full reference entries using Citation Registry (NOT AI hallucination!)
export async function generateReferencesAction(
    citations: ExtractedCitation[],
    citationStyle: 'APA' | 'Harvard' | 'Chicago' = 'APA',
    documentId?: string
): Promise<{ success: boolean; references?: string; error?: string; missing?: string[] }> {
    if (citations.length === 0) {
        return { success: true, references: '<p><em>No citations found in document.</em></p>' };
    }

    try {
        const references: string[] = [];
        const missingCitations: string[] = [];

        for (const citation of citations) {
            // Look up in Citation Registry - use REAL data, not AI
            const record = findCitation(citation.author, citation.year, documentId);

            if (record) {
                // Found in registry - format using actual metadata
                const formattedRef = formatReference(record, citationStyle);
                references.push(`<p>${formattedRef}</p>`);
                console.log(`✅ Reference found: ${citation.author} (${citation.year})`);
            } else {
                // NOT in registry - don't fabricate, mark as missing
                missingCitations.push(`(${citation.author}, ${citation.year})`);
                references.push(
                    `<p class="text-amber-600">⚠️ <strong>${citation.author} (${citation.year})</strong> - ` +
                    `<em>Citation not found in your sources. Upload the PDF or add via Paper Search.</em></p>`
                );
                console.log(`⚠️ Reference missing: ${citation.author} (${citation.year})`);
            }
        }

        return {
            success: true,
            references: references.join('\n'),
            missing: missingCitations.length > 0 ? missingCitations : undefined
        };
    } catch (error: any) {
        console.error('Reference generation error:', error);
        return { success: false, error: error.message };
    }
}

// Combined action: Extract and generate references
export async function extractAndGenerateReferencesAction(
    documentText: string,
    citationStyle: 'APA' | 'Harvard' | 'Chicago' = 'APA'
): Promise<{ success: boolean; citations?: ExtractedCitation[]; references?: string; error?: string }> {
    const citations = extractCitationsFromText(documentText);

    if (citations.length === 0) {
        return {
            success: true,
            citations: [],
            references: '<p><em>No in-text citations found. Add citations in format (Author, Year) to auto-generate references.</em></p>'
        };
    }

    const result = await generateReferencesAction(citations, citationStyle);

    return {
        success: result.success,
        citations,
        references: result.references,
        error: result.error
    };
}

// Common stop words to filter out (universal, not domain-specific)
const STOP_WORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can',
    'this', 'that', 'these', 'those', 'it', 'its', 'i', 'me', 'my', 'we', 'our', 'you',
    'your', 'he', 'she', 'they', 'them', 'their', 'what', 'which', 'who', 'how', 'when',
    'where', 'why', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'some', 'any',
    'no', 'not', 'only', 'same', 'so', 'than', 'very', 'just', 'about', 'into', 'over',
]);

/**
 * AI-powered query expansion
 * Uses cheap model to generate related academic search terms
 * Cost: ~$0.00001 per query (essentially free)
 */
async function expandQueryWithAI(query: string): Promise<string[]> {
    try {
        const prompt = `Academic paper search query: "${query}"

Generate 3-4 related academic search phrases that would find relevant papers on this topic.
Focus on: synonyms, related concepts, and specific terminology.

Return ONLY the phrases, one per line. No numbering, no explanations.

Example for "ai in agriculture":
precision agriculture machine learning
smart farming technology
crop yield prediction using deep learning
agricultural artificial intelligence systems`;

        const { text } = await generateText({
            model: getTextModel(),
            prompt,
            temperature: 0.3,
        });

        const expansions = text
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 3 && !line.startsWith('-') && !line.match(/^\d/))
            .slice(0, 4);

        console.log('🔍 AI Query Expansion:', { original: query, expansions });
        return expansions;
    } catch (error) {
        console.warn('AI expansion failed, using original query:', error);
        return [];
    }
}

/**
 * Search OpenAlex with a single query
 */
async function searchOpenAlex(query: string, perPage: number = 15): Promise<any[]> {
    try {
        const encodedQuery = encodeURIComponent(query);
        // Use simpler filters that definitely work
        const filters = 'has_doi:true,publication_year:2018-2026,is_paratext:false';
        const url = `https://api.openalex.org/works?search=${encodedQuery}&per_page=${perPage}&filter=${filters}&mailto=aroko@research.com`;

        console.log('🔗 OpenAlex URL:', url);

        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
            console.error('OpenAlex error:', response.status, response.statusText);
            return [];
        }

        const data = await response.json();
        console.log(`📄 Query "${query.substring(0, 30)}..." returned ${data.results?.length || 0} papers`);
        return data.results || [];
    } catch (error) {
        console.error('OpenAlex fetch error:', error);
        return [];
    }
}

/**
 * Main paper search with AI expansion
 * 1. Expand query with AI (cheap model)
 * 2. Search OpenAlex with original + expanded queries
 * 3. Merge, deduplicate, and rank results
 */
export async function searchPapersAction(
    query: string,
    limit: number = 10
): Promise<{ success: boolean; papers?: AcademicPaper[]; error?: string }> {
    try {
        console.log('🔎 Starting smart search for:', query);

        // Step 1: AI-powered query expansion
        const expansions = await expandQueryWithAI(query);
        const allQueries = [query, ...expansions];

        // Step 2: Search OpenAlex with all queries in parallel
        const searchPromises = allQueries.map(q => searchOpenAlex(q, 10));
        const allResults = await Promise.all(searchPromises);

        // Step 3: Merge and deduplicate by paper ID
        const seenIds = new Set<string>();
        const mergedResults: any[] = [];

        for (const results of allResults) {
            for (const work of results) {
                const id = work.id || '';
                if (!seenIds.has(id)) {
                    seenIds.add(id);
                    mergedResults.push(work);
                }
            }
        }

        console.log(`📚 Merged ${mergedResults.length} unique papers from ${allQueries.length} queries`);

        if (mergedResults.length === 0) {
            return await fallbackSearch(encodeURIComponent(query), limit);
        }

        // Step 4: Calculate relevance scores with STRICT filtering
        const currentYear = new Date().getFullYear();
        const maxCitations = Math.max(...mergedResults.map(w => w.cited_by_count || 0), 1);

        // Extract key terms from BOTH original query AND AI expansions
        // This handles typos (e.g., "societu" → AI expands to "society")
        const allQueryText = allQueries.join(' ').toLowerCase();
        const queryTerms = allQueryText
            .split(/\s+/)
            .filter(t => t.length > 2 && !STOP_WORDS.has(t));

        // Remove duplicates
        const uniqueTerms = [...new Set(queryTerms)];

        const papers: AcademicPaper[] = mergedResults.map((work, index) => {
            const year = work.publication_year || 2015;
            const title = work.title || 'Untitled';
            const abstract = work.abstract_inverted_index
                ? reconstructAbstract(work.abstract_inverted_index)
                : '';

            // Check relevance - at least ONE query term must appear in title or abstract
            const titleLower = title.toLowerCase();
            const abstractLower = abstract.toLowerCase();
            const combinedText = titleLower + ' ' + abstractLower;

            const matchedTerms = uniqueTerms.filter(term => combinedText.includes(term));
            const titleMatches = uniqueTerms.filter(term => titleLower.includes(term));

            // Papers with ZERO query term matches are irrelevant
            const isRelevant = matchedTerms.length > 0;

            // Use minimum 5 for denominator to prevent score dilution from many AI terms
            const termCount = Math.min(uniqueTerms.length, 5);

            // Score components (total 100)
            const recencyScore = Math.max(0, (year - 2015) / (currentYear - 2015)) * 20;
            const citationScore = Math.min((work.cited_by_count || 0) / maxCitations, 1) * 20;
            // Cap matches at termCount for fair scoring
            const titleRelevance = (Math.min(titleMatches.length, termCount) / termCount) * 45;
            const abstractRelevance = (Math.min(matchedTerms.length, termCount) / termCount) * 15;

            return {
                paperId: work.id?.replace('https://openalex.org/', '') || String(index),
                title,
                authors: work.authorships?.slice(0, 5).map((a: any) => a.author?.display_name || 'Unknown') || [],
                year,
                abstract: abstract || 'No abstract available',
                citationCount: work.cited_by_count || 0,
                url: work.doi ? `https://doi.org/${work.doi.replace('https://doi.org/', '')}` : work.id || '',
                venue: work.primary_location?.source?.display_name || 'Unknown Journal',
                relevanceScore: isRelevant ? Math.round(recencyScore + citationScore + titleRelevance + abstractRelevance) : 0,
            };
        });

        // FILTER OUT irrelevant papers (score = 0)
        const relevantPapers = papers.filter(p => p.relevanceScore > 0);

        // Step 5: Sort by relevance score (higher = better)
        relevantPapers.sort((a, b) => b.relevanceScore - a.relevanceScore);

        console.log(`📊 Filtered: ${papers.length} → ${relevantPapers.length} relevant papers`);
        console.log('📊 Top papers:', relevantPapers.slice(0, 3).map(p => ({ title: p.title.substring(0, 50), score: p.relevanceScore })));

        return { success: true, papers: relevantPapers.slice(0, limit) };
    } catch (error: any) {
        console.error('Search error:', error);
        return { success: false, error: error.message };
    }
}

// Calculate how relevant the title is to the query
function calculateTitleRelevance(title: string, query: string): number {
    const titleLower = title.toLowerCase();
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);

    let matches = 0;
    for (const term of queryTerms) {
        if (titleLower.includes(term)) matches++;
    }

    return queryTerms.length > 0 ? matches / queryTerms.length : 0;
}

// Fallback search without strict filters
async function fallbackSearch(encodedQuery: string, limit: number): Promise<{ success: boolean; papers?: AcademicPaper[]; error?: string }> {
    const url = `https://api.openalex.org/works?search=${encodedQuery}&per_page=${limit}&filter=has_doi:true,publication_year:2015-2025&sort=cited_by_count:desc&mailto=aroko@research.com`;

    const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!response.ok) return { success: true, papers: [] };

    const data = await response.json();
    if (!data.results) return { success: true, papers: [] };

    const papers: AcademicPaper[] = data.results.map((work: any, index: number) => ({
        paperId: work.id?.replace('https://openalex.org/', '') || String(index),
        title: work.title || 'Untitled',
        authors: work.authorships?.slice(0, 5).map((a: any) => a.author?.display_name || 'Unknown') || [],
        year: work.publication_year || 0,
        abstract: work.abstract_inverted_index ? reconstructAbstract(work.abstract_inverted_index) : 'No abstract available',
        citationCount: work.cited_by_count || 0,
        url: work.doi ? `https://doi.org/${work.doi.replace('https://doi.org/', '')}` : work.id || '',
        venue: work.primary_location?.source?.display_name || '',
        relevanceScore: Math.round(50 + (work.cited_by_count || 0) / 100),
    }));

    return { success: true, papers };
}

// Helper to reconstruct abstract from OpenAlex inverted index format
function reconstructAbstract(invertedIndex: Record<string, number[]>): string {
    const words: [string, number][] = [];
    for (const [word, positions] of Object.entries(invertedIndex)) {
        for (const pos of positions) {
            words.push([word, pos]);
        }
    }
    words.sort((a, b) => a[1] - b[1]);
    return words.map(w => w[0]).join(' ').substring(0, 300) + '...';
}
