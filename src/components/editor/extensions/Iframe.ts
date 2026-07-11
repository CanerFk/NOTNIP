import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { IframeView } from './IframeView';

export interface IframeOptions {
    allowFullscreen: boolean;
    HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        iframe: {
            setIframe: (options: { src: string; title?: string }) => ReturnType;
        };
    }
}

export const Iframe = Node.create<IframeOptions>({
    name: 'iframe',

    group: 'block',

    atom: true,

    isolating: true,
    selectable: false,
    draggable: false,

    addOptions() {
        return {
            allowFullscreen: true,
            HTMLAttributes: {},
        };
    },

    addAttributes() {
        return {
            src: { default: null },
            title: { default: 'DOCUMENT' },
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

    parseHTML() {
        return [{ tag: 'iframe' }];
    },

    addNodeView() {
        return ReactNodeViewRenderer(IframeView);
    },

    renderHTML({ HTMLAttributes }) {
        return ['iframe', HTMLAttributes];
    },

    addCommands() {
        return {
            setIframe:
                (options) =>
                    ({ tr, dispatch }) => {
                        const { selection } = tr;
                        const node = this.type.create(options);
                        if (dispatch) {
                            tr.replaceRangeWith(selection.from, selection.to, node);
                        }
                        return true;
                    },
        };
    },
});
