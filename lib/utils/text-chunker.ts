/**
 * Text Chunking Utility for Knowledge Base
 * Splits large documents into searchable chunks with overlap
 */

export interface TextChunk {
    id: string;
    sourceId: string;
    sourceName: string;
    content: string;
    chunkIndex: number;
    totalChunks: number;
    charStart: number;
    charEnd: number;
    metadata?: {
        author?: string;
        year?: string;
        title?: string;
        journal?: string;
    };
}

/**
 * Chunk text into overlapping segments for better context retrieval
 * @param text - Full document text
 * @param sourceName - Source filename
 * @param sourceId - Unique source ID
 * @param chunkSize - Target size per chunk (default 800 chars)
 * @param overlap - Overlap between chunks (default 200 chars)
 */
export function chunkText(
    text: string,
    sourceName: string,
    sourceId: string,
    chunkSize: number = 800,
    overlap: number = 200,
    metadata?: TextChunk['metadata']
): TextChunk[] {
    if (!text || text.trim().length === 0) {
        return [];
    }

    const chunks: TextChunk[] = [];
    const cleanedText = text.trim();
    let startPos = 0;
    let chunkIndex = 0;

    while (startPos < cleanedText.length) {
        let endPos = startPos + chunkSize;

        // Don't exceed text length
        if (endPos >= cleanedText.length) {
            endPos = cleanedText.length;
        } else {
            // Try to end at sentence boundary
            const remainingText = cleanedText.substring(endPos, Math.min(endPos + 100, cleanedText.length));
            const sentenceEnd = remainingText.search(/[.!?]\s/);

            if (sentenceEnd !== -1) {
                endPos = endPos + sentenceEnd + 1;
            }
        }

        const content = cleanedText.substring(startPos, endPos).trim();

        if (content.length > 0) {
            chunks.push({
                id: `${sourceId}_chunk_${chunkIndex}`,
                sourceId,
                sourceName,
                content,
                chunkIndex,
                totalChunks: 0, // Will update after all chunks created
                charStart: startPos,
                charEnd: endPos,
                metadata
            });
        }

        chunkIndex++;
        startPos = endPos - overlap;

        // Prevent infinite loop
        if (startPos >= cleanedText.length - overlap) {
            break;
        }
    }

    // Update total chunks count
    chunks.forEach(chunk => {
        chunk.totalChunks = chunks.length;
    });

    return chunks;
}


/**
 * Score a chunk's relevance to a query
 * Simple keyword matching (can be enhanced with embeddings later)
 */
/**
 * Score a chunk's relevance to a query
 * Enhanced keyword matching with:
 * - Stop word filtering
 * - Exact phrase bonus
 * - Unique term coverage bonus
 * - Length normalization
 */
export function scoreChunkRelevance(chunk: TextChunk, query: string): number {
    if (!query || query.trim().length === 0) return 0;

    const lowerContent = chunk.content.toLowerCase();
    const lowerQuery = query.toLowerCase();

    // 1. Stop words to ignore
    const stopWords = new Set(['the', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'it', 'that', 'this']);

    // 2. Extract meaningful terms
    const queryTerms = lowerQuery
        .split(/[^a-z0-9]+/i)
        .filter(t => t.length > 2 && !stopWords.has(t));

    if (queryTerms.length === 0) return 0;

    let score = 0;
    const matchedTerms = new Set<string>();

    // 3. Score each term matches
    queryTerms.forEach(term => {
        const regex = new RegExp(`\\b${term}\\b`, 'gi'); // Match whole words only
        const matches = lowerContent.match(regex);

        if (matches) {
            // Base score: 1 point per occurrence
            score += matches.length;
            matchedTerms.add(term);
        }
    });

    // 4. Bonus for coverage (how many UNIQUE query terms found)
    // Finding "livestock" AND "disease" is better than finding "livestock" 10 times
    const coverageRatio = matchedTerms.size / queryTerms.length;
    score *= (1 + coverageRatio * 2); // Up to 3x multiplier for full coverage

    // 5. Bonus for exact phrase match (if query is multiple words)
    if (queryTerms.length > 1 && lowerContent.includes(lowerQuery)) {
        score += 10;
    }

    // 6. Bonus for title match
    if (chunk.metadata?.title && chunk.metadata.title.toLowerCase().includes(lowerQuery)) {
        score += 5;
    }

    // 7. Small Penalty for very long chunks (density check)
    // Normalize slightly so massive chunks don't just win by having more words
    const lengthPenalty = Math.max(1, chunk.content.length / 1000);

    return score / lengthPenalty;
}
