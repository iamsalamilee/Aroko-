'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bold, Italic, Strikethrough, Highlighter, Link, Code, Sparkles, Loader2, ChevronDown, RefreshCw, FileText, Minimize2, BookOpen, SeparatorHorizontal, Pencil, BarChart3 } from 'lucide-react';
import { transformTextAction, TransformationType } from '@/lib/ai/transform';
import { getPageBreakHtml } from '@/lib/utils/export-docx';
import { getKnowledgeSources, getContextFromSources } from '@/lib/storage/knowledge-store';
import { getPreferenceContext, getChatContextString } from '@/lib/storage/chat-context-store';
import ChartGenerator from './ChartGenerator';
import { AIChartData } from '@/lib/ai/analyze-chart';

interface EditorBubbleMenuProps {
    editor: any;
}

export default function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [showAIMenu, setShowAIMenu] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [triggeredBySlash, setTriggeredBySlash] = useState(false);

    // Chart generation state
    const [showChartGenerator, setShowChartGenerator] = useState(false);
    const [tableHTML, setTableHTML] = useState<string>('');
    const [isTableSelected, setIsTableSelected] = useState(false);

    const updateMenu = useCallback(() => {
        if (!editor) return;

        const { from, to } = editor.state.selection;
        const hasSelection = from !== to;

        if (!hasSelection && !triggeredBySlash) {
            setIsVisible(false);
            setShowAIMenu(false);
            return;
        }

        const { view } = editor;
        const coords = view.coordsAtPos(from);

        const left = hasSelection
            ? (view.coordsAtPos(from).left + view.coordsAtPos(to).left) / 2
            : coords.left;
        const top = coords.top - 50;

        setPosition({ top, left });
        setIsVisible(true);

        // Check if a table is selected or cursor is in a table
        const isInTable = editor.isActive('table');
        setIsTableSelected(isInTable);
    }, [editor, triggeredBySlash]);

    // Handle "/" key to toggle bubble menu
    useEffect(() => {
        if (!editor) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === '/' && !event.ctrlKey && !event.metaKey) {
                const { from, to } = editor.state.selection;

                // Only trigger on "/" without selection (command mode)
                if (from === to) {
                    // DON'T prevent default - let "/" be typed in editor
                    // event.preventDefault();

                    // Show bubble menu after a short delay to let "/" be typed
                    setTimeout(() => {
                        const { view } = editor;
                        const coords = view.coordsAtPos(editor.state.selection.from);
                        setPosition({ top: coords.top - 50, left: coords.left });
                        setTriggeredBySlash(true);
                        setShowAIMenu(false);
                        setIsVisible(true);
                    }, 10);
                }
            }

            // ESC to close (and keep the "/" in editor since user cancelled)
            if (event.key === 'Escape') {
                setIsVisible(false);
                setShowAIMenu(false);
                setTriggeredBySlash(false);
            }
        };

        const editorEl = editor.view.dom;
        editorEl.addEventListener('keydown', handleKeyDown);

        return () => {
            editorEl.removeEventListener('keydown', handleKeyDown);
        };
    }, [editor]);

    useEffect(() => {
        if (!editor) return;

        editor.on('selectionUpdate', updateMenu);
        editor.on('blur', () => {
            // Delay hiding to allow button clicks
            setTimeout(() => {
                if (!showAIMenu) {
                    setIsVisible(false);
                    setTriggeredBySlash(false);
                }
            }, 150);
        });

        return () => {
            editor.off('selectionUpdate', updateMenu);
        };
    }, [editor, updateMenu, showAIMenu]);

    // Helper: Remove the "/" character if menu was triggered by slash
    const removeSlashTrigger = () => {
        if (triggeredBySlash) {
            // Delete the "/" character before the current position
            const { from } = editor.state.selection;
            const textBefore = editor.state.doc.textBetween(Math.max(0, from - 1), from);
            if (textBefore === '/') {
                editor.chain().focus().deleteRange({ from: from - 1, to: from }).run();
            }
        }
    };

    const handleTransform = async (type: TransformationType) => {
        // Remove "/" if triggered by slash command
        removeSlashTrigger();

        const { from, to } = editor.state.selection;
        let textToProcess = '';
        let isWriteMode = type === 'write';
        let topic = '';
        let knowledgeContext = '';

        if (isWriteMode) {
            // For "write" mode, get text BEFORE cursor (up to 500 chars for context)
            const startPos = Math.max(0, from - 500);
            textToProcess = editor.state.doc.textBetween(startPos, from);

            // Smart topic detection: Find the NEAREST preceding heading
            // This ensures we know we are in "3.4 Tools" and not just "Introduction"
            let globalTitle = '';
            let currentSection = '';

            // 1. Find global title (first H1)
            const html = editor.getHTML();
            const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
            if (h1Match && h1Match[1]) globalTitle = h1Match[1].trim();

            // 2. Find nearest heading before cursor
            editor.state.doc.nodesBetween(0, from, (node: any, pos: number) => {
                if (node.type.name === 'heading') {
                    // Update current section as we traverse down to cursor
                    // This naturally keeps the "last one found" which is the closest one
                    currentSection = node.textContent;
                }
            });

            // Combine for full context
            if (globalTitle && currentSection && globalTitle !== currentSection) {
                topic = `${globalTitle} > ${currentSection}`;
            } else {
                topic = currentSection || globalTitle || 'Academic Paper';
            }

            console.log('Write mode - detected topic:', topic);
            console.log('Write mode - context before cursor:', textToProcess.substring(0, 100) + '...');

            // Get knowledge base context for citations
            const sources = getKnowledgeSources();
            if (sources.length > 0) {
                // Increased limit to 10,000 chars (~2.5k tokens) to ensure multiple sources are included
                knowledgeContext = getContextFromSources(sources, topic || textToProcess, 10000);
            }

            // Add chat preferences so AI remembers what we've discussed
            const preferences = getPreferenceContext();
            if (preferences) {
                knowledgeContext = preferences + '\n\n' + knowledgeContext;
            }
        } else {
            // For other modes, get selected text
            textToProcess = editor.state.doc.textBetween(from, to);
        }

        console.log('Transform requested:', type);
        console.log('Text to process:', textToProcess.substring(0, 100));

        if (!textToProcess || textToProcess.trim().length === 0) {
            console.log('No text to process');
            alert(isWriteMode ? 'Need some text before cursor to help with writing.' : 'Please select some text first.');
            return;
        }

        setIsLoading(true);
        setLoadingAction(type);

        try {
            const result = await transformTextAction(textToProcess, type, topic, knowledgeContext);
            console.log('Transform result:', result);

            if (result.success && result.result) {
                if (isWriteMode) {
                    // For write mode: INSERT at cursor position (don't replace)
                    editor.chain().focus().insertContent(' ' + result.result).run();
                } else {
                    // For other modes: REPLACE selected text
                    editor.chain().focus().deleteSelection().insertContent(result.result).run();
                }
                console.log('Text operation successful');
            } else {
                console.error('Transform failed:', result.error);
                alert('Transform failed: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Transform error:', error);
            alert('Error: ' + error);
        }

        setIsLoading(false);
        setLoadingAction(null);
        setShowAIMenu(false);
        setIsVisible(false);
        setTriggeredBySlash(false);
    };

    // Handle chart generation from table
    const handleGenerateChart = () => {
        removeSlashTrigger();

        // Find the table that contains the current selection
        // We need to walk up from the selection to find the parent table
        const { state } = editor;
        const { selection } = state;

        // Get the DOM node at the current selection
        const domAtPos = editor.view.domAtPos(selection.from);
        let tableNode: HTMLTableElement | null = null;

        // Walk up the DOM tree to find the closest table
        let currentNode: Node | null = domAtPos.node;
        while (currentNode && currentNode !== editor.view.dom) {
            if (currentNode.nodeName === 'TABLE') {
                tableNode = currentNode as HTMLTableElement;
                break;
            }
            // Also check if it's inside a table cell/row
            if (currentNode instanceof Element) {
                const parentTable = currentNode.closest('table');
                if (parentTable) {
                    tableNode = parentTable as HTMLTableElement;
                    break;
                }
            }
            currentNode = currentNode.parentNode;
        }

        if (!tableNode) {
            alert('Please click inside a table first to generate a chart from it.');
            return;
        }

        // Pass table HTML to AI for parsing
        setTableHTML(tableNode.outerHTML);
        setShowChartGenerator(true);
        setIsVisible(false);
    };

    // Insert chart into editor
    const handleInsertChart = (chartData: AIChartData) => {
        // First, move cursor out of the table to the end of it
        // This ensures the chart is inserted AFTER the table, not inside it
        const { state } = editor;
        const { selection } = state;

        // Find the table node and get position after it
        let insertPos = selection.$to.pos;

        // Walk up to find the table and insert after it
        for (let depth = selection.$to.depth; depth > 0; depth--) {
            const node = selection.$to.node(depth);
            if (node.type.name === 'table') {
                // Get position right after the table
                insertPos = selection.$to.after(depth);
                break;
            }
        }

        // Use the custom insertChart command from ChartNode extension
        // This renders an actual React component in the editor
        editor.chain()
            .focus()
            .insertContentAt(insertPos, {
                type: 'chartNode',
                attrs: { chartData: JSON.stringify(chartData) },
            })
            .run();

        setShowChartGenerator(false);
        setTableHTML('');
    };

    if (!editor || !isVisible) return showChartGenerator && tableHTML ? (
        <ChartGenerator
            tableHTML={tableHTML}
            onInsert={handleInsertChart}
            onClose={() => {
                setShowChartGenerator(false);
                setTableHTML('');
            }}
        />
    ) : null;

    const MenuButton = ({ onClick, active, Icon, title, disabled = false }: any) => (
        <button
            onMouseDown={(e) => {
                e.preventDefault();
                if (!disabled) {
                    removeSlashTrigger(); // Remove "/" if triggered by slash
                    onClick();
                    setTriggeredBySlash(false);
                }
            }}
            className={`p-2 hover:bg-gray-100 transition-colors ${active ? 'text-blue-600 bg-blue-50' : 'text-gray-700'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={title}
            disabled={disabled}
        >
            <Icon size={16} />
        </button>
    );

    const addLink = () => {
        if (editor.isActive('link')) {
            editor.chain().focus().unsetLink().run();
            return;
        }
        let url = prompt('Enter URL:');
        if (url) {
            if (!url.startsWith('http')) url = 'https://' + url;
            editor.chain().focus().setLink({ href: url }).run();
        }
    };

    const AIOption = ({ type, icon: Icon, label }: { type: TransformationType; icon: any; label: string }) => (
        <button
            onMouseDown={(e) => { e.preventDefault(); handleTransform(type); }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 text-gray-700"
            disabled={isLoading}
        >
            {loadingAction === type ? (
                <Loader2 size={14} className="animate-spin text-blue-600" />
            ) : (
                <Icon size={14} className="text-blue-600" />
            )}
            {label}
        </button>
    );

    return (
        <div
            className="fixed z-[100] bg-white rounded-lg shadow-xl border border-gray-200 flex items-center overflow-visible"
            style={{ top: position.top, left: position.left, transform: 'translateX(-50%)' }}
        >
            {/* Text Formatting */}
            <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} Icon={Bold} title="Bold" disabled={isLoading} />
            <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} Icon={Italic} title="Italic" disabled={isLoading} />
            <MenuButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} Icon={Strikethrough} title="Strike" disabled={isLoading} />

            <div className="w-px h-6 bg-gray-200" />

            <MenuButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} Icon={Highlighter} title="Highlight" disabled={isLoading} />
            <MenuButton onClick={addLink} active={editor.isActive('link')} Icon={Link} title="Link" disabled={isLoading} />
            <MenuButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} Icon={Code} title="Code" disabled={isLoading} />

            {/* Page Break */}
            <MenuButton
                onClick={() => {
                    // Insert a horizontal rule as page break marker
                    editor.chain().focus().setHorizontalRule().run();
                    setIsVisible(false);
                }}
                Icon={SeparatorHorizontal}
                title="Page Break"
                disabled={isLoading}
            />

            {/* Chart Generation - Shows when in table */}
            {isTableSelected && (
                <MenuButton
                    onClick={handleGenerateChart}
                    Icon={BarChart3}
                    title="Generate Chart from Table"
                    disabled={isLoading}
                    active={false}
                />
            )}

            <div className="w-px h-6 bg-gray-200" />

            {/* AI Dropdown */}
            <div className="relative">
                <button
                    onMouseDown={(e) => { e.preventDefault(); setShowAIMenu(!showAIMenu); }}
                    className={`px-2 py-2 flex items-center gap-1 hover:bg-purple-50 transition-colors rounded-r-lg ${showAIMenu ? 'bg-purple-50 text-purple-700' : 'text-purple-600'}`}
                    title="AI Actions"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <Sparkles size={16} />
                    )}
                    <span className="text-xs font-medium">AI</span>
                    <ChevronDown size={12} />
                </button>

                {showAIMenu && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[150px] z-[101]">
                        <div className="px-3 py-1 text-xs text-gray-400 uppercase">Write</div>
                        <AIOption type="write" icon={Pencil} label="Help with Writing" />
                        <div className="h-px bg-gray-100 my-1" />
                        <div className="px-3 py-1 text-xs text-gray-400 uppercase">Transform</div>
                        <AIOption type="paraphrase" icon={RefreshCw} label="Paraphrase" />
                        <AIOption type="improve" icon={Sparkles} label="Improve" />
                        <AIOption type="explain" icon={BookOpen} label="Explain" />
                        <AIOption type="summarize" icon={Minimize2} label="Summarize" />
                        <div className="h-px bg-gray-100 my-1" />
                        <div className="px-3 py-1 text-xs text-gray-400 uppercase">Tone</div>
                        <AIOption type="formal" icon={FileText} label="Make Formal" />
                        <AIOption type="casual" icon={FileText} label="Make Casual" />
                    </div>
                )}
            </div>
        </div>
    );
}

