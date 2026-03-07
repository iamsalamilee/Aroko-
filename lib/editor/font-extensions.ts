// Custom TipTap extensions for font family and font size

import { Extension } from '@tiptap/core';

// Font Family Extension
export const FontFamily = Extension.create({
    name: 'fontFamily',

    addOptions() {
        return {
            types: ['textStyle'],
        };
    },

    addGlobalAttributes() {
        return [
            {
                types: ['textStyle'],
                attributes: {
                    fontFamily: {
                        default: null,
                        parseHTML: element => element.style.fontFamily?.replace(/['"]/g, ''),
                        renderHTML: attributes => {
                            if (!attributes.fontFamily) return {};
                            return {
                                style: `font-family: ${attributes.fontFamily}`,
                            };
                        },
                    },
                },
            },
        ];
    },

    addCommands() {
        return {
            setFontFamily: (fontFamily: string) => ({ chain }: any) => {
                return chain().setMark('textStyle', { fontFamily }).run();
            },
            unsetFontFamily: () => ({ chain }: any) => {
                return chain().setMark('textStyle', { fontFamily: null }).removeEmptyTextStyle().run();
            },
        };
    },
});

// Font Size Extension  
export const FontSize = Extension.create({
    name: 'fontSize',

    addOptions() {
        return {
            types: ['textStyle'],
        };
    },

    addGlobalAttributes() {
        return [
            {
                types: ['textStyle'],
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: element => element.style.fontSize,
                        renderHTML: attributes => {
                            if (!attributes.fontSize) return {};
                            return {
                                style: `font-size: ${attributes.fontSize}`,
                            };
                        },
                    },
                },
            },
        ];
    },

    addCommands() {
        return {
            setFontSize: (fontSize: string) => ({ chain }: any) => {
                return chain().setMark('textStyle', { fontSize }).run();
            },
            unsetFontSize: () => ({ chain }: any) => {
                return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
            },
        };
    },
});

// Line Height Extension
export const LineHeight = Extension.create({
    name: 'lineHeight',

    addOptions() {
        return {
            types: ['paragraph', 'heading'],
        };
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    lineHeight: {
                        default: null,
                        parseHTML: element => element.style.lineHeight,
                        renderHTML: attributes => {
                            if (!attributes.lineHeight) return {};
                            return {
                                style: `line-height: ${attributes.lineHeight}`,
                            };
                        },
                    },
                },
            },
        ];
    },
});
