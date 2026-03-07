'use client';

import { useState } from 'react';
import { Search, Loader2, ExternalLink, BookOpen, Users, Calendar } from 'lucide-react';
import { searchPapersAction, AcademicPaper } from '@/lib/ai/extract-citations';

interface PaperSearchProps {
    onPaperSelect?: (paper: AcademicPaper) => void;
}

export default function PaperSearch({ onPaperSelect }: PaperSearchProps) {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [papers, setPapers] = useState<AcademicPaper[]>([]);
    const [searched, setSearched] = useState(false);
    const [visibleCount, setVisibleCount] = useState(10);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setIsSearching(true);
        setSearched(true);
        setVisibleCount(10);

        const result = await searchPapersAction(query, 30);

        if (result.success && result.papers) {
            setPapers(result.papers);
        } else {
            alert('Search failed: ' + result.error);
        }

        setIsSearching(false);
    };

    // Absolute score-based badges (honest representation)
    const getRelevanceBadge = (score: number) => {
        if (score >= 80) {
            return (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                    🥇 Best
                </span>
            );
        } else if (score >= 50) {
            return (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                    🥈 Good
                </span>
            );
        } else {
            return (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 font-medium">
                    🥉 Match
                </span>
            );
        }
    };

    const visiblePapers = papers.slice(0, visibleCount);
    const hasMore = papers.length > visibleCount;

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 text-white">
                <div className="flex items-center gap-2">
                    <BookOpen size={20} />
                    <h3 className="font-semibold">Find Research Papers</h3>
                </div>
                <p className="text-xs text-blue-100 mt-1">Search 200M+ papers • Download PDF → Upload to cite</p>
            </div>

            <div className="p-4 space-y-4">
                {/* Search Input */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="e.g., CNN crop disease detection Africa"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-black focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={isSearching || !query.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                    </button>
                </div>

                {/* Results */}
                {searched && (
                    <div className="space-y-2">
                        <div className="max-h-80 overflow-y-auto space-y-2">
                            {papers.length === 0 && !isSearching && (
                                <p className="text-gray-500 text-sm text-center py-4">No papers found. Try different keywords.</p>
                            )}

                            {visiblePapers.map((paper) => (
                                <div
                                    key={paper.paperId}
                                    className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <h4 className="text-sm font-medium text-gray-800 line-clamp-2">{paper.title}</h4>
                                        {getRelevanceBadge(paper.relevanceScore)}
                                    </div>

                                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Users size={12} />
                                            {paper.authors.slice(0, 2).join(', ')}{paper.authors.length > 2 ? ' et al.' : ''}
                                        </span>
                                        {paper.year > 0 && (
                                            <span className="flex items-center gap-1 font-medium text-blue-600">
                                                <Calendar size={12} />
                                                {paper.year}
                                            </span>
                                        )}
                                        <span className="text-gray-400">{paper.citationCount} citations</span>
                                    </div>

                                    {paper.venue && paper.venue !== 'Unknown Journal' && (
                                        <p className="text-xs text-purple-600 mt-1 italic line-clamp-1">📚 {paper.venue}</p>
                                    )}

                                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">{paper.abstract}</p>

                                    <div className="flex items-center gap-2 mt-3">
                                        <a
                                            href={paper.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                        >
                                            <ExternalLink size={12} />
                                            View & Download
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Load More Button */}
                        {hasMore && (
                            <button
                                onClick={() => setVisibleCount(prev => prev + 10)}
                                className="w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors"
                            >
                                Load More ({papers.length - visibleCount} remaining)
                            </button>
                        )}

                        {/* Help text */}
                        <p className="text-xs text-gray-400 text-center pt-2">
                            💡 Found a useful paper? Download the PDF and upload it to cite automatically.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
