import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { TableBlockView } from './TableBlockView.tsx';

export const TableBlock = Node.create({
    name: 'tableBlock',
    group: 'block',
    content: 'table', // Strictly accept one table node
    draggable: true,

    addAttributes() {
        return {
            isMinimized: {
                default: false,
                parseHTML: (element) => element.getAttribute('data-minimized') === 'true',
                renderHTML: (attributes) => ({
                    'data-minimized': attributes.isMinimized,
                }),
            },
            title: {
                default: 'Untitled Table',
                parseHTML: (element) => element.getAttribute('data-title'),
                renderHTML: (attributes) => ({
                    'data-title': attributes.title,
                }),
            },
            headerColor: {
                default: '',
                parseHTML: (element) => element.getAttribute('data-header-color') || '',
                renderHTML: (attributes) => {
                    if (!attributes.headerColor) return {}
                    return { 'data-header-color': attributes.headerColor }
                },
            },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-type="table-block"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'table-block' }), 0];
    },

    addNodeView() {
        return ReactNodeViewRenderer(TableBlockView);
    },

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('tableAutoWrapper'),
                appendTransaction: (transactions, _oldState, newState) => {
                    // Only run if document actually changed
                    if (!transactions.some(tr => tr.docChanged)) return null;

                    const tr = newState.tr;
                    let modified = false;
                    const nakedPositions: { pos: number, node: any }[] = [];

                    // Traverse to find naked tables
                    newState.doc.descendants((node, pos) => {
                        if (node.type.name === 'table') {
                            const $pos = newState.doc.resolve(pos);
                            if ($pos.parent.type.name !== 'tableBlock') {
                                nakedPositions.push({ pos, node });
                            }
                            return false; // Don't traverse inside table
                        }
                        return true;
                    });

                    // Mutate in reverse order to prevent position shifting
                    nakedPositions.reverse().forEach(({ pos, node }) => {
                        const tableBlockType = newState.schema.nodes.tableBlock;
                        if (tableBlockType) {
                            const tableBlock = tableBlockType.create(null, node);
                            tr.replaceWith(pos, pos + node.nodeSize, tableBlock);
                            modified = true;
                        }
                    });

                    return modified ? tr : null;
                }
            })
        ];
    }
});
