import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { CodeBlockView } from './CodeBlockView.tsx';

export const CodeBlock = CodeBlockLowlight.extend({
    isolating: true,
    selectable: false, // CRITICAL: Prevents cursor from selecting the node
    draggable: false, // Prevent drag-and-drop

    addKeyboardShortcuts() {
        return {
            ...this.parent?.(),
            Tab: () => {
                if (this.editor.isActive('codeBlock')) {
                    this.editor.commands.insertContent('\t');
                    return true;
                }
                return false;
            },
        };
    },

    addAttributes() {
        return {
            ...this.parent?.(),
            language: {
                default: null,
                renderHTML: attributes => ({
                    class: `language-${attributes.language}`,
                }),
            },
            width: {
                default: '100%',
                renderHTML: (attributes) => ({ width: attributes.width }),
            },
            align: {
                default: 'center',
                renderHTML: (attributes) => ({ 'data-align': attributes.align }),
            },
            isMinimized: {
                default: false,
                renderHTML: (attributes) => ({ 'data-minimized': attributes.isMinimized }),
            },
        };
    },

    addNodeView() {
        return ReactNodeViewRenderer(CodeBlockView);
    },

    renderHTML({ HTMLAttributes }) {
        return ['code-block-component', HTMLAttributes];
    },
});
