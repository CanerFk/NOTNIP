import { useEditor, EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import { TextSelection, AllSelection } from '@tiptap/pm/state';

import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Heading from '@tiptap/extension-heading';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Strike from '@tiptap/extension-strike';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Blockquote from '@tiptap/extension-blockquote';
import HardBreak from '@tiptap/extension-hard-break';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import History from '@tiptap/extension-history'; // Restoring History
import GapCursor from '@tiptap/extension-gapcursor';

import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { useStore } from '../../store/useStore';
import { useEffect, useState, useMemo } from 'react';
import { Commands } from './extensions/Commands';
import { suggestion } from './extensions/suggestion';
import { dbService } from '../../lib/database.ts';

import { ConfirmDeleteModal } from '../modals/ConfirmDeleteModal';


import { createLowlight } from 'lowlight';
import css from 'highlight.js/lib/languages/css';
import js from 'highlight.js/lib/languages/javascript';
import ts from 'highlight.js/lib/languages/typescript';
import html from 'highlight.js/lib/languages/xml';
import rust from 'highlight.js/lib/languages/rust';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import python from 'highlight.js/lib/languages/python';
import { CodeBlock } from './extensions/CodeBlock';
import { Iframe } from './extensions/Iframe';
import { SubpageItem } from './extensions/SubpageItem';
import { ResizableImage } from './extensions/ResizableImage';
import { IconPicker, renderIcon } from '../ui/IconPicker';
import { Share, FileText } from 'lucide-react';
import { exportPageAsJson, saveExportToFile, saveMarkdownToFile } from '../../lib/page-export';
import { TableBlock } from './extensions/TableBlock';
import { ToggleBlock } from './extensions/ToggleBlock';
import { assetManager } from '../../lib/AssetManager';

const lowlight = createLowlight({});
lowlight.register('rust', rust);
lowlight.register('css', css);
lowlight.register('javascript', js);
lowlight.register('typescript', ts);
lowlight.register('xml', html);
lowlight.register('c', c);
lowlight.register('cpp', cpp);
lowlight.register('python', python);

const EscapeNodeConfig = Extension.create({
    name: 'escapeNodeConfig',
    addKeyboardShortcuts() {
        return {
            ArrowDown: ({ editor }) => {
                const { state } = editor;
                const { selection, doc } = state;

                if (!selection.empty) return false;

                const { $head } = selection;
                const isAtEnd = $head.pos >= doc.content.size - 2;

                // Case 1: In a nested block (like blockquote, toggleBlock) at an empty paragraph
                if ($head.parent.type.name === 'paragraph' && $head.parent.textContent === '') {
                    const depth = $head.depth;
                    if (depth > 1) {
                        const parentEndPos = $head.end(depth - 1);

                        // Are we at the very last empty paragraph of this block?
                        if ($head.pos >= parentEndPos - 1) {
                            const blockAfterPos = $head.after(depth - 1);
                            const tr = state.tr;

                            // Delete the empty paragraph inside the block
                            tr.delete($head.before(), $head.after());

                            const mappedBlockAfterPos = tr.mapping.map(blockAfterPos);
                            const nodeAfter = tr.doc.nodeAt(mappedBlockAfterPos);

                            if (nodeAfter) {
                                // Just move cursor to the existing node below
                                const newPos = tr.doc.resolve(mappedBlockAfterPos + 1); // +1 gets inside the node
                                tr.setSelection((state.selection.constructor as any).near(newPos));
                            } else {
                                // At doc end, create a new paragraph below
                                const newPara = state.schema.nodes.paragraph.create();
                                tr.insert(mappedBlockAfterPos, newPara);
                                const newPos = tr.doc.resolve(mappedBlockAfterPos + 1);
                                tr.setSelection((state.selection.constructor as any).near(newPos));
                            }

                            editor.view.dispatch(tr);
                            return true;
                        }
                    }
                }

                // Case 2: At document end escape (for raw blocks without paragraphs like iframes)
                if (isAtEnd) {
                    if ($head.parent.type.name !== 'paragraph') {
                        return editor.commands.command(({ tr, dispatch }) => {
                            if (dispatch) {
                                const newPara = state.schema.nodes.paragraph.create();
                                tr.insert(doc.content.size, newPara);
                                tr.setSelection((state.selection.constructor as any).near(tr.doc.resolve(doc.content.size - 1)));
                            }
                            return true;
                        });
                    }
                }

                return false;
            },
            'Mod-a': ({ editor }) => {
                const { state } = editor;
                const { selection, doc } = state;
                const { $from } = selection;

                if (selection instanceof AllSelection) return false;

                for (let depth = $from.depth; depth >= 1; depth--) {
                    const node = $from.node(depth);
                    const nodeType = node.type.name;

                    const isStructural = [
                        'paragraph', 'heading', 'codeBlock', 'blockquote',
                        'listItem', 'taskItem', 'tableCell', 'tableHeader',
                        'toggleBlock', 'tableBlock', 'bulletList', 'orderedList',
                        'taskList', 'table'
                    ].includes(nodeType);

                    if (!isStructural) continue;

                    const startOfBlock = $from.start(depth);
                    const endOfBlock = $from.end(depth);

                    const alreadySelected =
                        selection.from === startOfBlock &&
                        selection.to === endOfBlock;

                    if (alreadySelected) continue;

                    const tr = state.tr.setSelection(
                        TextSelection.create(doc, startOfBlock, endOfBlock)
                    );
                    editor.view.dispatch(tr);
                    return true;
                }

                const tr = state.tr.setSelection(new AllSelection(doc));
                editor.view.dispatch(tr);
                return true;
            },
            ArrowUp: ({ editor }) => {
                const { state } = editor;
                const { selection, doc } = state;

                if (!selection.empty) return false;

                const { $head } = selection;
                const isAtStart = $head.pos <= 2;

                if (!isAtStart) return false;

                const firstChild = doc.firstChild;
                if (!firstChild) return false;

                const isTrapped = firstChild.type.name !== 'paragraph';

                if (isTrapped) {
                    const tr = state.tr;
                    const newPara = state.schema.nodes.paragraph.create();
                    tr.insert(0, newPara);
                    tr.setSelection(TextSelection.create(tr.doc, 1));
                    editor.view.dispatch(tr);
                    return true;
                }

                return false;
            },
            Tab: ({ editor }) => {
                if (
                    editor.isActive('table') ||
                    editor.isActive('listItem') ||
                    editor.isActive('taskItem') ||
                    editor.isActive('codeBlock')
                ) {
                    return false;
                }

                editor.commands.insertContent('    ');
                return true;
            }
        };
    }
});

export function Editor() {
    // Performance: Granular selectors
    const activePageId = useStore(state => state.activePageId);
    const pages = useStore(state => state.pages);
    const updatePageContent = useStore(state => state.updatePageContent);
    const updatePageTitle = useStore(state => state.updatePageTitle);
    const updatePageIcon = useStore(state => state.updatePageIcon);
    const setActivePage = useStore(state => state.setActivePage);
    const setWordCount = useStore(state => state.setWordCount);
    const [title, setTitle] = useState('');
    const [isContentLoading, setIsContentLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportSuccess, setExportSuccess] = useState<string | null>(null);

    const showExportSuccess = (msg: string) => {
        setExportSuccess(msg);
        setTimeout(() => setExportSuccess(null), 3000);
    };

    const handleExport = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!activePageId) return;
        setIsExporting(true);
        try {
            const manifest = await exportPageAsJson(activePageId);
            const path = await saveExportToFile(manifest);
            if (path) showExportSuccess('Notnip Exported');
        } catch (e) {
            console.error("Export Failed:", e);
        } finally {
            setIsExporting(false);
        }
    };

    const handleMarkdownExport = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!activePageId) return;
        setIsExporting(true);
        try {
            const resultPath = await saveMarkdownToFile(activePageId);
            if (resultPath) showExportSuccess('MD Folder Exported');
        } catch (e) {
            console.error("Markdown Export Failed:", e);
        } finally {
            setIsExporting(false);
        }
    };



    // Metadata from store (title, icon, etc)
    const activePageMeta = pages.find(p => p.id === activePageId);

    const breadcrumbs = useMemo(() => {
        if (!activePageId) return [];
        const crumbs: { id: string; title: string; icon?: string }[] = [];
        let current = pages.find(p => p.id === activePageId);
        while (current) {
            crumbs.unshift({ id: current.id, title: current.title || 'Untitled', icon: current.icon });
            current = current.parent_id ? pages.find(p => p.id === current!.parent_id) : undefined;
        }
        return crumbs;
    }, [activePageId, pages]);

    const editor = useEditor({
        extensions: [
            // Base Extensions
            Document,
            Paragraph,
            Text,
            Heading.extend({
                addAttributes() {
                    return {
                        ...this.parent?.(),
                        color: {
                            default: null,
                            parseHTML: element => element.getAttribute('data-color'),
                            renderHTML: attributes => {
                                if (!attributes.color) return {}
                                return { 'data-color': attributes.color }
                            },
                        },
                    }
                }
            }).configure({ levels: [1, 2, 3] }),
            Bold,
            Italic,
            Strike,
            BulletList.extend({
                addAttributes() {
                    return {
                        ...this.parent?.(),
                        listType: {
                            default: 'disc',
                            parseHTML: (element: HTMLElement) => element.getAttribute('data-list-type') || 'disc',
                            renderHTML: (attributes: any) => {
                                if (!attributes.listType || attributes.listType === 'disc') return {};
                                return { 'data-list-type': attributes.listType };
                            },
                        },
                    };
                },
            }),
            OrderedList.extend({
                addAttributes() {
                    return {
                        ...this.parent?.(),
                        listType: {
                            default: 'decimal',
                            parseHTML: (element: HTMLElement) => element.getAttribute('data-list-type') || 'decimal',
                            renderHTML: (attributes: any) => {
                                if (!attributes.listType || attributes.listType === 'decimal') return {};
                                return { 'data-list-type': attributes.listType };
                            },
                        },
                    };
                },
            }),
            ListItem,
            Blockquote.extend({
                addAttributes() {
                    return {
                        ...this.parent?.(),
                        hasAuthor: {
                            default: false,
                            parseHTML: element => element.hasAttribute('data-has-author'),
                            renderHTML: attributes => {
                                if (!attributes.hasAuthor) return {}
                                return { 'data-has-author': 'true' }
                            },
                        },
                    }
                }
            }),
            HardBreak,
            HorizontalRule.extend({
                addAttributes() {
                    return {
                        ...this.parent?.(),
                        bold: {
                            default: false,
                            parseHTML: element => element.hasAttribute('data-bold'),
                            renderHTML: attributes => {
                                if (!attributes.bold) return {}
                                return { 'data-bold': 'true' }
                            },
                        },
                        accent: {
                            default: false,
                            parseHTML: element => element.hasAttribute('data-accent'),
                            renderHTML: attributes => {
                                if (!attributes.accent) return {}
                                return { 'data-accent': 'true' }
                            },
                        },
                    }
                }
            }),
            History, // Managed by Tiptap now
            GapCursor,

            // Other Extensions
            ToggleBlock,
            Placeholder.configure({
                placeholder: "Type '/' for commands...",
                includeChildren: true
            }),
            TaskList,
            TaskItem.configure({ nested: false }),
            EscapeNodeConfig,
            Commands.configure({ suggestion }),
            CodeBlock.extend({
                addAttributes() {
                    return {
                        ...this.parent?.(),
                        lineNumbers: {
                            default: false,
                            parseHTML: element => element.hasAttribute('data-line-numbers'),
                            renderHTML: attributes => {
                                if (!attributes.lineNumbers) return {}
                                return { 'data-line-numbers': 'true' }
                            },
                        },
                        wordWrap: {
                            default: false,
                            parseHTML: element => element.hasAttribute('data-word-wrap'),
                            renderHTML: attributes => {
                                if (!attributes.wordWrap) return {}
                                return { 'data-word-wrap': 'true' }
                            },
                        },
                    }
                }
            }).configure({ lowlight }),
            ResizableImage.extend({
                addAttributes() {
                    return {
                        ...this.parent?.(),
                        fullWidth: {
                            default: false,
                            parseHTML: element => element.hasAttribute('data-full-width'),
                            renderHTML: attributes => {
                                if (!attributes.fullWidth) return {}
                                return { 'data-full-width': 'true' }
                            },
                        },
                        hasCaption: {
                            default: false,
                            parseHTML: element => element.hasAttribute('data-has-caption'),
                            renderHTML: attributes => {
                                if (!attributes.hasCaption) return {}
                                return { 'data-has-caption': 'true' }
                            },
                        },
                    }
                }
            }).configure({ inline: false, allowBase64: true }),
            Iframe,
            SubpageItem,

            // Table Extensions
            TableBlock,
            Table.extend({
                addAttributes() {
                    return {
                        ...this.parent?.(),
                        striped: {
                            default: true,
                            parseHTML: element => element.getAttribute('data-striped') !== 'false',
                            renderHTML: attributes => {
                                if (!attributes.striped) return { 'data-striped': 'false' }
                                return { 'data-striped': 'true' }
                            },
                        },
                        borderless: {
                            default: false,
                            parseHTML: element => element.hasAttribute('data-borderless'),
                            renderHTML: attributes => {
                                if (!attributes.borderless) return {}
                                return { 'data-borderless': 'true' }
                            },
                        },
                        compact: {
                            default: false,
                            parseHTML: element => element.hasAttribute('data-compact'),
                            renderHTML: attributes => {
                                if (!attributes.compact) return {}
                                return { 'data-compact': 'true' }
                            },
                        },
                    }
                }
            }).configure({ resizable: true }),
            TableRow,
            TableCell,
            TableHeader,
        ],
        editorProps: {
            attributes: {
                class: 'prose mx-auto focus:outline-none max-w-3xl pb-32 min-h-screen',
            },
            scrollThreshold: { top: 120, bottom: 120, left: 0, right: 0 },
            scrollMargin: { top: 120, bottom: 120, left: 0, right: 0 },
            handlePaste: (view, event) => {
                const files = event.clipboardData?.files;
                if (!files || files.length === 0) return false;

                const file = files[0];
                const isImage = file.type.startsWith('image/');
                const isPDF = file.type === 'application/pdf';

                if (isImage || isPDF) {
                    event.preventDefault();

                    const processFile = async () => {
                        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
                        const { schema } = view.state;

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
                                    filters: [{ name: isPDF ? 'PDF' : 'Resim', extensions: isPDF ? ['pdf'] : ['png', 'jpg', 'jpeg', 'webp', 'gif'] }]
                                });

                                if (selectedPath) {
                                    const src = `local-link:${selectedPath}`;
                                    const node = isImage
                                        ? schema.nodes.resizableImage.create({ src, alt: file.name })
                                        : schema.nodes.iframe.create({ src, title: file.name });

                                    view.dispatch(view.state.tr.replaceSelectionWith(node));
                                }
                            }
                            return;
                        }

                        // Normal Upload for < 5MB
                        const metadata = await assetManager.uploadFile(file);
                        if (!metadata) return;

                        const node = isImage
                            ? schema.nodes.resizableImage.create({ src: metadata.path, alt: metadata.filename })
                            : schema.nodes.iframe.create({ src: metadata.path, title: metadata.filename });

                        view.dispatch(view.state.tr.replaceSelectionWith(node));
                    };

                    processFile();
                    return true;
                }

                return false;
            },
            handleDrop: (view, event, _slice, moved) => {
                if (!moved && event.dataTransfer?.files?.length) {
                    const file = event.dataTransfer.files[0];
                    const isImage = file.type.startsWith('image/');
                    const isPDF = file.type === 'application/pdf';

                    if (isImage || isPDF) {
                        event.preventDefault();
                        const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
                        if (!coords) return false;

                        const processFile = async () => {
                            const MAX_SIZE = 5 * 1024 * 1024; // 5MB
                            const { schema } = view.state;

                            if (file.size > MAX_SIZE) {
                                const { confirm, open } = await import('@tauri-apps/plugin-dialog');
                                const wantLocal = await confirm(
                                    `Bu dosya (${(file.size / 1024 / 1024).toFixed(1)} MB) Notnip'in 5MB sınırını aşıyor. Büyük dosyaları sistem hafızasında saklamak performansı düşürebilir.\n\nBunu sisteme kopyalamak yerine sadece bilgisayarındaki "Lokal Yoluna Link Vermek" ister misin? (Önerilen)`,
                                    { title: 'Dosya Çok Büyük (5MB Sınırı)', kind: 'warning' }
                                );

                                if (wantLocal) {
                                    const selectedPath = await open({
                                        title: 'Please select the file from your computer',
                                        multiple: false,
                                        filters: [{ name: isPDF ? 'PDF' : 'Resim', extensions: isPDF ? ['pdf'] : ['png', 'jpg', 'jpeg', 'webp', 'gif'] }]
                                    });

                                    if (selectedPath) {
                                        const src = `local-link:${selectedPath}`;
                                        const node = isImage
                                            ? schema.nodes.resizableImage.create({ src, alt: file.name })
                                            : schema.nodes.iframe.create({ src, title: file.name });

                                        view.dispatch(view.state.tr.insert(coords.pos, node));
                                    }
                                }
                                return;
                            }

                            // Normal Upload for < 5MB
                            const metadata = await assetManager.uploadFile(file);
                            if (!metadata) return;

                            const node = isImage
                                ? schema.nodes.resizableImage.create({ src: metadata.path, alt: metadata.filename })
                                : schema.nodes.iframe.create({ src: metadata.path, title: metadata.filename });

                            view.dispatch(view.state.tr.insert(coords.pos, node));
                        };

                        processFile();
                        return true;
                    }
                }
                return false;
            },
        },
        onUpdate: ({ editor }) => {
            if (activePageId) {
                const json = editor.getJSON();
                updatePageContent(activePageId, json);
            }

            const text = editor.getText();
            const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
            setWordCount(words);
        }
    }, [activePageId]); // Depend on ID to re-init if needed

    // Fetch Content Effect
    useEffect(() => {
        let isMounted = true;

        async function loadContent() {
            if (!activePageId || !editor) return;

            setIsContentLoading(true);
            try {
                // Fetch only JSON content
                const noteContent = await dbService.getNoteContent(activePageId);

                if (isMounted) {
                    // Update content
                    editor.commands.setContent(noteContent?.content || {});

                    // Maintain focus
                    if (!editor.isFocused) {
                        editor.commands.focus('start');
                    }
                }
            } catch (error) {
                // Silent error in production
            } finally {
                if (isMounted) setIsContentLoading(false);
            }
        }

        loadContent();

        return () => { isMounted = false; };
    }, [activePageId, editor]);

    // Sync Title Local State
    useEffect(() => {
        if (activePageMeta) {
            setTitle(activePageMeta.title);
        }
    }, [activePageMeta?.title, activePageId]);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setTitle(newTitle);
        if (activePageId) updatePageTitle(activePageId, newTitle);
    };

    if (!activePageId) {
        return (
            <div className="flex items-center justify-center h-full text-muted">
                Select or create a page to start writing...
            </div>
        );
    }

    // Non-blocking loader via status bar (implementation below) or standard view with overlay

    return (
        <div className="flex flex-col h-full w-full bg-background relative overflow-hidden transition-colors duration-300">

            {breadcrumbs.length > 1 && (
                <div className="flex items-center gap-0 px-6 sm:px-8 py-1.5 bg-secondary/50 border-b border-border select-none flex-shrink-0 overflow-x-auto custom-scrollbar" style={{ scrollbarWidth: 'none' }}>
                    {breadcrumbs.map((crumb, idx) => {
                        const isLast = idx === breadcrumbs.length - 1;
                        return (
                            <div key={crumb.id} className="flex items-center gap-0 min-w-0">
                                <button
                                    onClick={() => { if (!isLast) setActivePage(crumb.id); }}
                                    className={`flex items-center gap-1.5 px-2 py-0.5 font-mono text-[11px] tracking-wide transition-colors whitespace-nowrap ${isLast
                                        ? 'text-accent font-bold'
                                        : 'text-muted hover:text-main hover:bg-accent/10 cursor-pointer'
                                        }`}
                                >
                                    <span className="flex-shrink-0 opacity-70">{renderIcon(crumb.icon || 'text', 12)}</span>
                                    <span className="truncate max-w-[120px]">{crumb.title}</span>
                                </button>
                                {!isLast && (
                                    <span className="text-muted/40 text-[10px] mx-0.5 font-mono select-none">/</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <div
                className="flex-1 overflow-y-auto bg-background cursor-text custom-scrollbar focus-visible:outline-none transition-colors duration-300"
                style={{ overflowAnchor: 'none' }}
                onClick={() => editor?.chain().focus().run()}
            >
                <div className="max-w-3xl mx-auto w-full pt-8 px-6 sm:px-8 relative">
                    <div className="flex items-center mb-4 group gap-2" onClick={(e) => e.stopPropagation()}>
                        {activePageMeta && (
                            <IconPicker
                                currentIcon={activePageMeta.icon || 'file'}
                                onSelect={(ic) => updatePageIcon(activePageId, ic)}
                                size={28}
                                className="p-1 -ml-1 flex-shrink-0 text-muted hover:text-accent hover:bg-accent/10"
                                popupSide="right"
                            />
                        )}
                        <div className="relative flex-1">
                            <input
                                value={title}
                                onChange={handleTitleChange}
                                className="w-full bg-transparent text-4xl font-bold outline-none border-none placeholder-transparent z-10 relative"
                                style={{ color: 'var(--editor-title-color, var(--accent))' }}
                                placeholder="Untitled Page"
                                id="note-title"
                            />
                            {title === '' && (
                                <label
                                    htmlFor="note-title"
                                    className="absolute left-0 top-0 text-4xl font-bold text-muted/30 pointer-events-none"
                                >
                                    Untitled Note
                                </label>
                            )}
                        </div>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-0.5 ml-2 flex-shrink-0">
                            <button
                                onClick={handleMarkdownExport}
                                className="p-2 text-muted hover:text-accent hover:bg-accent/10 rounded-sm transition-colors"
                                title="Export to Markdown (.md)"
                            >
                                <FileText size={20} className={isExporting ? 'animate-pulse' : ''} />
                            </button>
                            <button
                                onClick={handleExport}
                                className="p-2 text-muted hover:text-accent hover:bg-accent/10 rounded-sm transition-colors"
                                title="Export Backup (.notnip)"
                            >
                                <Share size={20} className={isExporting ? 'animate-pulse' : ''} />
                            </button>
                        </div>
                    </div>

                    {/* Editor Content */}
                    <EditorContent editor={editor} />
                </div>
            </div>

            {/* Status Bar / Loading Indicator - Bottom Right */}
            <div className="absolute bottom-4 right-6 flex items-center gap-3 pointer-events-none z-20">
                {exportSuccess ? (
                    <div className="flex items-center gap-2 bg-accent/20 px-3 py-1.5 rounded-full border border-accent shadow-retro-sm backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <span className="text-xs font-mono font-bold text-accent tracking-wider uppercase">{exportSuccess}</span>
                    </div>
                ) : null}

                {isContentLoading ? (
                    <div className="flex items-center gap-2 bg-secondary/80 px-3 py-1.5 rounded-full border border-border shadow-retro-sm backdrop-blur-sm animate-in fade-in">
                        <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-mono text-muted">SYNCING...</span>
                    </div>
                ) : null}
            </div>

            <GlobalDeleteHandler />
        </div>
    );
}

function GlobalDeleteHandler() {
    const deletionCandidateId = useStore(state => state.deletionCandidateId);
    const setDeletionCandidateId = useStore(state => state.setDeletionCandidateId);
    const removePage = useStore(state => state.removePage);
    const pages = useStore(state => state.pages);

    if (!deletionCandidateId) return null;

    const page = pages.find(p => p.id === deletionCandidateId);
    if (!page) {
        setDeletionCandidateId(null);
        return null;
    }

    const countDescendants = (pid: string): number => {
        const children = pages.filter(p => p.parent_id === pid);
        return children.reduce((acc, c) => acc + 1 + countDescendants(c.id), 0);
    };
    const count = countDescendants(page.id);

    return (
        <div className="fixed inset-0 z-[100] pointer-events-auto">
            <ConfirmDeleteModal
                isOpen={true}
                title="DELETE PAGE"
                message={`Delete "${page.title}"${count > 0 ? ` and ${count} sub-pages` : ''}? This block will be removed from the editor.`}
                onConfirm={() => {
                    removePage(page.id);
                    setDeletionCandidateId(null);
                }}
                onCancel={() => setDeletionCandidateId(null)}
            />
        </div>
    );
}
