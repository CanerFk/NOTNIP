import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { Heading1, Heading2, List, ListOrdered, CheckSquare, Code, Type, Quote, Grid3X3, ChevronDown, FolderPlus, Image, FileText, Minus } from 'lucide-react';
import React from 'react';
import { useStore } from '../../../store/useStore';

export interface CommandFlag {
    key: string;
    label: string;
    isDefault?: boolean;
}

export function parseSlashQuery(query: string) {
    // Highly optimized native O(n) split
    const parts = query.trim().split(/\s+/);
    const activeFlags: string[] = [];
    const cmdParts: string[] = [];
    const hasFlags = query.includes(' -');

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part.startsWith('-') && part.length > 1) {
            activeFlags.push(part.slice(1).toLowerCase());
        } else if (part !== '-') {
            cmdParts.push(part);
        }
    }

    return {
        commandQuery: cmdParts.join(' ').toLowerCase(),
        activeFlags,
        hasFlags,
    };
}

export const Commands = Extension.create({
    name: 'slash-commands',

    addOptions() {
        return {
            suggestion: {
                char: '/',
                allowSpaces: true,
                command: ({ editor, range, props }: any) => {
                    props.command({ editor, range });
                },
            },
        };
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
                allow: ({ state, range }: { state: any; range: any }) => {
                    const $from = state.doc.resolve(range.from);
                    if ($from.parent.type.name !== 'paragraph' && !$from.parent.type.name.startsWith('heading')) {
                        return false;
                    }
                    const disallowed = ['blockquote', 'codeBlock', 'table', 'tableCell', 'tableHeader', 'iframe'];
                    for (let d = $from.depth; d > 0; d--) {
                        if (disallowed.includes($from.node(d).type.name)) {
                            return false;
                        }
                    }
                    return true;
                },
            }),
        ];
    },
});

export const getSuggestionItems = ({ query }: { query: string }) => {
    const { commandQuery, activeFlags } = parseSlashQuery(query);

    const items = [
        {
            title: 'Text',
            icon: React.createElement(Type, { size: 14 }),
            flags: [] as CommandFlag[],
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setParagraph().run();
            },
        },
        {
            title: 'Heading 1',
            icon: React.createElement(Heading1, { size: 14 }),
            flags: [{ key: 'c', label: 'Color' }] as CommandFlag[],
            command: ({ editor, range }: any) => {
                const colorMap: Record<string, string> = { cr: 'red', cy: 'yellow', cg: 'green', cb: 'blue', cp: 'purple', ca: 'aqua', co: 'orange' };
                const colorFlag = activeFlags.slice().reverse().find(f => Object.keys(colorMap).includes(f) || f.startsWith('c'));
                let color = activeFlags.includes('c') ? 'yellow' : null;
                if (colorFlag && colorFlag !== 'c') color = colorMap[colorFlag] || colorFlag.slice(1);
                editor.chain().focus().deleteRange(range).setHeading({ level: 1, color }).run();
            },
        },
        {
            title: 'Heading 2',
            icon: React.createElement(Heading2, { size: 14 }),
            flags: [{ key: 'c', label: 'Color' }] as CommandFlag[],
            command: ({ editor, range }: any) => {
                const colorMap: Record<string, string> = { cr: 'red', cy: 'yellow', cg: 'green', cb: 'blue', cp: 'purple', ca: 'aqua', co: 'orange' };
                const colorFlag = activeFlags.slice().reverse().find(f => Object.keys(colorMap).includes(f) || f.startsWith('c'));
                let color = activeFlags.includes('c') ? 'yellow' : null;
                if (colorFlag && colorFlag !== 'c') color = colorMap[colorFlag] || colorFlag.slice(1);
                editor.chain().focus().deleteRange(range).setHeading({ level: 2, color }).run();
            },
        },
        {
            title: 'Bullet List',
            icon: React.createElement(List, { size: 14 }),
            flags: [
                { key: 'd', label: 'Disc', isDefault: true },
                { key: 's', label: 'Square' },
                { key: 'c', label: 'Circle' },
                { key: 't', label: 'Toggleable' },
            ] as CommandFlag[],
            command: ({ editor, range }: any) => {
                // Determine mutual-exclusive list type checking the last used flag
                const listStyleFlag = activeFlags.slice().reverse().find(f => ['d', 's', 'c'].includes(f));
                let listType = 'disc';
                if (listStyleFlag === 's') listType = 'square';
                else if (listStyleFlag === 'c') listType = 'circle';

                const listNode = { type: 'bulletList', attrs: { listType }, content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }] };

                if (activeFlags.includes('t')) {
                    editor.chain().focus().deleteRange(range).insertContent({
                        type: 'toggleBlock',
                        attrs: { title: 'Toggle List' },
                        content: [listNode],
                    }).run();
                } else if (listType !== 'disc') {
                    editor.chain().focus().deleteRange(range).insertContent(listNode).run();
                } else {
                    editor.chain().focus().deleteRange(range).toggleBulletList().run();
                }
            },
        },
        {
            title: 'Numbered List',
            icon: React.createElement(ListOrdered, { size: 14 }),
            flags: [
                { key: 'n', label: 'Numbers', isDefault: true },
                { key: 'r', label: 'Roman' },
                { key: 'l', label: 'Letters' },
                { key: 't', label: 'Toggleable' },
            ] as CommandFlag[],
            command: ({ editor, range }: any) => {
                const listStyleFlag = activeFlags.slice().reverse().find(f => ['n', 'r', 'l'].includes(f));
                let listType = 'decimal';
                if (listStyleFlag === 'r') listType = 'roman';
                else if (listStyleFlag === 'l') listType = 'letters';

                const listNode = { type: 'orderedList', attrs: { listType }, content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }] };

                if (activeFlags.includes('t')) {
                    editor.chain().focus().deleteRange(range).insertContent({
                        type: 'toggleBlock',
                        attrs: { title: 'Toggle List' },
                        content: [listNode],
                    }).run();
                } else if (listType !== 'decimal') {
                    editor.chain().focus().deleteRange(range).insertContent(listNode).run();
                } else {
                    editor.chain().focus().deleteRange(range).toggleOrderedList().run();
                }
            },
        },
        {
            title: 'Task List',
            icon: React.createElement(CheckSquare, { size: 14 }),
            flags: [{ key: 't', label: 'Toggleable' }] as CommandFlag[],
            command: ({ editor, range }: any) => {
                if (activeFlags.includes('t')) {
                    editor.chain().focus().deleteRange(range).insertContent({
                        type: 'toggleBlock',
                        content: [{ type: 'taskList', content: [{ type: 'taskItem', content: [{ type: 'paragraph' }] }] }],
                    }).run();
                } else {
                    editor.chain().focus().deleteRange(range).toggleTaskList().run();
                }
            },
        },
        {
            title: 'Code Block',
            icon: React.createElement(Code, { size: 14 }),
            flags: [
                { key: 'ln', label: 'Line Numbers' },
                { key: 'w', label: 'Word Wrap' }
            ] as CommandFlag[],
            command: ({ editor, range }: any) => {
                const lineNumbers = activeFlags.includes('ln');
                const wordWrap = activeFlags.includes('w');
                editor.chain().focus().deleteRange(range).setCodeBlock({ lineNumbers, wordWrap }).run();
            },
        },
        {
            title: 'Quote',
            icon: React.createElement(Quote, { size: 14 }),
            flags: [{ key: 'a', label: 'Author' }] as CommandFlag[],
            command: ({ editor, range }: any) => {
                if (activeFlags.includes('a')) {
                    editor.chain().focus().deleteRange(range).insertContent({
                        type: 'blockquote',
                        content: [
                            { type: 'paragraph' },
                            {
                                type: 'paragraph',
                                content: [{ type: 'text', text: '— Author', marks: [{ type: 'italic' }] }]
                            }
                        ]
                    }).run();
                } else {
                    editor.chain().focus().deleteRange(range).toggleBlockquote().run();
                }
            },
        },
        {
            title: 'Table',
            icon: React.createElement(Grid3X3, { size: 14 }),
            flags: [
                { key: 'c', label: 'Color' },
            ] as CommandFlag[],
            command: ({ editor, range }: any) => {
                const colorMap: Record<string, string> = { cr: 'red', cy: 'yellow', cg: 'green', cb: 'blue', cp: 'purple', ca: 'aqua', co: 'orange' };
                const colorFlag = activeFlags.slice().reverse().find(f => Object.keys(colorMap).includes(f) || f.startsWith('c'));
                let headerColor = activeFlags.includes('c') ? 'aqua' : '';
                if (colorFlag && colorFlag !== 'c') headerColor = colorMap[colorFlag] || colorFlag.slice(1);

                editor.chain().focus().deleteRange(range).insertContent({
                    type: 'tableBlock',
                    attrs: { headerColor },
                    content: [{
                        type: 'table',
                        content: [
                            { type: 'tableRow', content: [{ type: 'tableHeader', content: [{ type: 'paragraph' }] }, { type: 'tableHeader', content: [{ type: 'paragraph' }] }, { type: 'tableHeader', content: [{ type: 'paragraph' }] }] },
                            { type: 'tableRow', content: [{ type: 'tableCell', content: [{ type: 'paragraph' }] }, { type: 'tableCell', content: [{ type: 'paragraph' }] }, { type: 'tableCell', content: [{ type: 'paragraph' }] }] },
                            { type: 'tableRow', content: [{ type: 'tableCell', content: [{ type: 'paragraph' }] }, { type: 'tableCell', content: [{ type: 'paragraph' }] }, { type: 'tableCell', content: [{ type: 'paragraph' }] }] },
                        ],
                    }],
                }).run();

                setTimeout(() => {
                    const { doc } = editor.state;
                    let firstCellPos = -1;
                    doc.descendants((node: any, pos: number) => {
                        if (firstCellPos === -1 && node.type.name === 'tableCell') {
                            firstCellPos = pos + 1;
                        }
                    });
                    if (firstCellPos !== -1) {
                        editor.commands.focus(firstCellPos);
                    }
                }, 10);
            },
        },
        {
            title: 'Toggle',
            icon: React.createElement(ChevronDown, { size: 14 }),
            flags: [
                { key: 't', label: 'Tabbed', isDefault: true },
                { key: 'nt', label: 'No Tab' },
            ] as CommandFlag[],
            command: ({ editor, range }: any) => {
                const tabbed = !activeFlags.includes('nt');
                editor.chain().focus().deleteRange(range).insertContent({
                    type: 'toggleBlock',
                    attrs: { tabbed },
                    content: [{ type: 'paragraph' }],
                }).run();
            },
        },
        {
            title: 'Toggle Small',
            icon: React.createElement(ChevronDown, { size: 12 }),
            flags: [
                { key: 't', label: 'Tabbed', isDefault: true },
                { key: 'nt', label: 'No Tab' },
            ] as CommandFlag[],
            command: ({ editor, range }: any) => {
                const tabbed = !activeFlags.includes('nt');
                editor.chain().focus().deleteRange(range).insertContent({
                    type: 'toggleBlock',
                    attrs: { size: 'small', tabbed },
                    content: [{ type: 'paragraph' }],
                }).run();
            },
        },
        {
            title: 'Divider',
            icon: React.createElement(Minus, { size: 14 }),
            flags: [
                { key: 'b', label: 'Bold' },
                { key: 'a', label: 'Accent' }
            ] as CommandFlag[],
            command: ({ editor, range }: any) => {
                const bold = activeFlags.includes('b');
                const accent = activeFlags.includes('a');
                editor.chain().focus().deleteRange(range).insertContent({
                    type: 'horizontalRule',
                    attrs: { bold, accent }
                }).run();
            },
        },
        {
            title: 'Image',
            icon: React.createElement(Image, { size: 14 }),
            flags: [
                { key: 'f', label: 'Full Width' },
                { key: 'c', label: 'Caption' }
            ] as CommandFlag[],
            command: ({ editor, range }: any) => {
                const fullWidth = activeFlags.includes('f');
                const hasCaption = activeFlags.includes('c');
                editor.chain().focus().deleteRange(range).run();
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.jpg,.jpeg,.png,.gif,.webp';
                input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
                        if (file.size > MAX_SIZE) {
                            const { confirm, open } = await import('@tauri-apps/plugin-dialog');
                            const wantLocal = await confirm(
                                `This file (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds Notnip's 5MB limit. Storing large files in system memory can degrade performance.\n\nWould you like to provide a "Local Link" directly to your computer instead of copying it? (Recommended)`,
                                { title: 'File Too Large (5MB Limit)', kind: 'warning' }
                            );

                            if (wantLocal) {
                                const selectedPath = await open({
                                    title: 'Please select the file from your computer',
                                    multiple: false,
                                    filters: [{ name: 'Resim', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }]
                                });

                                if (selectedPath) {
                                    const src = `local-link:${selectedPath}`;
                                    editor.chain().focus().insertContent({ type: 'resizableImage', attrs: { src, alt: file.name, fullWidth, hasCaption } }).run();
                                }
                            }
                            return;
                        }

                        const { assetManager } = await import('../../../lib/AssetManager');
                        const metadata = await assetManager.uploadFile(file);
                        if (metadata) {
                            editor.chain().focus().insertContent({ type: 'resizableImage', attrs: { src: metadata.path, alt: metadata.filename, fullWidth, hasCaption } }).run();
                        }
                    }
                };
                input.click();
            },
        },
        {
            title: 'PDF Document',
            icon: React.createElement(FileText, { size: 14 }),
            flags: [] as CommandFlag[],
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).run();
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.pdf';
                input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
                        if (file.size > MAX_SIZE) {
                            const { confirm, open } = await import('@tauri-apps/plugin-dialog');
                            const wantLocal = await confirm(
                                `This file (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds Notnip's 5MB limit. Storing large files in system memory can degrade performance.\n\nWould you like to provide a "Local Link" directly to your computer instead of copying it? (Recommended)`,
                                { title: 'File Too Large (5MB Limit)', kind: 'warning' }
                            );

                            if (wantLocal) {
                                const selectedPath = await open({
                                    title: 'Please select the file from your computer',
                                    multiple: false,
                                    filters: [{ name: 'PDF', extensions: ['pdf'] }]
                                });

                                if (selectedPath) {
                                    const src = `local-link:${selectedPath}`;
                                    editor.chain().focus().insertContent({ type: 'iframe', attrs: { src, title: file.name } }).run();
                                }
                            }
                            return;
                        }

                        const { assetManager } = await import('../../../lib/AssetManager');
                        const metadata = await assetManager.uploadFile(file);
                        if (metadata) {
                            editor.chain().focus().insertContent({ type: 'iframe', attrs: { src: metadata.path, title: metadata.filename } }).run();
                        }
                    }
                };
                input.click();
            },
        },
        {
            title: 'Subpage',
            icon: React.createElement(FolderPlus, { size: 14 }),
            flags: [] as CommandFlag[],
            command: ({ editor, range }: any) => {
                const parentPageId = useStore.getState().activePageId;
                if (!parentPageId) return;
                editor.chain().focus().deleteRange(range).run();
                const { addSubpage } = useStore.getState();
                addSubpage(parentPageId).then((newId: string) => {
                    editor.chain().focus().insertContent([{ type: 'subpageItem', attrs: { id: newId } }]).run();
                }).catch(() => { });
            },
        },
    ];

    if (!commandQuery) return items;
    return items.filter((item) => item.title.toLowerCase().includes(commandQuery));
};
