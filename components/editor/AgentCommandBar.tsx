'use client';

import { useState, useRef, useEffect } from 'react';
import { agentEditAction, type SectionEdit, type SectionInfo } from '@/lib/ai/agent-edit';
import { parseDocumentSections, type DocumentSection } from '@/lib/ai/document-parser';
import { getKnowledgeSources, getContextFromSources } from '@/lib/storage/knowledge-store';
import { updateDocument, getCurrentDocumentId } from '@/lib/storage/document-store';
import { inlineDiffPluginKey, type PendingDiffEdit } from '@/lib/tiptap/inline-diff-extension';
import { Loader2, Sparkles, Send, X } from 'lucide-react';

interface AgentCommandBarProps {
    editor: any;
}

export default function AgentCommandBar({ editor }: AgentCommandBarProps) {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [pendingEdits, setPendingEdits] = useState<PendingDiffEdit[]>([]);
    
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-hide status messages after 6 seconds
    useEffect(() => {
        if (statusMessage) {
            const timer = setTimeout(() => setStatusMessage(''), 6000);
            return () => clearTimeout(timer);
        }
    }, [statusMessage]);

    // Ctrl+K to focus
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
            if (e.key === 'Escape' && pendingEdits.length === 0) {
                inputRef.current?.blur();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [pendingEdits]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !editor || isLoading) return;

        const userInstruction = input;
        setInput('');
        setIsLoading(true);
        setStatusMessage('');
        setLoadingMessage('Analyzing document structure...');

        try {
            const docMap = parseDocumentSections(editor);
            if (docMap.sections.length === 0) {
                setStatusMessage('⚠️ No sections found. Add some text to your document first.');
                return;
            }

            setLoadingMessage(`Found ${docMap.sections.length} section(s). AI is planning edits...`);

            const sectionInfos: SectionInfo[] = docMap.sections.map(s => ({
                id: s.id,
                title: s.title,
                headingLevel: s.headingLevel,
                content: s.content,
            }));

            let knowledgeContext: string | undefined;
            try {
                const sources = getKnowledgeSources();
                knowledgeContext = sources.length > 0
                    ? getContextFromSources(sources, userInstruction, 2000)
                    : undefined;
            } catch (e) {
                console.warn('[Agent] Knowledge context failed:', e);
            }

            setLoadingMessage('AI is generating edits...');
            const result = await agentEditAction(userInstruction, sectionInfos, knowledgeContext);

            if (!result.success) {
                setStatusMessage(`❌ ${result.error || 'Unknown error from AI'}`);
                return;
            }

            if (result.edits.length === 0) {
                setStatusMessage(`ℹ️ ${result.summary || 'No changes needed for this instruction.'}`);
                return;
            }

            // Convert raw edits to InlineDiff format
            const newPendingEdits: PendingDiffEdit[] = [];
            for (const edit of result.edits) {
                const section = docMap.sections.find(s => s.id === edit.sectionId);
                if (section) {
                    newPendingEdits.push({
                        id: edit.sectionId,
                        from: section.from,
                        to: section.to,
                        newHtml: convertToHTML(edit.newContent, section.headingLevel, edit.sectionTitle),
                        sectionTitle: edit.sectionTitle,
                        explanation: edit.explanation
                    });
                }
            }
            
            setPendingEdits(newPendingEdits);
            setStatusMessage(`ℹ️ Proposed ${newPendingEdits.length} changes. Review them in the document.`);
            
            // Dispatch to Tiptap to show decorations
            editor.view.dispatch(editor.state.tr.setMeta(inlineDiffPluginKey, { edits: newPendingEdits }));

        } catch (err: any) {
            console.error('[Agent] Command failed:', err);
            setStatusMessage(`❌ Error: ${err.message || 'Something went wrong.'}`);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    /**
     * Convert AI plain text response into proper HTML for Tiptap.
     */
    const convertToHTML = (text: string, headingLevel: number, sectionTitle: string): string => {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        let html = '';
        let firstLine = true;

        for (const line of lines) {
            const trimmed = line.trim();

            if (firstLine) {
                firstLine = false;
                const stripped = trimmed.replace(/^#+\s*/, '');
                if (stripped.toLowerCase() === sectionTitle.toLowerCase() || trimmed.startsWith('#')) {
                    html += `<h${headingLevel}>${stripped}</h${headingLevel}>`;
                    continue;
                }
            }
            html += `<p>${trimmed}</p>`;
        }

        if (headingLevel > 0 && !html.startsWith(`<h${headingLevel}>`)) {
            html = `<h${headingLevel}>${sectionTitle}</h${headingLevel}>` + html;
        }

        return html;
    };

    // Listen for Accept/Reject events from the inline buttons
    useEffect(() => {
        const handleAccept = (e: Event) => {
            const customEvent = e as CustomEvent;
            const id = customEvent.detail?.id;
            if (!id || !editor) return;

            const editToApply = pendingEdits.find(e => e.id === id);
            if (!editToApply) return;

            // Save version before apply
            const docId = getCurrentDocumentId();
            if (docId) {
                updateDocument(docId, editor.getHTML(), true, `Before AI edit: ${editToApply.sectionTitle}`);
            }

            // Find current positions of the section
            const freshMap = parseDocumentSections(editor);
            const section = freshMap.sections.find(s => s.id === id);
            
            if (section) {
                editor.chain()
                    .focus()
                    .setTextSelection({ from: section.from, to: section.to })
                    .deleteSelection()
                    .insertContent(editToApply.newHtml)
                    .run();
                
                if (docId) {
                    updateDocument(docId, editor.getHTML(), true, `Applied AI edit: ${editToApply.sectionTitle}`);
                }
            }

            // Remove from pending and update decorations
            const remaining = pendingEdits.filter(e => e.id !== id);
            setPendingEdits(remaining);
            editor.view.dispatch(editor.state.tr.setMeta(inlineDiffPluginKey, { edits: remaining }));
        };

        const handleReject = (e: Event) => {
            const customEvent = e as CustomEvent;
            const id = customEvent.detail?.id;
            if (!id || !editor) return;

            // Just remove from pending and update decorations
            const remaining = pendingEdits.filter(e => e.id !== id);
            setPendingEdits(remaining);
            editor.view.dispatch(editor.state.tr.setMeta(inlineDiffPluginKey, { edits: remaining }));
        };

        window.addEventListener('aroko:accept-edit', handleAccept);
        window.addEventListener('aroko:reject-edit', handleReject);

        return () => {
            window.removeEventListener('aroko:accept-edit', handleAccept);
            window.removeEventListener('aroko:reject-edit', handleReject);
        };
    }, [pendingEdits, editor]);

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50">
            {/* Status Toast */}
            {statusMessage && (
                <div className="mb-2 px-4 py-2.5 bg-white/95 backdrop-blur-md border border-gray-200 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-2">
                    <span className="text-sm text-gray-800 flex-1">{statusMessage}</span>
                    <button onClick={() => setStatusMessage('')} className="text-gray-400 hover:text-gray-600">
                        <X size={14} />
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative flex items-center bg-white/90 backdrop-blur-md border border-white/20 shadow-2xl rounded-xl p-2 pl-4">
                    <Sparkles className="w-5 h-5 text-blue-500 mr-3 animate-pulse" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isLoading ? loadingMessage : 'Tell AROKO what to change... (Ctrl+K)'}
                        className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 font-medium text-sm"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="ml-2 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </div>
            </form>
        </div>
    );
}
