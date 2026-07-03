// Inline Diff Extension for Tiptap
// Shows proposed edits directly in the document using ProseMirror Decorations.
// Old text gets a red background + strikethrough, new text appears in green below.

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const inlineDiffPluginKey = new PluginKey('inlineDiff');

export interface PendingDiffEdit {
    id: string;
    from: number;
    to: number;
    newHtml: string;
    sectionTitle: string;
    explanation: string;
}

function createDecorations(doc: any, edits: PendingDiffEdit[]): DecorationSet {
    if (!edits || edits.length === 0) return DecorationSet.empty;

    const decorations: Decoration[] = [];

    for (const edit of edits) {
        // Validate positions against current doc size
        if (edit.from < 0 || edit.to > doc.content.size || edit.from >= edit.to) continue;

        // Highlight each top-level node in the old section with red styling
        doc.nodesBetween(edit.from, edit.to, (node: any, pos: number, parent: any) => {
            // Only decorate top-level block nodes (direct children of the doc)
            if (parent && parent.type.name === 'doc') {
                decorations.push(
                    Decoration.node(pos, pos + node.nodeSize, {
                        class: 'aroko-diff-old',
                    })
                );
            }
            return false; // Don't descend into children
        });

        // Widget decoration at the end of the old section: shows the green replacement
        decorations.push(
            Decoration.widget(edit.to, () => {
                const wrapper = document.createElement('div');
                wrapper.className = 'aroko-diff-new-wrapper';

                // Label
                const label = document.createElement('div');
                label.className = 'aroko-diff-new-label';
                label.textContent = `Proposed change: ${edit.explanation}`;
                wrapper.appendChild(label);

                // New content
                const content = document.createElement('div');
                content.className = 'aroko-diff-new-content';
                content.innerHTML = edit.newHtml;
                wrapper.appendChild(content);

                // Accept / Reject buttons
                const btns = document.createElement('div');
                btns.className = 'aroko-diff-btns';

                const acceptBtn = document.createElement('button');
                acceptBtn.className = 'aroko-diff-btn-accept';
                acceptBtn.textContent = '✓ Accept';
                acceptBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.dispatchEvent(
                        new CustomEvent('aroko:accept-edit', { detail: { id: edit.id } })
                    );
                });

                const rejectBtn = document.createElement('button');
                rejectBtn.className = 'aroko-diff-btn-reject';
                rejectBtn.textContent = '✕ Reject';
                rejectBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.dispatchEvent(
                        new CustomEvent('aroko:reject-edit', { detail: { id: edit.id } })
                    );
                });

                btns.appendChild(acceptBtn);
                btns.appendChild(rejectBtn);
                wrapper.appendChild(btns);

                return wrapper;
            }, { side: 1 })
        );
    }

    return DecorationSet.create(doc, decorations);
}

export const InlineDiff = Extension.create({
    name: 'inlineDiff',

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: inlineDiffPluginKey,
                state: {
                    init() {
                        return DecorationSet.empty;
                    },
                    apply(tr, oldDecos) {
                        const meta = tr.getMeta(inlineDiffPluginKey);
                        if (meta && 'edits' in meta) {
                            // Rebuild decorations from fresh edits
                            return createDecorations(tr.doc, meta.edits);
                        }
                        // Map existing decorations through document changes
                        return oldDecos.map(tr.mapping, tr.doc);
                    },
                },
                props: {
                    decorations(state) {
                        return inlineDiffPluginKey.getState(state);
                    },
                },
            }),
        ];
    },
});
