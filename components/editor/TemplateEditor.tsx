'use client';

import { useState, useEffect } from 'react';
import { X, Save, Trash2, Plus } from 'lucide-react';
import {
    CustomTemplate,
    getTemplates,
    saveTemplate,
    deleteTemplate,
    createNewTemplate,
    getSelectedTemplateId,
    setSelectedTemplateId
} from '@/lib/storage/template-store';

interface TemplateEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onTemplateSelect?: (template: CustomTemplate) => void;
}

const FONT_OPTIONS = ['Times New Roman', 'Arial', 'Georgia', 'Calibri', 'Cambria'];
const FONT_SIZE_OPTIONS = [10, 11, 12, 14, 16, 18, 20, 24];
const LINE_SPACING_OPTIONS = [1, 1.15, 1.5, 2, 2.5, 3];

export default function TemplateEditor({ isOpen, onClose, onTemplateSelect }: TemplateEditorProps) {
    const [templates, setTemplates] = useState<CustomTemplate[]>([]);
    const [selectedId, setSelectedId] = useState<string>('default');
    const [editingTemplate, setEditingTemplate] = useState<CustomTemplate | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');

    useEffect(() => {
        if (isOpen) {
            setTemplates(getTemplates());
            setSelectedId(getSelectedTemplateId());
        }
    }, [isOpen]);

    useEffect(() => {
        if (selectedId && templates.length > 0) {
            const template = templates.find(t => t.id === selectedId);
            if (template) {
                setEditingTemplate({ ...template });
            }
        }
    }, [selectedId, templates]);

    const handleSave = () => {
        if (!editingTemplate) return;
        saveTemplate(editingTemplate);
        setTemplates(getTemplates());
        setSelectedTemplateId(editingTemplate.id);
        onClose(); // Close modal immediately after saving
    };

    const handleDelete = () => {
        if (!editingTemplate || editingTemplate.id === 'default') return;
        if (confirm(`Delete template "${editingTemplate.name}"?`)) {
            deleteTemplate(editingTemplate.id);
            setTemplates(getTemplates());
            setSelectedId('default');
        }
    };

    const handleCreate = () => {
        if (!newName.trim()) return;
        const newTemplate = createNewTemplate(newName.trim());
        saveTemplate(newTemplate);
        setTemplates(getTemplates());
        setSelectedId(newTemplate.id);
        setIsCreating(false);
        setNewName('');
    };

    const handleApply = () => {
        if (editingTemplate) {
            setSelectedTemplateId(editingTemplate.id);
            onTemplateSelect?.(editingTemplate);
            onClose();
        }
    };

    const updateField = (path: string, value: any) => {
        if (!editingTemplate) return;
        const parts = path.split('.');
        const updated = { ...editingTemplate };
        let obj: any = updated;
        for (let i = 0; i < parts.length - 1; i++) {
            obj = obj[parts[i]];
        }
        obj[parts[parts.length - 1]] = value;
        setEditingTemplate(updated);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white flex-shrink-0">
                    <h2 className="text-lg font-semibold">📝 Template Editor</h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-1 min-h-0">
                    {/* Template List */}
                    <div className="w-48 border-r bg-gray-50 p-3 flex flex-col">
                        <div className="text-xs font-medium text-gray-500 uppercase mb-2">Templates</div>
                        <div className="flex-1 overflow-y-auto space-y-1">
                            {templates.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setSelectedId(t.id)}
                                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${selectedId === t.id
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'hover:bg-gray-100 text-gray-700'
                                        }`}
                                >
                                    {t.name}
                                    {t.id === 'default' && <span className="ml-1 text-xs text-gray-400">(default)</span>}
                                </button>
                            ))}
                        </div>

                        {isCreating ? (
                            <div className="mt-2 space-y-2">
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Template name"
                                    className="w-full px-2 py-1 text-sm border rounded"
                                />
                                <div className="flex gap-1">
                                    <button onClick={handleCreate} className="flex-1 py-1 text-xs bg-blue-600 text-white rounded">Create</button>
                                    <button onClick={() => { setIsCreating(false); setNewName(''); }} className="flex-1 py-1 text-xs bg-gray-200 rounded">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="mt-2 w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded flex items-center justify-center gap-1"
                            >
                                <Plus size={14} /> New Template
                            </button>
                        )}
                    </div>

                    {/* Editor - Scrollable Content */}
                    <div className="flex-1 p-4 overflow-y-auto">
                        {editingTemplate && (
                            <div className="space-y-6 pb-4">
                                {/* Template Name */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Template Name</label>
                                    <input
                                        type="text"
                                        value={editingTemplate.name}
                                        onChange={(e) => updateField('name', e.target.value)}
                                        disabled={editingTemplate.id === 'default'}
                                        className="w-full px-3 py-2 border rounded-lg text-gray-700 disabled:bg-gray-100"
                                    />
                                </div>

                                {/* Body Text */}
                                <div className="border rounded-lg p-4 bg-gray-50">
                                    <h3 className="font-medium text-gray-800 mb-3">Body Text</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Font</label>
                                            <select
                                                value={editingTemplate.bodyText.fontFamily}
                                                onChange={(e) => updateField('bodyText.fontFamily', e.target.value)}
                                                className="w-full px-2 py-1 border rounded text-sm text-gray-700"
                                            >
                                                {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Size (pt)</label>
                                            <select
                                                value={editingTemplate.bodyText.fontSize}
                                                onChange={(e) => updateField('bodyText.fontSize', Number(e.target.value))}
                                                className="w-full px-2 py-1 border rounded text-sm text-gray-700"
                                            >
                                                {FONT_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Line Spacing</label>
                                            <select
                                                value={editingTemplate.bodyText.lineSpacing}
                                                onChange={(e) => updateField('bodyText.lineSpacing', Number(e.target.value))}
                                                className="w-full px-2 py-1 border rounded text-sm text-gray-700"
                                            >
                                                {LINE_SPACING_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Section Headings */}
                                <div className="border rounded-lg p-4 bg-gray-50">
                                    <h3 className="font-medium text-gray-800 mb-3">Section Headings</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Font</label>
                                            <select
                                                value={editingTemplate.sectionHeading.fontFamily}
                                                onChange={(e) => updateField('sectionHeading.fontFamily', e.target.value)}
                                                className="w-full px-2 py-1 border rounded text-sm text-gray-700"
                                            >
                                                {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Size (pt)</label>
                                            <select
                                                value={editingTemplate.sectionHeading.fontSize}
                                                onChange={(e) => updateField('sectionHeading.fontSize', Number(e.target.value))}
                                                className="w-full px-2 py-1 border rounded text-sm text-gray-700"
                                            >
                                                {FONT_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Style</label>
                                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                                <input
                                                    type="checkbox"
                                                    checked={editingTemplate.sectionHeading.bold}
                                                    onChange={(e) => updateField('sectionHeading.bold', e.target.checked)}
                                                    className="rounded"
                                                />
                                                Bold
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Chapter Titles */}
                                <div className="border rounded-lg p-4 bg-gray-50">
                                    <h3 className="font-medium text-gray-800 mb-3">Chapter Titles</h3>
                                    <div className="grid grid-cols-4 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Font</label>
                                            <select
                                                value={editingTemplate.chapterTitle.fontFamily}
                                                onChange={(e) => updateField('chapterTitle.fontFamily', e.target.value)}
                                                className="w-full px-2 py-1 border rounded text-sm text-gray-700"
                                            >
                                                {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Size (pt)</label>
                                            <select
                                                value={editingTemplate.chapterTitle.fontSize}
                                                onChange={(e) => updateField('chapterTitle.fontSize', Number(e.target.value))}
                                                className="w-full px-2 py-1 border rounded text-sm text-gray-700"
                                            >
                                                {FONT_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Bold</label>
                                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                                <input
                                                    type="checkbox"
                                                    checked={editingTemplate.chapterTitle.bold}
                                                    onChange={(e) => updateField('chapterTitle.bold', e.target.checked)}
                                                    className="rounded"
                                                />
                                                Yes
                                            </label>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Centered</label>
                                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                                <input
                                                    type="checkbox"
                                                    checked={editingTemplate.chapterTitle.centered}
                                                    onChange={(e) => updateField('chapterTitle.centered', e.target.checked)}
                                                    className="rounded"
                                                />
                                                Yes
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Margins */}
                                <div className="border rounded-lg p-4 bg-gray-50">
                                    <h3 className="font-medium text-gray-800 mb-3">Margins (inches)</h3>
                                    <div className="grid grid-cols-4 gap-3">
                                        {['top', 'bottom', 'left', 'right'].map(side => (
                                            <div key={side}>
                                                <label className="block text-xs text-gray-500 mb-1 capitalize">{side}</label>
                                                <input
                                                    type="number"
                                                    step="0.25"
                                                    min="0.5"
                                                    max="3"
                                                    value={(editingTemplate.margins as any)[side]}
                                                    onChange={(e) => updateField(`margins.${side}`, Number(e.target.value))}
                                                    className="w-full px-2 py-1 border rounded text-sm text-gray-700"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer - Sticky Actions (moved outside scrollable area) */}
                <div className="flex items-center justify-between p-4 border-t bg-gray-50 flex-shrink-0">
                    <div>
                        {editingTemplate && editingTemplate.id !== 'default' && (
                            <button
                                onClick={handleDelete}
                                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1 text-sm"
                            >
                                <Trash2 size={14} /> Delete
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-1 text-sm"
                        >
                            <Save size={14} /> Save
                        </button>
                        <button
                            onClick={handleApply}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                            Apply Template
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
