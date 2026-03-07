'use client';

import { useState, RefObject, useEffect, useRef } from 'react';
import { chatWithContextAction } from '@/lib/ai/actions';
import { Loader2, Send, Sparkles, BookOpen, FileText, Search, Settings, Trash2, Upload, Edit, Check, X } from 'lucide-react';
import { applyTemplateFormatting } from '@/lib/utils/text-formatter';
import { extractAndGenerateReferencesAction } from '@/lib/ai/extract-citations';
import { editSelectedTextAction } from '@/lib/ai/edit-text';
import PaperSearch from '@/components/research/PaperSearch';
import TemplateEditor from '@/components/editor/TemplateEditor';
import {
    CustomTemplate,
    getTemplates,
    getSelectedTemplate,
    setSelectedTemplateId
} from '@/lib/storage/template-store';
import { parseFile } from '@/lib/utils/file-parser';
import { chunkText } from '@/lib/utils/text-chunker';
import { extractFullMetadataWithAI } from '@/lib/ai/extract-metadata';
import { addCitationFromPDF } from '@/lib/storage/citation-registry';
import { isGreeting, GREETING_RESPONSE } from '@/lib/ai/chat-prompts';
import {
    getKnowledgeSources,
    addKnowledgeSource,
    deleteKnowledgeSource,
    getContextFromSources,
    KnowledgeSource
} from '@/lib/storage/knowledge-store';
import { saveChatContext, getSavedMessages } from '@/lib/storage/chat-context-store';

interface Message {
    role: 'user' | 'ai';
    content: string;
}

interface RightPanelProps {
    onAIResponse?: (data: any) => void;
    editorRef?: RefObject<any>;
    selectedText?: string;
}

export default function RightPanel({ onAIResponse, editorRef, selectedText = '' }: RightPanelProps) {
    const [activeTab, setActiveTab] = useState('chat');
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<CustomTemplate | null>(null);
    const [templates, setTemplates] = useState<CustomTemplate[]>([]);
    const [showPaperSearch, setShowPaperSearch] = useState(false);
    const [showTemplateEditor, setShowTemplateEditor] = useState(false);
    const [isGeneratingRefs, setIsGeneratingRefs] = useState(false);
    const [searchDocs, setSearchDocs] = useState<KnowledgeSource[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatInputRef = useRef<HTMLInputElement>(null);
    const [citationStyle, setCitationStyle] = useState<'APA' | 'Harvard' | 'Chicago' | 'IEEE'>('APA');
    // Surgical edit state
    const [editPreview, setEditPreview] = useState<{ original: string; replacement: string; explanation: string } | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setTemplates(getTemplates());
        setSelectedTemplate(getSelectedTemplate());
        setSearchDocs(getKnowledgeSources());
        setMessages(getSavedMessages()); // Restore chat history
    }, []);

    // Save chat context whenever messages change (for cross-component access)
    useEffect(() => {
        if (messages.length > 0) {
            saveChatContext(messages);
        }
    }, [messages]);

    // Listen for Ctrl+Shift+I to focus chat input
    useEffect(() => {
        const handleFocusChat = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail?.selectedText) {
                setActiveTab('chat');
                // Focus the chat input after a short delay to ensure tab switch
                setTimeout(() => {
                    chatInputRef.current?.focus();
                }, 100);
            }
        };

        window.addEventListener('focusAIChat', handleFocusChat);
        return () => window.removeEventListener('focusAIChat', handleFocusChat);
    }, []);

    const processFiles = async (files: ArrayLike<File>) => {
        if (!files || files.length === 0) return;
        setIsLoading(true);
        let successCount = 0;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileName = file.name.toLowerCase();
            const isPdf = file.type === 'application/pdf' || fileName.endsWith('.pdf');
            const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx');

            if (!isPdf && !isDocx) {
                alert(`Skipped "${file.name}": Only PDF and DOCX files are supported.`);
                continue;
            }

            try {
                const { success, text, error } = await parseFile(file);
                if (success && text) {
                    // Use AI to extract metadata (more reliable than regex)
                    console.log(`Extracting metadata for ${file.name}...`);
                    // Extract FULL metadata for Citation Registry
                    const metadata = await extractFullMetadataWithAI(text, file.name);
                    console.log(`Extracted: Author=${metadata.author}, Year=${metadata.year}, Journal=${metadata.journal || 'N/A'}`);

                    const sourceId = crypto.randomUUID();
                    const chunks = chunkText(text, file.name, sourceId, 800, 200, metadata);

                    // Add to knowledge base
                    const newSource = addKnowledgeSource({
                        name: file.name,
                        content: text,
                        chunks: chunks,
                        type: isPdf ? 'pdf' : 'docx'
                    });

                    // Save to Citation Registry for reference generation
                    addCitationFromPDF({
                        author: metadata.authors.join(', '),
                        title: metadata.title,
                        year: metadata.year,
                        journal: metadata.journal,
                        doi: metadata.doi,
                    }, sourceId, chunks.map(c => c.id));
                    setSearchDocs(prev => [newSource, ...prev]);
                    successCount++;
                    console.log(`Chunked ${file.name}: ${chunks.length} chunks with metadata: (${metadata.author}, ${metadata.year})`);
                } else {
                    alert(`Failed to parse "${file.name}": ${error}`);
                }
            } catch (err: any) {
                console.error(err);
                alert(`Upload failed for "${file.name}": ${err.message}`);
            }
        }

        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (successCount > 0) {
            setMessages(prev => [...prev, {
                role: 'ai',
                content: `📚 Added ${successCount} document${successCount > 1 ? 's' : ''} to knowledge base!`
            }]);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) processFiles(e.target.files);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files?.length > 0) processFiles(e.dataTransfer.files);
    };

    const handleDeleteSource = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        deleteKnowledgeSource(id);
        setSearchDocs(prev => prev.filter(d => d.id !== id));
    };

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;
        const userMessage = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            // SURGICAL EDITING MODE - if there's selected text
            if (selectedText && selectedText.trim().length > 0) {
                setIsEditing(true);
                setMessages(prev => [...prev, { role: 'ai', content: `Editing selected text (${selectedText.length} chars)...` }]);

                // Get LIMITED context from knowledge base for citations (only 1000 chars to avoid token limits)
                const sources = getKnowledgeSources();
                const knowledgeContext = sources.length > 0
                    ? getContextFromSources(sources, userMessage, 1000)
                    : '';

                const result = await editSelectedTextAction(
                    selectedText,
                    userMessage,
                    undefined, // contextBefore
                    undefined, // contextAfter  
                    knowledgeContext
                );

                if (result.success && result.replacement) {
                    setEditPreview({
                        original: result.original,
                        replacement: result.replacement,
                        explanation: result.explanation || 'Edit complete'
                    });
                    setMessages(prev => {
                        const updated = [...prev];
                        updated[updated.length - 1] = { role: 'ai', content: `✏️ **Edit Preview** - ${result.explanation}\n\nReview the changes below and click Apply to update the document.` };
                        return updated;
                    });
                } else {
                    setMessages(prev => {
                        const updated = [...prev];
                        updated[updated.length - 1] = { role: 'ai', content: 'Error: ' + (result.error || 'Edit failed') };
                        return updated;
                    });
                    setIsEditing(false);
                }
            }
            // GREETING MODE
            else if (isGreeting(userMessage)) {
                setMessages(prev => [...prev, { role: 'ai', content: GREETING_RESPONSE }]);
            }
            // REGULAR CHAT MODE
            else {
                const sources = getKnowledgeSources();
                let context = getContextFromSources(sources, userMessage);
                if (editorRef?.current) {
                    const editorText = editorRef.current.getText();
                    if (editorText) {
                        context = `CURRENT DOCUMENT:\n${editorText}\n\nKNOWLEDGE BASE:\n${context}`;
                    }
                }
                const result = await chatWithContextAction(userMessage, context, messages);
                if (result.success && result.response) {
                    setMessages(prev => [...prev, { role: 'ai', content: result.response }]);
                } else {
                    setMessages(prev => [...prev, { role: 'ai', content: 'Error: ' + (result.error || 'Failed') }]);
                }
            }
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'ai', content: 'An error occurred.' }]);
            setIsEditing(false);
        } finally {
            setIsLoading(false);
        }
    };

    // Apply surgical edit to document
    const handleApplyEdit = () => {
        if (!editPreview || !editorRef?.current) return;

        const editor = editorRef.current;
        const html = editor.getHTML();

        // Replace the original text with the replacement
        // Note: This is a simple approach - for complex cases might need more sophisticated matching
        const escapedOriginal = editPreview.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const newHtml = html.replace(new RegExp(escapedOriginal, 'g'), editPreview.replacement);

        if (newHtml !== html) {
            editor.commands.setContent(newHtml);
            setMessages(prev => [...prev, { role: 'ai', content: '✅ Edit applied to document!' }]);
        } else {
            setMessages(prev => [...prev, { role: 'ai', content: '⚠️ Could not find text to replace. The selection may have changed.' }]);
        }

        setEditPreview(null);
        setIsEditing(false);
    };

    // Reject surgical edit
    const handleRejectEdit = () => {
        setEditPreview(null);
        setIsEditing(false);
        setMessages(prev => [...prev, { role: 'ai', content: 'Edit cancelled. You can try a different instruction.' }]);
    };

    const handleApplyFormat = () => {
        if (!editorRef?.current) {
            alert('Please add content to the editor first.');
            return;
        }
        const editor = editorRef.current;
        const template = selectedTemplate || getSelectedTemplate();
        let html = editor.getHTML();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const elements = doc.body.children;
        const chapterPattern = /^(CHAPTER\s+\d+|CHAPTER\s+[A-Z]+|Chapter\s+\d+)/i;
        const sectionPattern = /^\d+\.\d*\s+\w/;
        const sectionKeywords = ['ABSTRACT', 'INTRODUCTION', 'BACKGROUND', 'LITERATURE REVIEW', 'METHODOLOGY', 'RESULTS', 'DISCUSSION', 'CONCLUSION', 'REFERENCES'];

        for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            const text = el.textContent?.trim() || '';
            if (!text) continue;

            if (chapterPattern.test(text)) {
                const h1 = doc.createElement('h1');
                h1.innerHTML = el.innerHTML;
                h1.style.fontFamily = `'${template.chapterTitle?.fontFamily || 'Times New Roman'}', serif`;
                h1.style.fontSize = `${template.chapterTitle?.fontSize || 16}pt`;
                h1.style.fontWeight = 'bold';
                h1.style.textAlign = 'center';
                el.replaceWith(h1);
            } else if (sectionPattern.test(text) || sectionKeywords.some(kw => text.toUpperCase() === kw)) {
                const h2 = doc.createElement('h2');
                h2.innerHTML = el.innerHTML;
                h2.style.fontFamily = `'${template.sectionHeading?.fontFamily || 'Times New Roman'}', serif`;
                h2.style.fontSize = `${template.sectionHeading?.fontSize || 12}pt`;
                h2.style.fontWeight = 'bold';
                el.replaceWith(h2);
            } else if (el.tagName === 'P' || el.tagName === 'DIV') {
                const p = el.tagName === 'P' ? el : doc.createElement('p');
                if (el.tagName !== 'P') { p.innerHTML = el.innerHTML; el.replaceWith(p); }
                p.style.fontFamily = `'${template.bodyText?.fontFamily || 'Times New Roman'}', serif`;
                p.style.fontSize = `${template.bodyText?.fontSize || 12}pt`;
                p.style.textAlign = 'justify';
                p.style.lineHeight = String(template.bodyText?.lineSpacing || 2.0);
            }
        }
        editor.commands.setContent(doc.body.innerHTML);
        setMessages(prev => [...prev, { role: 'ai', content: '✓ Formatting applied!' }]);
    };

    const handleGenerateReferences = async () => {
        if (!editorRef?.current) {
            alert('Please add content first!');
            return;
        }
        const editor = editorRef.current;
        const text = editor.getText();
        setIsGeneratingRefs(true);
        setMessages(prev => [...prev, { role: 'ai', content: 'Scanning for citations...' }]);
        const result = await extractAndGenerateReferencesAction(text, citationStyle === 'IEEE' ? 'APA' : citationStyle);
        if (result.success) {
            const citationCount = result.citations?.length || 0;
            setMessages(prev => [...prev, { role: 'ai', content: `Found ${citationCount} citation(s).` }]);
            if (result.references && citationCount > 0) {
                editor.chain().focus().insertContent('<h2>REFERENCES</h2>' + result.references).run();
            }
        } else {
            setMessages(prev => [...prev, { role: 'ai', content: 'Error: ' + result.error }]);
        }
        setIsGeneratingRefs(false);
    };

    return (
        <aside className="w-80 bg-gray-50 flex flex-col h-full border-l border-gray-200 min-h-0">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 flex-shrink-0">
                <div className="px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded">
                        <Sparkles size={16} className="text-gray-600" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-sm font-semibold text-gray-900">AI Assistant</h2>
                        <p className="text-xs text-gray-500">Research & Writing Tools</p>
                    </div>
                </div>
                <div className="flex border-t border-gray-200">
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 py-2.5 text-xs font-medium border-b-2 transition-colors ${activeTab === 'chat' ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        Assistant
                    </button>
                    <button
                        onClick={() => setActiveTab('knowledge')}
                        className={`flex-1 py-2.5 text-xs font-medium border-b-2 transition-colors ${activeTab === 'knowledge' ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        Knowledge Base
                    </button>
                </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0">
                {activeTab === 'knowledge' && (
                    <div className="p-4 space-y-4">
                        <div
                            className={`p-8 rounded-lg border-2 border-dashed text-center transition-colors ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 bg-gray-100">
                                <Upload size={20} className="text-gray-600" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-900 mb-1">Upload Research</h3>
                            <p className="text-xs text-gray-500 mb-4">Add PDF or DOCX files</p>
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.docx" multiple className="hidden" />
                            <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="px-4 py-2 bg-gray-900 text-white text-xs font-medium rounded hover:bg-gray-800 disabled:opacity-50">
                                {isLoading ? 'Processing...' : 'Select Files'}
                            </button>
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sources ({searchDocs.length})</h4>
                            {searchDocs.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-6">No files uploaded</p>
                            ) : (
                                <div className="space-y-1.5">
                                    {searchDocs.map(doc => (
                                        <div key={doc.id} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded hover:border-gray-300 group">
                                            <FileText size={14} className="text-gray-400 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-gray-900 truncate">{doc.name}</p>
                                                <p className="text-[10px] text-gray-400">{new Date(doc.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <button onClick={(e) => handleDeleteSource(doc.id, e)} className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100">
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'chat' && (
                    <>
                        <div className="p-4 space-y-3 min-h-[200px]">

                            {/* Edit Preview Panel */}
                            {editPreview && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                                    <p className="text-[10px] text-blue-700 font-semibold uppercase">Edit Preview</p>

                                    <div className="bg-red-50 p-2 rounded border border-red-200">
                                        <p className="text-[9px] text-red-600 font-medium mb-1">ORIGINAL:</p>
                                        <p className="text-[10px] text-red-800 line-through">{editPreview.original.substring(0, 150)}{editPreview.original.length > 150 ? '...' : ''}</p>
                                    </div>

                                    <div className="bg-green-50 p-2 rounded border border-green-200">
                                        <p className="text-[9px] text-green-600 font-medium mb-1">REPLACEMENT:</p>
                                        <p className="text-[10px] text-green-800">{editPreview.replacement.substring(0, 150)}{editPreview.replacement.length > 150 ? '...' : ''}</p>
                                    </div>

                                    <div className="flex gap-2 pt-1">
                                        <button onClick={handleApplyEdit} className="flex-1 py-1.5 px-3 bg-green-600 text-white text-xs font-medium rounded flex items-center justify-center gap-1 hover:bg-green-700">
                                            <Check size={12} /> Apply
                                        </button>
                                        <button onClick={handleRejectEdit} className="flex-1 py-1.5 px-3 bg-gray-100 text-gray-700 text-xs font-medium rounded flex items-center justify-center gap-1 hover:bg-gray-200 border border-gray-300">
                                            <X size={12} /> Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {messages.length === 0 && !selectedText && (
                                <div className="text-center py-8">
                                    <p className="text-xs text-gray-500 mb-3">Start a conversation or use tools below</p>
                                    {searchDocs.length > 0 && <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded">{searchDocs.length} source{searchDocs.length > 1 ? 's' : ''} loaded</span>}
                                </div>
                            )}
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] px-3 py-2 rounded-lg text-xs leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 border border-gray-200'}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-gray-200 px-3 py-2 rounded-lg">
                                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-200 bg-white p-4 space-y-3">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-wide font-medium mb-1.5 block">Template</label>
                                <div className="flex gap-2">
                                    <select
                                        className="flex-1 px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs text-gray-700 focus:outline-none focus:border-blue-500"
                                        value={selectedTemplate?.id || 'default'}
                                        onChange={(e) => {
                                            setSelectedTemplateId(e.target.value);
                                            const t = templates.find(t => t.id === e.target.value);
                                            if (t) setSelectedTemplate(t);
                                        }}
                                    >
                                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                    <button onClick={() => setShowTemplateEditor(true)} className="p-1.5 border border-gray-300 hover:bg-gray-50 rounded text-gray-600">
                                        <Settings size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <button className="py-2 px-3 border border-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-50" onClick={handleApplyFormat}>Apply Format</button>
                                <button className={`py-2 px-3 border text-xs font-medium rounded flex items-center justify-center gap-1.5 ${showPaperSearch ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`} onClick={() => setShowPaperSearch(!showPaperSearch)}>
                                    <Search size={12} />Search Papers
                                </button>
                                <button className="col-span-2 py-2 px-3 border border-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-50 flex items-center justify-center gap-1.5" onClick={handleGenerateReferences} disabled={isGeneratingRefs}>
                                    {isGeneratingRefs ? <Loader2 className="w-3 h-3 animate-spin" /> : <BookOpen size={12} />}
                                    {isGeneratingRefs ? 'Generating...' : 'Auto-Reference'}
                                </button>
                            </div>

                            {/* Paper Search Dropdown */}
                            {showPaperSearch && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <PaperSearch onPaperSelect={(paper) => {
                                        if (editorRef?.current) {
                                            const citation = ` (${paper.authors[0]?.split(' ').pop() || 'Author'}, ${paper.year})`;
                                            editorRef.current.chain().focus().insertContent(citation).run();
                                        }
                                        setShowPaperSearch(false);
                                    }} />
                                </div>
                            )}

                            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                <label className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Citation:</label>
                                <select className="flex-1 px-2 py-1 bg-white border border-gray-300 rounded text-xs text-gray-700 focus:outline-none focus:border-blue-500" value={citationStyle} onChange={(e) => setCitationStyle(e.target.value as any)}>
                                    <option value="APA">APA 7th</option>
                                    <option value="Harvard">Harvard</option>
                                    <option value="Chicago">Chicago</option>
                                    <option value="IEEE">IEEE</option>
                                </select>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {activeTab === 'chat' && (
                <div className="border-t border-gray-200 bg-white p-3 flex-shrink-0 space-y-2">
                    {/* Selection Indicator - Above Input */}
                    {selectedText && selectedText.trim().length > 0 && (
                        <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <Edit size={14} className="text-yellow-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-yellow-700 font-medium">Text Selected ({selectedText.length} chars)</p>
                                <p className="text-[10px] text-yellow-600 truncate">"{selectedText.substring(0, 50)}..."</p>
                            </div>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <input
                            ref={chatInputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                            placeholder="Ask about your research..."
                            className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                            disabled={isLoading}
                        />
                        <button onClick={handleSendMessage} disabled={isLoading || !input.trim()} className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            )}

            {showTemplateEditor && <TemplateEditor isOpen={showTemplateEditor} onClose={() => setShowTemplateEditor(false)} onTemplateSelect={(t) => setSelectedTemplate(t)} />}
        </aside>
    );
}
