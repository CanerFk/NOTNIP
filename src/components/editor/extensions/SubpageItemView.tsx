import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { useStore } from '../../../store/useStore';
import { Trash2, ArrowRight } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { IconPicker } from '../../ui/IconPicker';

export function SubpageItemView(props: NodeViewProps) {
    const { id } = props.node.attrs;
    const { pages, setActivePage, updatePageIcon, setDeletionCandidateId } = useStore();
    const page = pages.find(p => p.id === id);

    // Use page icon from store, default to 'file'
    const iconType = page?.icon || 'file';



    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActivePage(id);
    };

    const updateIcon = (icon: string) => {
        if (id) updatePageIcon(id, icon);
        props.updateAttributes({ icon });
    };

    const handleDelete = () => {
        setDeletionCandidateId(id);
    };

    if (!page) {
        return (
            <NodeViewWrapper className="block my-1" data-drag-handle>
                <div className="bg-red-900/20 border border-red-500/50 p-2 text-red-400 font-mono text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Trash2 size={12} />
                        <span>Reference broken (Page not found: {id?.slice(0, 8)})</span>
                    </div>
                    <button
                        onClick={() => props.deleteNode()}
                        className="px-2 py-0.5 bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white transition-colors text-[10px] font-bold uppercase"
                    >
                        Remove
                    </button>
                </div>
            </NodeViewWrapper>
        );
    }

    return (
        <NodeViewWrapper className="block my-3 select-none">
            {/* Gruvbox Card Style */}
            <div
                className={cn(
                    "group relative flex items-center justify-between p-3 rounded-md transition-all duration-200",
                    "bg-element border border-accent/30 hover:border-accent",
                    "shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[3px_3px_0px_0px_var(--accent)]",
                    "cursor-pointer active:translate-y-0.5 active:shadow-none"
                )}
                onClick={handleClick}
            >
                <div className="flex items-center gap-3">
                    <IconPicker
                        currentIcon={iconType}
                        onSelect={updateIcon}
                        size={18}
                        className="bg-secondary p-1.5 hover:bg-accent hover:text-background"
                        popupSide="right"
                    />

                    <div className="flex flex-col min-w-0">
                        <span className="text-main font-mono font-bold text-sm truncate tracking-wide">
                            {page.title || 'Untitled Page'}
                        </span>
                        <span className="text-muted text-[10px] uppercase tracking-widest font-mono">
                            Subpage
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                        className="p-1.5 text-accent-red hover:bg-accent-red/10 rounded transition-colors"
                        title="Delete Page"
                    >
                        <Trash2 size={16} />
                    </button>
                    <ArrowRight size={16} className="text-accent" />
                </div>
            </div>
        </NodeViewWrapper>
    );
}
