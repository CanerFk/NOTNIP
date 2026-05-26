import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ToggleBlockView } from './ToggleBlockView.tsx';

export const ToggleBlock = Node.create({
    name: 'toggleBlock',
    group: 'block',
    content: 'block+', // Can contain multiple block elements. First block acts as header.

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
            size: {
                default: 'normal',
                parseHTML: (element) => element.getAttribute('data-size') || 'normal',
                renderHTML: (attributes) => ({
                    'data-size': attributes.size,
                }),
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
        return {
            // Tiptap's default container behavior usually handles "Enter" well 
            // but we can ensure standard behavior passes through.
        };
    }
});
