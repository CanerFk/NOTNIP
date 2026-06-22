import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { TextSelection } from '@tiptap/pm/state';

const searchPluginKey = new PluginKey('searchAndReplace');

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        searchAndReplace: {
            setSearchTerm: (term: string) => ReturnType;
            goToNextMatch: () => ReturnType;
            goToPrevMatch: () => ReturnType;
            clearSearch: () => ReturnType;
            replaceCurrent: (replacement: string) => ReturnType;
            replaceAll: (replacement: string) => ReturnType;
        };
    }
}

export const SearchAndReplace = Extension.create({
    name: 'searchAndReplace',

    addOptions() {
        return {
            onOpen: undefined as (() => void) | undefined,
            onClose: undefined as (() => void) | undefined,
        };
    },

    addStorage() {
        return {
            searchTerm: '',
            activeIndex: 0,
            results: [] as { from: number; to: number }[],
            isOpen: false,
        };
    },

    addCommands() {
        return {
            setSearchTerm:
                (term: string) =>
                ({ editor }) => {
                    this.storage.searchTerm = term;
                    this.storage.activeIndex = 0;
                    editor.view.dispatch(
                        editor.state.tr.setMeta(searchPluginKey, {
                            searchTerm: term,
                        })
                    );
                    return true;
                },
            goToNextMatch:
                () =>
                ({ editor }) => {
                    const { results } = this.storage;
                    if (results.length === 0) return false;
                    this.storage.activeIndex =
                        (this.storage.activeIndex + 1) % results.length;
                    const match = results[this.storage.activeIndex];
                    if (match) {
                        const { tr } = editor.state;
                        tr.setSelection(
                            TextSelection.create(tr.doc, match.from, match.to)
                        );
                        tr.setMeta(searchPluginKey, { navigate: true });
                        editor.view.dispatch(tr);
                    }
                    return true;
                },
            goToPrevMatch:
                () =>
                ({ editor }) => {
                    const { results } = this.storage;
                    if (results.length === 0) return false;
                    this.storage.activeIndex =
                        (this.storage.activeIndex - 1 + results.length) %
                        results.length;
                    const match = results[this.storage.activeIndex];
                    if (match) {
                        const { tr } = editor.state;
                        tr.setSelection(
                            TextSelection.create(tr.doc, match.from, match.to)
                        );
                        tr.setMeta(searchPluginKey, { navigate: true });
                        editor.view.dispatch(tr);
                    }
                    return true;
                },
            replaceCurrent:
                (replacement: string) =>
                ({ editor }) => {
                    const { results, activeIndex } = this.storage;
                    if (results.length === 0) return false;
                    const match = results[activeIndex];
                    if (!match) return false;

                    const { tr } = editor.state;
                    tr.insertText(replacement, match.from, match.to);
                    tr.setMeta(searchPluginKey, { replaced: true });
                    editor.view.dispatch(tr);

                    const newResults = this.storage.results;
                    if (newResults.length > 0 && this.storage.activeIndex >= newResults.length) {
                        this.storage.activeIndex = 0;
                    }
                    return true;
                },
            replaceAll:
                (replacement: string) =>
                ({ editor }) => {
                    const { results } = this.storage;
                    if (results.length === 0) return false;

                    const { tr } = editor.state;
                    const reversed = [...results].reverse();
                    for (const match of reversed) {
                        tr.insertText(replacement, match.from, match.to);
                    }
                    tr.setMeta(searchPluginKey, { replaced: true });
                    editor.view.dispatch(tr);
                    this.storage.activeIndex = 0;
                    return true;
                },
            clearSearch:
                () =>
                ({ editor }) => {
                    this.storage.searchTerm = '';
                    this.storage.activeIndex = 0;
                    this.storage.results = [];
                    this.storage.isOpen = false;
                    editor.view.dispatch(
                        editor.state.tr.setMeta(searchPluginKey, { clear: true })
                    );
                    return true;
                },
        };
    },

    addKeyboardShortcuts() {
        return {
            'Mod-f': () => {
                this.storage.isOpen = true;
                this.options.onOpen?.();
                return true;
            },
            Escape: () => {
                if (this.storage.isOpen) {
                    this.storage.isOpen = false;
                    this.editor.commands.clearSearch();
                    this.options.onClose?.();
                    return true;
                }
                return false;
            },
        };
    },

    addProseMirrorPlugins() {
        const storage = this.storage;
        return [
            new Plugin({
                key: searchPluginKey,
                state: {
                    init() {
                        return DecorationSet.empty;
                    },
                    apply(tr, oldDecorations, _oldState, newState) {
                        const meta = tr.getMeta(searchPluginKey);
                        if (!meta && !tr.docChanged) return oldDecorations;
                        if (meta?.clear) {
                            storage.results = [];
                            return DecorationSet.empty;
                        }

                        const { searchTerm } = storage;
                        if (!searchTerm) {
                            storage.results = [];
                            return DecorationSet.empty;
                        }

                        const results: { from: number; to: number }[] = [];
                        const lowerTerm = searchTerm.toLowerCase();

                        newState.doc.descendants((node, pos) => {
                            if (!node.isText || !node.text) return;
                            const text = node.text.toLowerCase();
                            let index = 0;
                            while (
                                (index = text.indexOf(lowerTerm, index)) !== -1
                            ) {
                                results.push({
                                    from: pos + index,
                                    to: pos + index + searchTerm.length,
                                });
                                index += searchTerm.length;
                            }
                        });

                        storage.results = results;
                        if (storage.activeIndex >= results.length) {
                            storage.activeIndex = Math.max(
                                0,
                                results.length - 1
                            );
                        }

                        const decorations = results.map((result, i) =>
                            Decoration.inline(result.from, result.to, {
                                class:
                                    i === storage.activeIndex
                                        ? 'search-highlight-active'
                                        : 'search-highlight',
                            })
                        );

                        return DecorationSet.create(newState.doc, decorations);
                    },
                },
                props: {
                    decorations(state) {
                        return this.getState(state);
                    },
                },
            }),
        ];
    },
});
