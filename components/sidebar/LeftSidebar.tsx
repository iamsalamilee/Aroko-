'use client';

import { useState } from 'react';
import { FileText, Clock, FolderOpen, History } from 'lucide-react';
import DocumentsPanel from './DocumentsPanel';
import FoldersPanel from './FoldersPanel';
import HistoryPanel from './HistoryPanel';
import { ArokoDocument } from '@/lib/storage/document-store';

type PanelType = 'documents' | 'folders' | 'history' | null;

interface LeftSidebarProps {
    onDocumentSelect?: (doc: ArokoDocument) => void;
    onRestoreVersion?: (content: string) => void;
}

export default function LeftSidebar({ onDocumentSelect, onRestoreVersion }: LeftSidebarProps) {
    const [activePanel, setActivePanel] = useState<PanelType>(null);

    const togglePanel = (panel: PanelType) => {
        setActivePanel(activePanel === panel ? null : panel);
    };

    const icons = [
        { id: 'documents' as PanelType, icon: FileText, title: 'Documents' },
        { id: 'folders' as PanelType, icon: FolderOpen, title: 'Folders' },
        { id: 'history' as PanelType, icon: History, title: 'History' },
    ];

    return (
        <div className="flex h-full">
            {/* Icon Bar */}
            <aside className="w-16 bg-white border-r border-gray-100 flex flex-col items-center py-4 gap-4 flex-shrink-0 z-20">
                {/* Logo */}
                <img
                    src="/aroko_logo.jpg"
                    alt="AROKO"
                    className="w-10 h-10 rounded-lg object-cover ring-1 ring-gray-100"
                />

                <div className="w-8 h-px bg-gray-100" />

                {/* Navigation Icons */}
                {icons.map(({ id, icon: Icon, title }) => (
                    <button
                        key={id}
                        onClick={() => togglePanel(id)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${activePanel === id
                            ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100'
                            : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                        title={title}
                    >
                        <Icon className="w-5 h-5" />
                    </button>
                ))}
            </aside>

            {/* Expanded Panel */}
            {activePanel && (
                <div className="border-r border-gray-200">
                    {activePanel === 'documents' && (
                        <DocumentsPanel
                            onDocumentSelect={(doc) => {
                                onDocumentSelect?.(doc);
                            }}
                            onClose={() => setActivePanel(null)}
                        />
                    )}
                    {activePanel === 'folders' && (
                        <FoldersPanel
                            onClose={() => setActivePanel(null)}
                        />
                    )}
                    {activePanel === 'history' && (
                        <HistoryPanel
                            onRestore={(content) => {
                                onRestoreVersion?.(content);
                            }}
                            onClose={() => setActivePanel(null)}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
