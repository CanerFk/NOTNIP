import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ToggleBlockView } from './ToggleBlockView.tsx';

export const ToggleBlock = Node.create({
    name: 'toggleBlock',
    group: 'block',
    content: 'block+',

    addAttributes() {
        return {
            collapsed: {
                default: false,
                parseHTML: (element) => element.getAttribute('data-collapsed') === 'true',
                renderHTML: (attributes) => ({
                    'data-collapsed': attributes.collapsed ? 'true' : 'false',
                }),
            },
            title: {
                default: 'Toggle Header',
                parseHTML: (element) => element.getAttribute('data-title'),
                renderHTML: (attributes) => ({
                    'data-title': attributes.title,
                }),
            },
            headerStyle: {
                default: 'normal',
                parseHTML: (element) => element.getAttribute('data-header-style') || element.getAttribute('data-size') || 'normal',
                renderHTML: (attributes) => ({
                    'data-header-style': attributes.headerStyle,
                }),
            },
            headerColor: {
                default: '',
                parseHTML: (element) => element.getAttribute('data-header-color') || '',
                renderHTML: (attributes) => {
                    if (!attributes.headerColor) return {};
                    return { 'data-header-color': attributes.headerColor };
                },
            },
            tabbed: {
                default: true,
                parseHTML: (element) => element.getAttribute('data-tabbed') !== 'false',
                renderHTML: (attributes) => ({
                    'data-tabbed': attributes.tabbed ? 'true' : 'false',
                }),
            }
        };
    },

    parseHTML() {
        return [
            { tag: 'div[data-type="toggle-block"]' }
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'toggle-block' }), 0];
    },

    addNodeView() {
        return ReactNodeViewRenderer(ToggleBlockView);
    },

    addKeyboardShortcuts() {
        return {};
    }
});
