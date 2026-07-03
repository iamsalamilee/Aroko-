"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import MainLayout from "@/components/layout/MainLayout";
import TiptapEditor from "@/components/editor/TiptapEditor";
import AgentCommandBar from "@/components/editor/AgentCommandBar";
import { type DocumentStructure } from "@/lib/schemas/document-schema";
import {
    getCurrentDocument,
    updateDocument,
    createDocument,
    ArokoDocument
} from '@/lib/storage/document-store';

export default function Home() {
    const [aiData, setAiData] = useState<DocumentStructure | null>(null);
    const [editor, setEditor] = useState<any>(null);
    const [currentDoc, setCurrentDoc] = useState<ArokoDocument | null>(null);
    const [selectedText, setSelectedText] = useState<string>('');
    const editorRef = useRef<any>(null);
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Load initial document on mount
    useEffect(() => {
        let doc = getCurrentDocument();
        if (!doc) {
            // Create default document if none exists
            doc = createDocument('Untitled Document');
        }
        setCurrentDoc(doc);
    }, []);

    // Auto-save every 30 seconds
    useEffect(() => {
        if (!editor || !currentDoc) return;

        const saveContent = () => {
            const content = editor.getHTML();
            updateDocument(currentDoc.id, content, true, 'Auto-save');
        };

        autoSaveTimerRef.current = setInterval(saveContent, 30000);

        return () => {
            if (autoSaveTimerRef.current) {
                clearInterval(autoSaveTimerRef.current);
            }
        };
    }, [editor, currentDoc]);

    // Save before unload
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (editor && currentDoc) {
                const content = editor.getHTML();
                updateDocument(currentDoc.id, content, true, 'Before close');
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [editor, currentDoc]);

    const handleEditorReady = useCallback((editorInstance: any) => {
        editorRef.current = editorInstance;
        setEditor(editorInstance);

        // Load content if document exists
        const doc = getCurrentDocument();
        if (doc && doc.content && editorInstance) {
            editorInstance.commands.setContent(doc.content);
        }
    }, []);

    // Track selection changes in editor
    useEffect(() => {
        if (!editor) return;

        const handleSelectionUpdate = () => {
            const { from, to } = editor.state.selection;
            if (from !== to) {
                const text = editor.state.doc.textBetween(from, to, ' ');
                setSelectedText(text);
            } else {
                setSelectedText('');
            }
        };

        editor.on('selectionUpdate', handleSelectionUpdate);
        return () => editor.off('selectionUpdate', handleSelectionUpdate);
    }, [editor]);

    // Handle document selection from sidebar
    const handleDocumentChange = useCallback((doc: ArokoDocument) => {
        // Save current document before switching
        if (editor && currentDoc) {
            const content = editor.getHTML();
            updateDocument(currentDoc.id, content, true, 'Before switch');
        }

        // Load new document
        setCurrentDoc(doc);
        if (editor && doc.content) {
            editor.commands.setContent(doc.content);
        } else if (editor) {
            editor.commands.setContent('');
        }
    }, [editor, currentDoc]);

    // Handle version restore
    const handleRestoreVersion = useCallback((content: string) => {
        if (editor) {
            editor.commands.setContent(content);
        }
    }, [editor]);

    // Handle Ctrl+S and Ctrl+Shift+I
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+S = Save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (editor && currentDoc) {
                    const content = editor.getHTML();
                    updateDocument(currentDoc.id, content, true, 'Manual save');
                    // Visual feedback
                    const savedIndicator = document.createElement('div');
                    savedIndicator.textContent = 'Saved!';
                    savedIndicator.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse';
                    document.body.appendChild(savedIndicator);
                    setTimeout(() => savedIndicator.remove(), 1500);
                }
            }

            // Ctrl+Q = Send selection to AI chat (Query)
            if ((e.ctrlKey || e.metaKey) && e.key === 'q') {
                e.preventDefault();
                if (selectedText && selectedText.trim().length > 0) {
                    // Dispatch custom event to focus chat input
                    window.dispatchEvent(new CustomEvent('focusAIChat', { detail: { selectedText } }));
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [editor, currentDoc, selectedText]);

    return (
        <MainLayout
            onAIResponse={setAiData}
            editorRef={editorRef}
            editor={editor}
            onDocumentChange={handleDocumentChange}
            onRestoreVersion={handleRestoreVersion}
            docTitle={currentDoc?.title}
            selectedText={selectedText}
        >
            <div className="max-w-4xl mx-auto">
                <TiptapEditor
                    className="w-full"
                    externalData={aiData}
                    onEditorReady={handleEditorReady}
                />
            </div>
            {/* HIDING SURGICAL EDIT FOR NOW (STILL IN CODEBASE)
            {editor && (
                <AgentCommandBar editor={editor} />
            )}
            */}
        </MainLayout>
    );
}
