'use client';

import { useState, useEffect } from 'react';
import {
    Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Undo, Redo, Code, Strikethrough,
    Link, Highlighter, Superscript, Subscript, Table, FileText, SeparatorHorizontal
} from 'lucide-react';
import { exportToDocx } from '@/lib/utils/export-docx';
import { getCurrentDocument } from '@/lib/storage/document-store';

interface TopToolbarProps {
    editor: any;
}

export default function TopToolbar({ editor }: TopToolbarProps) {
    const [, setUpdateCounter] = useState(0);
    const [currentFontFamily, setCurrentFontFamily] = useState('Times New Roman');
    const [currentFontSize, setCurrentFontSize] = useState('12');
    const [currentLineSpacing, setCurrentLineSpacing] = useState('1.5');
    const [showTablePopover, setShowTablePopover] = useState(false);
    const [tableRows, setTableRows] = useState(3);
    const [tableCols, setTableCols] = useState(3);

    useEffect(() => {
        if (!editor) return;
        const handleUpdate = () => {
            setUpdateCounter(c => c + 1); // Force re-render on any editor change
            try {
                const { from } = editor.state.selection;
                const node = editor.state.doc.nodeAt(from);
                const marks = editor.state.storedMarks || (node ? node.marks : []);
                const fontFamilyMark = marks.find((m: any) => m.type.name === 'textStyle' && m.attrs.fontFamily);
                if (fontFamilyMark) setCurrentFontFamily(fontFamilyMark.attrs.fontFamily.replace(/'/g, ''));
                const fontSizeMark = marks.find((m: any) => m.type.name === 'textStyle' && m.attrs.fontSize);
                if (fontSizeMark) setCurrentFontSize(fontSizeMark.attrs.fontSize.replace('pt', ''));
            } catch { }
        };
        editor.on('selectionUpdate', handleUpdate);
        editor.on('transaction', handleUpdate);
        return () => {
            editor.off('selectionUpdate', handleUpdate);
            editor.off('transaction', handleUpdate);
        };
    }, [editor]);

    if (!editor) return null;

    const Btn = ({ onClick, active, children, title }: any) => (
        <button
            onMouseDown={(e) => { e.preventDefault(); onClick(); }}
            className={`p-1.5 rounded transition-colors ${active ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            title={title}
        >
            {children}
        </button>
    );

    const IconBtn = ({ onClick, active, Icon, title }: any) => (
        <Btn onClick={onClick} active={active} title={title}><Icon size={16} /></Btn>
    );

    const Divider = () => <div className="w-px h-5 bg-gray-200 mx-1" />;

    const addLink = () => {
        const { from, to } = editor.state.selection;
        if (from === to) { alert('Select text first'); return; }
        if (editor.isActive('link')) { editor.chain().focus().unsetLink().run(); return; }
        let url = prompt('Enter URL:');
        if (url) {
            if (!url.startsWith('http')) url = 'https://' + url;
            editor.chain().focus().setLink({ href: url }).run();
        }
    };

    const handleExport = async () => {
        const html = editor.getHTML();
        const doc = getCurrentDocument();
        const title = doc?.title || 'document';
        await exportToDocx(html, { title });
    };

    const applyLineSpacing = (spacing: string) => {
        setCurrentLineSpacing(spacing);
        const existingStyle = document.getElementById('aroko-line-height-override');
        if (existingStyle) existingStyle.remove();
        const style = document.createElement('style');
        style.id = 'aroko-line-height-override';
        style.textContent = `.ProseMirror, .ProseMirror p, .ProseMirror div { line-height: ${spacing} !important; }`;
        document.head.appendChild(style);
    };

    const applyFontFamily = (font: string) => {
        setCurrentFontFamily(font);
        const { from, to } = editor.state.selection;
        if (from !== to) {
            editor.chain().focus().setFontFamily(font).run();
        } else {
            const existingStyle = document.getElementById('aroko-font-family-override');
            if (existingStyle) existingStyle.remove();
            const style = document.createElement('style');
            style.id = 'aroko-font-family-override';
            style.textContent = `.ProseMirror, .ProseMirror * { font-family: '${font}', serif !important; }`;
            document.head.appendChild(style);
        }
    };

    const applyFontSize = (size: string) => {
        setCurrentFontSize(size);
        const { from, to } = editor.state.selection;
        if (from !== to) {
            editor.chain().focus().setFontSize(`${size}pt`).run();
        } else {
            const existingStyle = document.getElementById('aroko-font-size-override');
            if (existingStyle) existingStyle.remove();
            const style = document.createElement('style');
            style.id = 'aroko-font-size-override';
            style.textContent = `.ProseMirror, .ProseMirror p { font-size: ${size}pt !important; }`;
            document.head.appendChild(style);
        }
    };

    const getCurrentHeading = () => {
        if (editor.isActive('heading', { level: 1 })) return 'H1';
        if (editor.isActive('heading', { level: 2 })) return 'H2';
        if (editor.isActive('heading', { level: 3 })) return 'H3';
        return 'P';
    };

    const setHeading = (level: number) => {
        if (level === 0) {
            editor.chain().focus().setParagraph().run();
        } else {
            editor.chain().focus().setHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run();
        }
    };

    const insertTable = () => {
        editor.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: true }).run();
        setShowTablePopover(false);
    };

    const isInTable = editor.isActive('table');

    return (
        <div className="bg-white border-b border-gray-200 px-4 py-2 overflow-visible">
            {/* Row 1: Font, Size, Spacing, Headings, Export */}
            <div className="flex items-center gap-2 mb-2">
                <select
                    className="px-2 py-1 text-xs text-gray-800 border border-gray-200 rounded bg-white w-32 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    value={currentFontFamily}
                    onChange={(e) => applyFontFamily(e.target.value)}
                    title="Font Family"
                >
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Arial">Arial</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Calibri">Calibri</option>
                    <option value="Cambria">Cambria</option>
                </select>

                <select
                    className="px-2 py-1 text-xs text-gray-800 border border-gray-200 rounded bg-white w-14 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    value={currentFontSize}
                    onChange={(e) => applyFontSize(e.target.value)}
                    title="Font Size"
                >
                    {[10, 11, 12, 14, 16, 18, 20, 24, 28, 32].map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>

                <select
                    className="px-2 py-1 text-xs text-gray-800 border border-gray-200 rounded bg-white w-16 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    value={currentLineSpacing}
                    onChange={(e) => applyLineSpacing(e.target.value)}
                    title="Line Spacing"
                >
                    <option value="1">1.0</option>
                    <option value="1.15">1.15</option>
                    <option value="1.5">1.5</option>
                    <option value="2">2.0</option>
                    <option value="2.5">2.5</option>
                    <option value="3">3.0</option>
                </select>

                <Divider />

                <div className="flex items-center gap-0.5 bg-gray-100 rounded px-1">
                    <button
                        onMouseDown={(e) => { e.preventDefault(); setHeading(0); }}
                        className={`px-2 py-1 text-xs rounded font-medium ${getCurrentHeading() === 'P' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                    >P</button>
                    <button
                        onMouseDown={(e) => { e.preventDefault(); setHeading(1); }}
                        className={`px-2 py-1 text-xs font-bold rounded ${getCurrentHeading() === 'H1' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                    >H1</button>
                    <button
                        onMouseDown={(e) => { e.preventDefault(); setHeading(2); }}
                        className={`px-2 py-1 text-xs font-semibold rounded ${getCurrentHeading() === 'H2' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                    >H2</button>
                    <button
                        onMouseDown={(e) => { e.preventDefault(); setHeading(3); }}
                        className={`px-2 py-1 text-xs rounded ${getCurrentHeading() === 'H3' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                    >H3</button>
                </div>

                <div className="flex-1" />

                {/* Table */}
                <div className="relative">
                    <button
                        onMouseDown={(e) => { e.preventDefault(); setShowTablePopover(!showTablePopover); }}
                        className={`p-1.5 rounded transition-colors ${showTablePopover ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Insert Table"
                    >
                        <Table size={16} />
                    </button>
                    {showTablePopover && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 min-w-40">
                            <div className="text-xs text-gray-500 mb-2">Table Size</div>
                            <div className="flex gap-2 mb-2">
                                <select value={tableRows} onChange={e => setTableRows(+e.target.value)} className="flex-1 px-2 py-1 text-xs border rounded">
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n} rows</option>)}
                                </select>
                                <select value={tableCols} onChange={e => setTableCols(+e.target.value)} className="flex-1 px-2 py-1 text-xs border rounded">
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n} cols</option>)}
                                </select>
                            </div>
                            <button onClick={insertTable} className="w-full py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">Insert</button>
                        </div>
                    )}
                </div>

                {/* Table Edit Controls */}
                {isInTable && (
                    <div className="flex items-center gap-0.5 bg-blue-50 px-1 py-0.5 rounded text-xs ml-1">
                        <button onClick={() => editor.chain().focus().addRowAfter().run()} className="px-1.5 py-0.5 text-blue-600 hover:bg-blue-100 rounded">+Row</button>
                        <button onClick={() => editor.chain().focus().deleteRow().run()} className="px-1.5 py-0.5 text-red-600 hover:bg-red-100 rounded">-Row</button>
                        <button onClick={() => editor.chain().focus().addColumnAfter().run()} className="px-1.5 py-0.5 text-blue-600 hover:bg-blue-100 rounded">+Col</button>
                        <button onClick={() => editor.chain().focus().deleteColumn().run()} className="px-1.5 py-0.5 text-red-600 hover:bg-red-100 rounded">-Col</button>
                        <button onClick={() => editor.chain().focus().deleteTable().run()} className="px-1.5 py-0.5 text-red-600 hover:bg-red-100 rounded">🗑️</button>
                    </div>
                )}

                <button
                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setHorizontalRule().run(); }}
                    className="p-1.5 text-gray-500 hover:bg-purple-50 hover:text-purple-600 rounded ml-1"
                    title="Insert Page Break"
                >
                    <SeparatorHorizontal size={16} />
                </button>

                <button
                    onMouseDown={async (e) => { e.preventDefault(); await handleExport(); }}
                    className="p-1.5 text-gray-500 hover:bg-green-50 hover:text-green-600 rounded"
                    title="Export as DOCX"
                >
                    <FileText size={16} />
                </button>
            </div>

            {/* Row 2: Text Formatting, Alignment, Lists, Link, Table */}
            <div className="flex items-center gap-1">
                <IconBtn onClick={() => editor.chain().focus().undo().run()} Icon={Undo} title="Undo" />
                <IconBtn onClick={() => editor.chain().focus().redo().run()} Icon={Redo} title="Redo" />

                <Divider />

                <IconBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} Icon={Bold} title="Bold" />
                <IconBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} Icon={Italic} title="Italic" />
                <IconBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} Icon={Strikethrough} title="Strike" />
                <IconBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} Icon={Highlighter} title="Highlight" />

                <Divider />

                <IconBtn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} Icon={Superscript} title="Superscript" />
                <IconBtn onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')} Icon={Subscript} title="Subscript" />

                <Divider />

                <IconBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} Icon={List} title="Bullet List" />
                <IconBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} Icon={ListOrdered} title="Numbered" />

                <Divider />

                <IconBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} Icon={AlignLeft} title="Left" />
                <IconBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} Icon={AlignCenter} title="Center" />
                <IconBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} Icon={AlignRight} title="Right" />
                <IconBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} Icon={AlignJustify} title="Justify" />

                <Divider />

                <IconBtn onClick={addLink} active={editor.isActive('link')} Icon={Link} title="Link" />
                <IconBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} Icon={Code} title="Code" />
            </div>
        </div>
    );
}
