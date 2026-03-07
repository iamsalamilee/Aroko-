'use client';

import { useState, useEffect } from 'react';
import { FolderOpen, Plus, Trash2, Edit2, Palette } from 'lucide-react';
import {
    getAllFolders,
    createFolder,
    deleteFolder,
    renameFolder,
    updateFolderColor,
    FOLDER_COLORS,
    Folder
} from '@/lib/storage/folder-store';
import { getDocumentsInFolder, moveDocumentToFolder } from '@/lib/storage/document-store';

interface FoldersPanelProps {
    onClose?: () => void;
}

export default function FoldersPanel({ onClose }: FoldersPanelProps) {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [newFolderName, setNewFolderName] = useState('');
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [colorPickerId, setColorPickerId] = useState<string | null>(null);

    useEffect(() => {
        refreshFolders();
    }, []);

    const refreshFolders = () => {
        setFolders(getAllFolders());
    };

    const handleCreateFolder = () => {
        if (newFolderName.trim()) {
            createFolder(newFolderName.trim());
            setNewFolderName('');
            setShowNewFolder(false);
            refreshFolders();
        }
    };

    const handleDeleteFolder = (id: string) => {
        const docsInFolder = getDocumentsInFolder(id);
        const confirmMsg = docsInFolder.length > 0
            ? `Delete folder? ${docsInFolder.length} documents will be moved to "No Folder".`
            : 'Delete this folder?';

        if (confirm(confirmMsg)) {
            // Move documents to no folder
            docsInFolder.forEach(doc => moveDocumentToFolder(doc.id, null));
            deleteFolder(id);
            refreshFolders();
        }
    };

    const handleRename = (id: string) => {
        if (editName.trim()) {
            renameFolder(id, editName.trim());
            setEditingId(null);
            refreshFolders();
        }
    };

    const handleColorChange = (folderId: string, color: string) => {
        updateFolderColor(folderId, color);
        setColorPickerId(null);
        refreshFolders();
    };

    const getDocCount = (folderId: string) => {
        return getDocumentsInFolder(folderId).length;
    };

    return (
        <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                        <FolderOpen size={18} />
                        Folders
                    </h2>
                    <button
                        onClick={() => setShowNewFolder(true)}
                        className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        title="New Folder"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>

            {/* New Folder Input */}
            {showNewFolder && (
                <div className="p-3 border-b border-gray-200 bg-white">
                    <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                        placeholder="Folder name..."
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-2">
                        <button
                            onClick={() => setShowNewFolder(false)}
                            className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateFolder}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Create
                        </button>
                    </div>
                </div>
            )}

            {/* Folder List */}
            <div className="flex-1 overflow-y-auto p-2">
                {/* No Folder */}
                <div className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer mb-1">
                    <div className="flex items-center gap-2">
                        <FolderOpen size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-600">No Folder</span>
                        <span className="ml-auto text-xs text-gray-400">
                            {getDocumentsInFolder(null).length}
                        </span>
                    </div>
                </div>

                {folders.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 text-sm">
                        No folders yet
                    </div>
                ) : (
                    <div className="space-y-1">
                        {folders.map(folder => (
                            <div
                                key={folder.id}
                                className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer group relative"
                            >
                                {editingId === folder.id ? (
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onBlur={() => handleRename(folder.id)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleRename(folder.id)}
                                        className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none"
                                        autoFocus
                                    />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <FolderOpen
                                            size={16}
                                            style={{ color: folder.color || '#6B7280' }}
                                        />
                                        <span className="text-sm text-gray-700 flex-1">
                                            {folder.name}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {getDocCount(folder.id)}
                                        </span>

                                        {/* Actions */}
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                                            <button
                                                onClick={() => setColorPickerId(colorPickerId === folder.id ? null : folder.id)}
                                                className="p-1 text-gray-400 hover:text-purple-600"
                                            >
                                                <Palette size={12} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingId(folder.id);
                                                    setEditName(folder.name);
                                                }}
                                                className="p-1 text-gray-400 hover:text-blue-600"
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteFolder(folder.id)}
                                                className="p-1 text-gray-400 hover:text-red-600"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Color Picker */}
                                {colorPickerId === folder.id && (
                                    <div className="mt-2 flex gap-1 flex-wrap p-2 bg-white border border-gray-200 rounded-lg">
                                        {FOLDER_COLORS.map(color => (
                                            <button
                                                key={color}
                                                onClick={() => handleColorChange(folder.id, color)}
                                                className="w-5 h-5 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
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
