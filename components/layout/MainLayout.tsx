'use client';

import { ReactNode, RefObject, useState } from 'react';
import LeftSidebar from '@/components/sidebar/LeftSidebar';
import RightPanel from '@/components/sidebar/RightPanel';
import TopToolbar from '@/components/editor/TopToolbar';
import { PanelLeft, PanelRight } from 'lucide-react';
import { ArokoDocument } from '@/lib/storage/document-store';

interface MainLayoutProps {
    children: ReactNode;
    onAIResponse?: (data: any) => void;
    editorRef?: RefObject<any>;
    editor?: any;
    onDocumentChange?: (doc: ArokoDocument) => void;
    onRestoreVersion?: (content: string) => void;
    docTitle?: string;
    selectedText?: string;
}

export default function MainLayout({
    children,
    onAIResponse,
    editorRef,
    editor,
    onDocumentChange,
    onRestoreVersion,
    docTitle = 'Untitled Document',
    selectedText = ''
}: MainLayoutProps) {
    const [isLeftOpen, setIsLeftOpen] = useState(true);
    const [isRightOpen, setIsRightOpen] = useState(true);

    return (
        <div className="h-screen flex flex-col bg-slate-50 overflow-hidden font-sans">
            {/* TOP HEADER AREA */}
            <div className="min-h-[4rem] h-auto py-2 bg-white/80 backdrop-blur-md border-b border-gray-200/60 flex items-center justify-between px-6 shrink-0 z-50 transition-all duration-300">
                {/* Branding / Title Area */}
                <div className="flex items-center gap-3 w-64">
                    <span className="text-lg font-bold tracking-tight text-slate-900">AROKO</span>
                    <div className="h-4 w-px bg-gray-200" />
                    <span className="text-sm text-gray-500 font-medium truncate" title={docTitle}>{docTitle}</span>
                </div>

                {/* Center: Formatting Toolbar */}
                <div className="flex-1 flex justify-center min-w-0 px-8">
                    <div className="w-full max-w-4xl">
                        {editor && <TopToolbar editor={editor} />}
                    </div>
                </div>

                {/* Right: Layout Toggles */}
                <div className="flex items-center gap-2 w-64 justify-end">
                    <div className="flex items-center bg-gray-100/50 p-1 rounded-lg border border-gray-200/50">
                        <button
                            onClick={() => setIsLeftOpen(!isLeftOpen)}
                            className={`p-1.5 rounded-md transition-all ${isLeftOpen ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Toggle Sidebar"
                        >
                            <PanelLeft size={16} />
                        </button>
                        <button
                            onClick={() => setIsRightOpen(!isRightOpen)}
                            className={`p-1.5 rounded-md transition-all ${isRightOpen ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Toggle AI Panel"
                        >
                            <PanelRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* MAIN WORKSPACE AREA */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Left Sidebar container */}
                {isLeftOpen && (
                    <div className="shrink-0 transition-all duration-300 flex z-30 h-full shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
                        <LeftSidebar
                            onDocumentSelect={onDocumentChange}
                            onRestoreVersion={onRestoreVersion}
                        />
                    </div>
                )}

                {/* Center - Document Editor */}
                <main className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 p-6 transition-all duration-300 relative">
                    <div className="max-w-4xl mx-auto h-full">
                        {children}
                    </div>
                </main>

                {/* Right Panel */}
                {isRightOpen && (
                    <div className="w-[350px] shrink-0 bg-white border-l border-gray-200/60 transition-all duration-300 z-30 shadow-[-4px_0_24px_-12px_rgba(0,0,0,0.1)]">
                        <RightPanel onAIResponse={onAIResponse} editorRef={editorRef} selectedText={selectedText} />
                    </div>
                )}
            </div>
        </div>
    );
}
