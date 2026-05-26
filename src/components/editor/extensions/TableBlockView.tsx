import { NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react';
import { Grid3X3, Minus, Maximize2, Trash2, Plus, GripHorizontal } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useRef } from 'react';

export function TableBlockView(props: NodeViewProps) {
    const { node, updateAttributes, deleteNode, editor } = props;
    const isMinimized = node.attrs.isMinimized ?? false;
    const headerColor = node.attrs.headerColor || '';
    const containerRef = useRef<HTMLDivElement>(null);

    const toggleMinimize = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        updateAttributes({ isMinimized: !isMinimized });
    };

    // Table operations (dispatch natively to Tiptap)
    const withLastCellFocus = (commandName: 'addRowAfter' | 'addColumnAfter' | 'deleteRow' | 'deleteColumn') => {
        const posWrapper = typeof props.getPos === 'function' ? props.getPos() : -1;
        const pos = posWrapper ?? -1;
        if (pos === -1) return;

        const tablePos = pos + 1;
        const tableNode = node.firstChild;
        if (!tableNode || tableNode.type.name !== 'table') return;

        // Prevent deleting last row/col
        if (commandName === 'deleteRow' && tableNode.childCount <= 1) return;
        if (commandName === 'deleteColumn' && tableNode.firstChild && tableNode.firstChild.childCount <= 1) return;

        let lastCellPos = -1;
        editor.state.doc.nodesBetween(tablePos, tablePos + tableNode.nodeSize, (n, p) => {
            if (n.type.name === 'tableCell' || n.type.name === 'tableHeader') {
                lastCellPos = p;
            }
        });

        if (lastCellPos !== -1) {
            editor.chain().focus(lastCellPos + 2)[commandName]().run();
        }
    };

    return (
        <NodeViewWrapper
            className="my-2 relative flex flex-col border-2 border-border shadow-retro group bg-element transition-all duration-300"
            ref={containerRef}
            data-drag-handle
        >
            {/* Dock Header */}
            <div
                className="flex items-center justify-between bg-secondary border-b-2 border-border px-2 py-1 select-none transition-colors"
                contentEditable={false}
            >
                <div className="flex items-center gap-2">
                    <div className="text-muted hover:text-main cursor-grab active:cursor-grabbing p-0.5 transition-colors" data-drag-handle>
                        <GripHorizontal size={14} />
                    </div>
                    <Grid3X3 className="text-accent" size={14} />
                    <input
                        value={node.attrs.title || ''}
                        onChange={(e) => updateAttributes({ title: e.target.value })}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        className="font-mono font-bold text-xs uppercase tracking-wider text-main bg-transparent border-none outline-none focus:text-accent focus:ring-1 focus:ring-accent/50 px-1 rounded transition-colors w-32"
                        placeholder="TABLE NAME"
                    />
                </div>

                {/* Controls - always visible but subtle, fully opaque on hover/focus */}
                <div className="flex items-center gap-1 opacity-50 hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    {!isMinimized && (
                        <>
                            <ToolbarButton icon={<Plus size={12} />} label="Row" onClick={() => withLastCellFocus('addRowAfter')} color="text-muted hover:text-main" title="Add Row to Bottom" />
                            <ToolbarButton icon={<Plus size={12} />} label="Col" onClick={() => withLastCellFocus('addColumnAfter')} color="text-muted hover:text-main" title="Add Column to Right" />
                            <div className="w-px h-3 bg-border mx-1" />
                            <ToolbarButton icon={<Trash2 size={12} />} label="Row" onClick={() => withLastCellFocus('deleteRow')} color="text-muted hover:text-main" title="Delete Bottom Row" />
                            <ToolbarButton icon={<Trash2 size={12} />} label="Col" onClick={() => withLastCellFocus('deleteColumn')} color="text-muted hover:text-main" title="Delete Right Column" />
                            <div className="w-px h-3 bg-border mx-1" />
                        </>
                    )}
                    <button
                        onClick={toggleMinimize}
                        className="w-5 h-5 flex items-center justify-center bg-element hover:bg-background text-muted hover:text-main transition-colors border border-border hover:border-accent shadow-retro-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]"
                    >
                        {isMinimized ? <Maximize2 size={12} /> : <Minus size={12} />}
                    </button>
                    <button
                        onClick={deleteNode}
                        className="w-5 h-5 flex items-center justify-center bg-element hover:bg-accent-red text-muted hover:text-white transition-colors border border-border hover:border-accent-red ml-1 shadow-retro-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>

            {/* Content Container with Grid animation */}
            <div className={cn("overflow-hidden transition-all duration-300 grid", isMinimized ? "grid-rows-[0fr]" : "grid-rows-[1fr]")}>
                {/* The inner div is the scroll container. NodeViewContent renders TipTap's table natively inside it */}
                <div
                    className="min-h-0 bg-background overflow-x-auto custom-scrollbar table-block-content relative"
                    data-header-color={headerColor || undefined}
                >
                    <NodeViewContent />
                </div>
            </div>
        </NodeViewWrapper>
    );
}

function ToolbarButton({ icon, label, onClick, color, title }: any) {
    return (
        <button
            type="button"
            title={title}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
            className={cn("h-5 flex items-center justify-center gap-1 px-1.5 bg-element border border-transparent hover:border-accent hover:bg-background transition-colors text-muted hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] shadow-retro-sm", color)}
        >
            {icon}
            <span className="text-[9px] font-mono font-bold uppercase tracking-wide">{label}</span>
        </button>
    );
}
