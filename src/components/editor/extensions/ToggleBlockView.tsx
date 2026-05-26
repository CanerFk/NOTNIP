import { NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '../../../lib/utils';

export function ToggleBlockView(props: NodeViewProps) {
    const { node, updateAttributes } = props;
    const isCollapsed = node.attrs.collapsed;
    const title = node.attrs.title;
    const isSmall = node.attrs.size === 'small';
    const isTabbed = node.attrs.tabbed !== false;

    const toggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        updateAttributes({ collapsed: !isCollapsed });
    };

    return (
        <NodeViewWrapper
            className={cn("toggle-block group flex flex-col my-1 relative transition-all", isCollapsed && "is-collapsed")}
            data-collapsed={isCollapsed ? 'true' : 'false'}
        >
            {/* The Header Row */}
            <div className="flex items-start gap-1">
                <div
                    className="w-6 h-6 flex items-center justify-center cursor-pointer text-muted hover:text-accent transition-colors select-none mt-1"
                    contentEditable={false}
                    onClick={toggle}
                >
                    <div className="p-0.5 rounded hover:bg-element">
                        {isCollapsed
                            ? <ChevronRight size={isSmall ? 14 : 18} strokeWidth={2.5} />
                            : <ChevronDown size={isSmall ? 14 : 18} strokeWidth={2.5} />}
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <input
                        value={title || ''}
                        onChange={(e) => updateAttributes({ title: e.target.value })}
                        onClick={(e) => { e.stopPropagation(); }}
                        className={`w-full bg-transparent border-none focus:outline-none focus:ring-0 caret-accent selection:bg-accent/30 selection:text-main font-bold placeholder:text-muted/50 py-0.5 ${isSmall ? 'text-[0.85rem]' : 'text-[1.125rem]'}`}
                        placeholder={isSmall ? 'Toggle' : 'Toggle Header'}
                        style={{ color: 'var(--heading-color)', lineHeight: 1.4 }}
                    />
                </div>
            </div>

            {/* The Content Area - Smoothly Collapsible */}
            <div
                className={cn(
                    "grid transition-all duration-300",
                    isTabbed ? "ml-7" : "ml-0",
                    isCollapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
                )}
            >
                <div className="overflow-hidden">
                    <div className={cn(
                        "min-h-[1.5rem] mt-1 mb-2 transition-colors",
                        isTabbed ? "pl-3 border-l-2 border-border/30 hover:border-border" : "pl-0"
                    )}>
                        <NodeViewContent className="toggle-inner" />
                    </div>
                </div>
            </div>
        </NodeViewWrapper >
    );
}
