'use client';

import { useState, useEffect } from 'react';
import { Clock, Star, RotateCcw, Trash2, ChevronRight } from 'lucide-react';
import {
    getDocumentHistory,
    restoreVersion,
    toggleStarVersion,
    deleteVersion,
    getCurrentDocumentId,
    getDocument,
    DocumentVersion,
    ArokoDocument
} from '@/lib/storage/document-store';

interface HistoryPanelProps {
    onRestore?: (content: string) => void;
    onClose?: () => void;
}

export default function HistoryPanel({ onRestore, onClose }: HistoryPanelProps) {
    const [history, setHistory] = useState<DocumentVersion[]>([]);
    const [currentDoc, setCurrentDoc] = useState<ArokoDocument | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        refreshHistory();
    }, []);

    const refreshHistory = () => {
        const docId = getCurrentDocumentId();
        if (docId) {
            const doc = getDocument(docId);
            setCurrentDoc(doc);
            setHistory(getDocumentHistory(docId));
        }
    };

    const handleRestore = (version: DocumentVersion) => {
        if (!currentDoc) return;

        if (confirm('Restore this version? Current content will be saved to history first.')) {
            const restored = restoreVersion(currentDoc.id, version.id);
            if (restored) {
                onRestore?.(version.content);
                refreshHistory();
            }
        }
    };

    const handleToggleStar = (versionId: string) => {
        if (!currentDoc) return;
        toggleStarVersion(currentDoc.id, versionId);
        refreshHistory();
    };

    const handleDelete = (versionId: string) => {
        if (!currentDoc) return;

        if (confirm('Delete this version?')) {
            deleteVersion(currentDoc.id, versionId);
            refreshHistory();
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getPreview = (content: string) => {
        // Strip HTML and get first 100 chars
        const text = content.replace(/<[^>]*>/g, '').trim();
        return text.length > 100 ? text.substring(0, 100) + '...' : text;
    };

    return (
        <div className="w-72 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Clock size={18} />
                    Version History
                </h2>
                {currentDoc && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                        {currentDoc.title}
                    </p>
                )}
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto p-2">
                {!currentDoc ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        No document open
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        <Clock size={24} className="mx-auto mb-2 opacity-50" />
                        No history yet
                        <p className="text-xs mt-1">
                            History is saved automatically
                        </p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {/* Current version indicator */}
                        <div className="p-2 rounded-lg bg-green-50 border border-green-200">
                            <div className="flex items-center gap-2 text-sm text-green-700">
                                <ChevronRight size={14} />
                                <span className="font-medium">Current Version</span>
                            </div>
                        </div>

                        {history.map(version => (
                            <div
                                key={version.id}
                                className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer group"
                                onClick={() => setExpandedId(expandedId === version.id ? null : version.id)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            {version.starred && (
                                                <Star size={12} className="text-amber-500 fill-amber-500" />
                                            )}
                                            <span className="text-xs text-gray-500">
                                                {formatDate(version.savedAt)}
                                            </span>
                                        </div>
                                        {version.label && (
                                            <p className="text-xs text-blue-600 mt-0.5">
                                                {version.label}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleStar(version.id);
                                            }}
                                            className={`p-1 ${version.starred ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'}`}
                                            title={version.starred ? 'Unstar' : 'Star'}
                                        >
                                            <Star size={12} className={version.starred ? 'fill-amber-500' : ''} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRestore(version);
                                            }}
                                            className="p-1 text-gray-400 hover:text-green-600"
                                            title="Restore this version"
                                        >
                                            <RotateCcw size={12} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(version.id);
                                            }}
                                            className="p-1 text-gray-400 hover:text-red-600"
                                            title="Delete"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Preview */}
                                {expandedId === version.id && (
                                    <div className="mt-2 p-2 bg-white border border-gray-200 rounded text-xs text-gray-600 max-h-32 overflow-y-auto">
                                        {getPreview(version.content)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 text-xs text-gray-400 text-center">
                {history.length} version{history.length !== 1 ? 's' : ''} saved
            </div>
        </div>
    );
}
