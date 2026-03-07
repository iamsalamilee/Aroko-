'use client';

import { useState, useEffect, DragEvent } from 'react';
import { FileText, Plus, Trash2, Edit2, Search, FolderOpen, GripVertical } from 'lucide-react';
import {
    getAllDocuments,
    createDocument,
    deleteDocument,
    renameDocument,
    setCurrentDocument,
    getCurrentDocumentId,
    moveDocumentToFolder,
    ArokoDocument
} from '@/lib/storage/document-store';
import { getAllFolders, Folder } from '@/lib/storage/folder-store';

interface DocumentsPanelProps {
    onDocumentSelect?: (doc: ArokoDocument) => void;
    onClose?: () => void;
}

export default function DocumentsPanel({ onDocumentSelect, onClose }: DocumentsPanelProps) {
    const [documents, setDocuments] = useState<ArokoDocument[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [currentDocId, setCurrentDocId] = useState<string | null>(null);
    const [draggedDocId, setDraggedDocId] = useState<string | null>(null);
    const [dragOverFolderId, setDragOverFolderId] = useState<string | null | 'none'>(null);

    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = () => {
        setDocuments(getAllDocuments());
        setFolders(getAllFolders());
        setCurrentDocId(getCurrentDocumentId());
    };

    const handleCreateDocument = () => {
        const doc = createDocument('Untitled Document', selectedFolderId);
        refreshData();
        onDocumentSelect?.(doc);
    };

    const handleDeleteDocument = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Delete this document? This cannot be undone.')) {
            deleteDocument(id);
            refreshData();
        }
    };

    const handleRename = (id: string) => {
        if (editTitle.trim()) {
            const newDoc = renameDocument(id, editTitle.trim());
            setEditingId(null);
            refreshData();

            // If we renamed the active document, notify the parent to update the title in the header
            if (id === currentDocId && newDoc) {
                onDocumentSelect?.(newDoc);
            }
        }
    };

    const handleSelectDocument = (doc: ArokoDocument) => {
        setCurrentDocument(doc.id);
        setCurrentDocId(doc.id);
        onDocumentSelect?.(doc);
    };

    const startEditing = (doc: ArokoDocument, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(doc.id);
        setEditTitle(doc.title);
    };

    // Drag and Drop handlers
    const handleDragStart = (e: DragEvent<HTMLDivElement>, docId: string) => {
        setDraggedDocId(docId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', docId);
    };

    const handleDragEnd = () => {
        setDraggedDocId(null);
        setDragOverFolderId(null);
    };

    const handleDragOver = (e: DragEvent<HTMLButtonElement>, folderId: string | null) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverFolderId(folderId === null ? 'none' : folderId);
    };

    const handleDragLeave = () => {
        setDragOverFolderId(null);
    };

    const handleDrop = (e: DragEvent<HTMLButtonElement>, folderId: string | null) => {
        e.preventDefault();
        if (draggedDocId) {
            moveDocumentToFolder(draggedDocId, folderId);
            refreshData();
        }
        setDraggedDocId(null);
        setDragOverFolderId(null);
    };

    // Filter documents
    const filteredDocs = documents.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFolder = selectedFolderId === null
            ? true
            : doc.folderId === selectedFolderId;
        return matchesSearch && matchesFolder;
    });

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getDocFolder = (folderId: string | null) => {
        if (!folderId) return null;
        return folders.find(f => f.id === folderId);
    };

    return (
        <div className="w-64 bg-white flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                        <FileText size={18} className="text-blue-600" />
                        Documents
                    </h2>
                    <button
                        onClick={handleCreateDocument}
                        className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        title="New Document"
                    >
                        <Plus size={16} />
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search..."
                        className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all placeholder:text-gray-400"
                    />
                </div>
            </div>

            {/* Folder Filter - Drop targets */}
            <div className="p-2 border-b border-gray-100 flex gap-1 flex-wrap bg-gray-50/50">
                <button
                    onClick={() => setSelectedFolderId(null)}
                    onDragOver={(e) => handleDragOver(e, null)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, null)}
                    className={`px-2 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-all ${selectedFolderId === null
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                        } ${dragOverFolderId === 'none' ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
                >
                    All
                </button>
                {folders.map(folder => (
                    <button
                        key={folder.id}
                        onClick={() => setSelectedFolderId(folder.id)}
                        onDragOver={(e) => handleDragOver(e, folder.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, folder.id)}
                        className={`px-2 py-1 text-xs font-medium rounded-md whitespace-nowrap flex items-center gap-1 transition-all ${selectedFolderId === folder.id
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            } ${dragOverFolderId === folder.id ? 'ring-2 ring-blue-500 bg-blue-50 scale-105' : ''}`}
                    >
                        <FolderOpen size={12} style={{ color: selectedFolderId === folder.id ? 'white' : folder.color }} />
                        {folder.name}
                    </button>
                ))}
            </div>

            {/* Drag hint */}
            {draggedDocId && (
                <div className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs text-center border-b border-blue-100 animate-in fade-in slide-in-from-top-1">
                    Drop on a folder above to move
                </div>
            )}

            {/* Document List */}
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                {filteredDocs.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        {searchQuery ? 'No documents found' : 'No documents yet'}
                        <p className="text-xs mt-1 text-gray-300">Click + to create one</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filteredDocs.map(doc => (
                            <div
                                key={doc.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, doc.id)}
                                onDragEnd={handleDragEnd}
                                onClick={() => handleSelectDocument(doc)}
                                className={`p-2.5 rounded-xl cursor-pointer group transition-all duration-200 border ${currentDocId === doc.id
                                    ? 'bg-blue-50/80 border-blue-100 shadow-sm'
                                    : 'bg-transparent border-transparent hover:bg-gray-50 hover:border-gray-100'
                                    } ${draggedDocId === doc.id ? 'opacity-50 scale-95' : ''}`}
                            >
                                {editingId === doc.id ? (
                                    <input
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        onBlur={() => handleRename(doc.id)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleRename(doc.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full px-2 py-1 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        autoFocus
                                    />
                                ) : (
                                    <div className="flex items-start gap-2">
                                        {/* Drag handle */}
                                        <div className="opacity-0 group-hover:opacity-30 cursor-grab active:cursor-grabbing mt-1 -ml-1">
                                            <GripVertical size={12} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate transition-colors ${currentDocId === doc.id ? 'text-blue-900' : 'text-gray-700'}`}>
                                                {doc.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-[10px] text-gray-400">
                                                    {formatDate(doc.updatedAt)}
                                                </p>
                                                {doc.folderId && getDocFolder(doc.folderId) && (
                                                    <span
                                                        className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100/80"
                                                        style={{ color: getDocFolder(doc.folderId)?.color }}
                                                    >
                                                        {getDocFolder(doc.folderId)?.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => startEditing(doc, e)}
                                                className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                                title="Rename"
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteDocument(doc.id, e)}
                                                className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
                                                title="Delete"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
