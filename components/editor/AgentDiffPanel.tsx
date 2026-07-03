'use client';

import { useState } from 'react';
import { Check, X, ChevronDown, ChevronUp, Wand2, AlertTriangle, CheckCheck, XCircle } from 'lucide-react';
import { type SectionEdit } from '@/lib/ai/agent-edit';

interface AgentDiffPanelProps {
    edits: SectionEdit[];
    summary: string;
    instruction: string;
    onApply: (acceptedEdits: SectionEdit[]) => void;
    onClose: () => void;
}

export default function AgentDiffPanel({ edits, summary, instruction, onApply, onClose }: AgentDiffPanelProps) {
    // Track which edits are accepted (all accepted by default)
    const [accepted, setAccepted] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        edits.forEach(e => { initial[e.sectionId] = true; });
        return initial;
    });
    // Track which edits are expanded to show full diff
    const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        edits.forEach(e => { initial[e.sectionId] = true; }); // All expanded by default
        return initial;
    });

    const toggleAccepted = (sectionId: string) => {
        setAccepted(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
    };

    const toggleExpanded = (sectionId: string) => {
        setExpanded(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
    };

    const acceptAll = () => {
        const all: Record<string, boolean> = {};
        edits.forEach(e => { all[e.sectionId] = true; });
        setAccepted(all);
    };

    const rejectAll = () => {
        const all: Record<string, boolean> = {};
        edits.forEach(e => { all[e.sectionId] = false; });
        setAccepted(all);
    };

    const handleApply = () => {
        const acceptedEdits = edits.filter(e => accepted[e.sectionId]);
        onApply(acceptedEdits);
    };

    const acceptedCount = Object.values(accepted).filter(Boolean).length;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-200">
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <Wand2 size={18} className="text-white" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-base font-semibold text-gray-900">
                                AROKO Agent — {edits.length} change{edits.length !== 1 ? 's' : ''} proposed
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">{summary}</p>
                        </div>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-medium text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                            &quot;{instruction.length > 60 ? instruction.substring(0, 60) + '...' : instruction}&quot;
                        </span>
                    </div>
                </div>

                {/* Edits List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {edits.map((edit) => (
                        <div
                            key={edit.sectionId}
                            className={`rounded-xl border transition-all duration-200 ${
                                accepted[edit.sectionId]
                                    ? 'border-green-200 bg-green-50/30'
                                    : 'border-gray-200 bg-gray-50/50 opacity-60'
                            }`}
                        >
                            {/* Section Header */}
                            <div className="flex items-center gap-3 px-4 py-3">
                                <button
                                    onClick={() => toggleAccepted(edit.sectionId)}
                                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                                        accepted[edit.sectionId]
                                            ? 'bg-green-500 border-green-500 text-white'
                                            : 'bg-white border-gray-300 text-transparent hover:border-gray-400'
                                    }`}
                                >
                                    <Check size={14} />
                                </button>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-semibold text-gray-900 truncate">{edit.sectionTitle}</h3>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                            edit.impact === 'MAJOR'
                                                ? 'bg-orange-100 text-orange-700'
                                                : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {edit.impact}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">{edit.explanation}</p>
                                </div>
                                <button
                                    onClick={() => toggleExpanded(edit.sectionId)}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                                >
                                    {expanded[edit.sectionId] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                            </div>

                            {/* Diff Content */}
                            {expanded[edit.sectionId] && (
                                <div className="px-4 pb-4 space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        {/* Original */}
                                        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                            <p className="text-[10px] text-red-600 font-semibold mb-1.5 uppercase tracking-wide">Original</p>
                                            <p className="text-xs text-red-800 leading-relaxed line-through whitespace-pre-wrap">
                                                {edit.originalContent.substring(0, 500)}{edit.originalContent.length > 500 ? '...' : ''}
                                            </p>
                                        </div>
                                        {/* Replacement */}
                                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                            <p className="text-[10px] text-green-600 font-semibold mb-1.5 uppercase tracking-wide">Replacement</p>
                                            <p className="text-xs text-green-800 leading-relaxed whitespace-pre-wrap">
                                                {edit.newContent.substring(0, 500)}{edit.newContent.length > 500 ? '...' : ''}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <button onClick={acceptAll} className="text-xs text-green-700 hover:text-green-800 font-medium flex items-center gap-1">
                            <CheckCheck size={14} /> Select All
                        </button>
                        <span className="text-gray-300">|</span>
                        <button onClick={rejectAll} className="text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1">
                            <XCircle size={14} /> Deselect All
                        </button>
                    </div>
                    <div className="flex-1" />
                    <span className="text-xs text-gray-500">
                        {acceptedCount} of {edits.length} selected
                    </span>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={acceptedCount === 0}
                        className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                        <Check size={14} />
                        Apply {acceptedCount} Edit{acceptedCount !== 1 ? 's' : ''}
                    </button>
                </div>
            </div>
        </div>
    );
}
