'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import StarterKit from '@tiptap/starter-kit';
import { type DocumentStructure } from '@/lib/schemas/document-schema';
import { useEffect } from 'react';
import EditorBubbleMenu from './BubbleMenu';
import FontSize from '@/lib/editor/FontSize';
import { ChartNode } from '@/lib/tiptap/chart-extension';
import { InlineDiff } from '@/lib/tiptap/inline-diff-extension';

interface TiptapEditorProps {
    content?: string | null;
    className?: string;
    onEditorReady?: (editor: any) => void;
    externalData?: DocumentStructure | null;
}

export default function TiptapEditor({ className, onEditorReady, externalData }: TiptapEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({}),
            Highlight,
            Subscript,
            Superscript,
            TextStyle,
            FontFamily,
            FontSize,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
                alignments: ['left', 'center', 'right', 'justify'],
                defaultAlignment: 'left',
            }),
            Link.configure({ openOnClick: false }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
            ChartNode, // Custom chart node for rendering Recharts
            InlineDiff, // VS Code style inline diffs
        ],
        content: '<p>Start writing or ask AROKO to generate content...</p>',
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'tiptap-editor mx-auto focus:outline-none min-h-[1000px] w-full max-w-[816px] p-12 md:p-[60px] bg-white shadow-sm ring-1 ring-gray-900/5 my-8 rounded-sm text-black text-base selection:bg-blue-100 selection:text-blue-900 transition-shadow hover:shadow-md',
            },
        },
        onCreate({ editor }) {
            if (onEditorReady) onEditorReady(editor);
        },
    });

    // THE MAGIC: When AI sends new JSON data, we convert it to HTML and APPEND it
    useEffect(() => {
        if (externalData && editor) {
            // Convert JSON blocks to HTML string
            let htmlContent = '';

            externalData.blocks.forEach(block => {
                const style = `style="
                ${block.style?.lineSpacing ? `line-height: ${block.style.lineSpacing};` : ''} 
                ${block.style?.fontFamily ? `font-family: '${block.style.fontFamily}';` : ''}
                ${block.style?.fontSize ? `font-size: ${block.style.fontSize}px;` : ''}
            "`;

                // Apply bold/italic wrappers
                let content = block.content;
                if (block.style?.bold) content = `<strong>${content}</strong>`;
                if (block.style?.italic) content = `<em>${content}</em>`;

                if (block.type === 'heading') {
                    htmlContent += `<h${block.style?.level || 1} ${style}>${content}</h${block.style?.level || 1}>`;
                } else if (block.type === 'paragraph') {
                    htmlContent += `<p ${style}>${content}</p>`;
                } else if (block.type === 'bullet_list') {
                    htmlContent += `<ul ${style}><li>${content}</li></ul>`;
                }
            });

            // Get current content
            const currentContent = editor.getHTML();

            // If editor only has the default placeholder, replace it; otherwise append
            if (currentContent === '<p>Start writing or ask AROKO to generate content...</p>' ||
                currentContent === '<p></p>') {
                editor.commands.setContent(htmlContent);
            } else {
                // Move cursor to end and insert new content
                editor.commands.focus('end');
                editor.commands.insertContent(htmlContent);
            }
        }
    }, [externalData, editor]);

    return (
        <div className={className}>
            {editor && <EditorBubbleMenu editor={editor} />}
            <EditorContent editor={editor} />
        </div>
    );
}
