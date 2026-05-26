import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { SubpageItemView } from './SubpageItemView';

export const SubpageItem = Node.create({
    name: 'subpageItem',

    group: 'block', // Block level
    inline: false,  // Not inline
    atom: true,     // Treated as a single unit
    isolating: true, // Prevents text from merging into it
    selectable: false, // CRITICAL: Prevents cursor from selecting the node, which would cause typing to replace it
    draggable: false, // Prevent drag-and-drop

    addAttributes() {
        return {
            id: {
                default: null,
                parseHTML: element => element.getAttribute('data-id'),
                renderHTML: attributes => ({
                    'data-id': attributes.id,
                }),
            },
            title: {
                default: 'Untitled Subpage',
                parseHTML: element => element.getAttribute('data-title'),
                renderHTML: attributes => ({
                    'data-title': attributes.title,
                }),
            },
            icon: {
                default: 'file',
                parseHTML: element => element.getAttribute('data-icon'),
                renderHTML: attributes => ({
                    'data-icon': attributes.icon,
                }),
            },
            type: {
                default: 'page',
            }
        };
    },

    parseHTML() {
        return [
            {
                tag: 'subpage-item',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['subpage-item', mergeAttributes(HTMLAttributes)];
    },

    addNodeView() {
        return ReactNodeViewRenderer(SubpageItemView);
    },

    addKeyboardShortcuts() {
        const triggerDeleteConfirmation = () => {
            const { selection } = this.editor.state;

            // Check if cursor is near or on a subpageItem
            // We scan the selection range for any subpageItem nodes
            const { from, to } = selection;
            let foundSubpage: { id: string } | null = null;

            this.editor.state.doc.nodesBetween(from, to, (node) => {
                if (node.type.name === 'subpageItem' && node.attrs.id) {
                    foundSubpage = { id: node.attrs.id };
                    return false; // Stop iteration
                }
                return true;
            });

            if (foundSubpage) {
                // Trigger Safe Delete Modal
                import('../../../store/useStore').then(({ useStore }) => {
                    useStore.getState().setDeletionCandidateId(foundSubpage!.id);
                });
                return true; // Prevent default delete
            }

            return false; // Let default handle
        };

        return {
            'Backspace': triggerDeleteConfirmation,
            'Delete': triggerDeleteConfirmation,
        };
    }
});
