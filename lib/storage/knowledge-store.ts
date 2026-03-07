import { v4 as uuidv4 } from 'uuid';
import { getCurrentDocumentId } from './document-store';
import type { TextChunk } from '@/lib/utils/text-chunker';
import { scoreChunkRelevance } from '@/lib/utils/text-chunker';

export interface KnowledgeSource {
    id: string;
    name: string;
    content: string; // Full text (backup)
    chunks: TextChunk[]; // NEW: Chunked content for better retrieval
    summary?: string;
    type: 'pdf' | 'docx' | 'text' | 'url';
    createdAt: string;
    documentId: string; // Link to specific document
}

const STORAGE_KEY_PREFIX = 'aroko_knowledge_';

// Get storage key for current document
function getStorageKey(documentId?: string): string {
    const docId = documentId || getCurrentDocumentId() || 'global';
    return `${STORAGE_KEY_PREFIX}${docId}`;
}

// Get knowledge sources for current document
export function getKnowledgeSources(documentId?: string): KnowledgeSource[] {
    if (typeof window === 'undefined') return [];
    try {
        const key = getStorageKey(documentId);
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Failed to load knowledge sources', e);
        return [];
    }
}

// Add knowledge source to current document
export function addKnowledgeSource(source: Omit<KnowledgeSource, 'id' | 'createdAt' | 'documentId'>, documentId?: string): KnowledgeSource {
    const docId = documentId || getCurrentDocumentId() || 'global';
    const sources = getKnowledgeSources(docId);

    const newSource: KnowledgeSource = {
        ...source,
        id: uuidv4(),
        documentId: docId,
        createdAt: new Date().toISOString(),
    };

    sources.unshift(newSource);
    localStorage.setItem(getStorageKey(docId), JSON.stringify(sources));
    return newSource;
}

// Delete knowledge source
export function deleteKnowledgeSource(id: string, documentId?: string) {
    const docId = documentId || getCurrentDocumentId() || 'global';
    const sources = getKnowledgeSources(docId).filter(s => s.id !== id);
    localStorage.setItem(getStorageKey(docId), JSON.stringify(sources));
}

// Get context from sources using semantic chunk retrieval
export function getContextFromSources(sources: KnowledgeSource[], query: string, maxChars = 12000): string {
    // Collect all chunks from all sources
    const allChunks: TextChunk[] = [];

    sources.forEach(source => {
        if (source.chunks && source.chunks.length > 0) {
            allChunks.push(...source.chunks);
        } else {
            // Fallback for sources without chunks (legacy support)
            allChunks.push({
                id: source.id,
                sourceId: source.id,
                sourceName: source.name,
                content: source.content.substring(0, 3000),
                chunkIndex: 0,
                totalChunks: 1,
                charStart: 0,
                charEnd: source.content.length
            });
        }
    });

    // Score and rank chunks by relevance to query
    const scoredChunks = allChunks.map(chunk => ({
        chunk,
        score: scoreChunkRelevance(chunk, query)
    })).filter(s => s.score > 0); // Remove irrelevant chunks

    // Sort by score descending
    scoredChunks.sort((a, b) => b.score - a.score);

    // NEW STRATEGY: Hybrid Approach (Relevance + Diversity)
    // Instead of forcing 1 from each source (which dilutes quality),
    // we take top scoring chunks, but try to ensure not to starve other sources if they are relevant.

    // 1. Take top 3 absolute best chunks (regardless of source)
    const finalSelection: typeof scoredChunks = [];
    const usedChunkIds = new Set<string>();
    const usedSourceIds = new Set<string>();

    // Add top 3 pure relevance
    for (let i = 0; i < Math.min(3, scoredChunks.length); i++) {
        finalSelection.push(scoredChunks[i]);
        usedChunkIds.add(scoredChunks[i].chunk.id);
        usedSourceIds.add(scoredChunks[i].chunk.sourceId);
    }

    // 2. Then try to find best chunk from UNUSED sources (Diversity)
    // But only if they have a decent score (at least 20% of top score)
    if (scoredChunks.length > 0) {
        const topScore = scoredChunks[0].score;
        const diversityThreshold = topScore * 0.2;

        for (const { chunk, score } of scoredChunks) {
            if (!usedChunkIds.has(chunk.id) && !usedSourceIds.has(chunk.sourceId)) {
                if (score >= diversityThreshold) {
                    finalSelection.push({ chunk, score });
                    usedChunkIds.add(chunk.id);
                    usedSourceIds.add(chunk.sourceId);
                }
            }
        }
    }

    // 3. Fill remaining space with next best chunks (Relevance)
    for (const { chunk, score } of scoredChunks) {
        if (!usedChunkIds.has(chunk.id)) {
            finalSelection.push({ chunk, score });
            usedChunkIds.add(chunk.id);
        }
    }

    // Build context string respecting maxChars
    let context = "";
    let totalChars = 0;

    for (const { chunk } of finalSelection) {
        // Format with ACADEMIC STYLE citation - NOT filenames!
        const metadata = chunk.metadata;
        let citationLabel = '';

        if (metadata?.author && metadata?.year) {
            citationLabel = `[CITE AS: (${metadata.author}, ${metadata.year}) - Title: "${metadata.title || 'Unknown'}"]`;
        } else if (metadata?.year) {
            const nameMatch = chunk.sourceName.match(/^([A-Za-z]+)/);
            const author = nameMatch ? nameMatch[1] : 'Unknown Author';
            citationLabel = `[CITE AS: (${author}, ${metadata.year})]`;
        } else {
            const yearMatch = chunk.sourceName.match(/(\d{4})/);
            const year = yearMatch ? yearMatch[1] : 'n.d.';
            const nameMatch = chunk.sourceName.replace(/[-_]/g, ' ').match(/^([A-Za-z]+)/);
            const author = nameMatch ? nameMatch[1] : 'Unknown';
            citationLabel = `[CITE AS: (${author}, ${year}) - From: ${chunk.sourceName}]`;
        }

        const contentToAdd = `${citationLabel}\n${chunk.content}\n\n`;

        if (totalChars + contentToAdd.length <= maxChars) {
            context += contentToAdd;
            totalChars += contentToAdd.length;
        } else {
            break; // Stop if we're full
        }
    }

    return context;
}

// Clear all knowledge sources for a document
export function clearKnowledgeBase(documentId?: string) {
    const docId = documentId || getCurrentDocumentId() || 'global';
    localStorage.removeItem(getStorageKey(docId));
}
