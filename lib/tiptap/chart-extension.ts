import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ChartNodeView from '@/components/editor/ChartNodeView';

export interface ChartNodeAttributes {
    chartData: string; // JSON stringified AIChartData
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        chartNode: {
            insertChart: (data: string) => ReturnType;
        };
    }
}

export const ChartNode = Node.create({
    name: 'chartNode',
    group: 'block',
    atom: true, // Cannot be split or merged
    draggable: true,

    addAttributes() {
        return {
            chartData: {
                default: '{}',
                parseHTML: element => element.getAttribute('data-chart'),
                renderHTML: attributes => ({
                    'data-chart': attributes.chartData,
                }),
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-chart-node]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes({ 'data-chart-node': '' }, HTMLAttributes)];
    },

    addNodeView() {
        return ReactNodeViewRenderer(ChartNodeView);
    },

    addCommands() {
        return {
            insertChart:
                (data: string) =>
                    ({ commands }) => {
                        return commands.insertContent({
                            type: this.name,
                            attrs: { chartData: data },
                        });
                    },
        };
    },
});

export default ChartNode;
