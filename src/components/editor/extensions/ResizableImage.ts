import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ResizableImageView } from './ResizableImageView';

export const ResizableImage = Image.extend({
    name: 'resizableImage',

    isolating: true,
    selectable: false, // CRITICAL: Prevents cursor from selecting the node
    draggable: false, // Prevent drag-and-drop

    addAttributes() {
        return {
            ...this.parent?.(),
            src: {
                default: null,
            },
            alt: {
                default: null,
            },
            title: {
                default: null,
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
            caption: {
                default: '',
            }
        };
    },

    addNodeView() {
        return ReactNodeViewRenderer(ResizableImageView);
    },

    renderHTML({ HTMLAttributes }) {
        return ['resizable-image-component', HTMLAttributes];
    },
});
