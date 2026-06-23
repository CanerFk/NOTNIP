import { NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '../../../lib/utils';

export function ToggleBlockView(props: NodeViewProps) {
    const { node, updateAttributes } = props;
    const isCollapsed = node.attrs.collapsed;
    const title = node.attrs.title;
    const headerStyle = node.attrs.headerStyle;
    const headerColor = node.attrs.headerColor;
    const isTabbed = node.attrs.tabbed !== false;

    const toggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        updateAttributes({ collapsed: !isCollapsed });
    };

    let titleSizeClass = 'text-[1.125rem]';
    let iconSize = 18;
    let titlePlaceholder = 'Toggle Header';
    let colorVar = 'var(--heading-color)';
    let titleMargin = 'py-0.5';

    if (headerStyle === 'small') {
        titleSizeClass = 'text-[0.85rem]';
        iconSize = 14;
        titlePlaceholder = 'Toggle';
    } else if (headerStyle === 'h1') {
        titleSizeClass = 'text-3xl mt-4 mb-2';
        iconSize = 24;
    } else if (headerStyle === 'h2') {
        titleSizeClass = 'text-2xl mt-2 mb-1';
        iconSize = 20;
        colorVar = 'var(--gruv-green)';
    }

    if (headerColor) {
        colorVar = `var(--gruv-${headerColor})`;
    }

    return (
        <NodeViewWrapper
            className={cn("toggle-block group flex flex-col my-1 relative transition-all", isCollapsed && "is-collapsed")}
            data-collapsed={isCollapsed ? 'true' : 'false'}
        >
            <div className="flex items-start gap-1">
                <div
                    className="w-6 h-6 flex items-center justify-center cursor-pointer text-muted hover:text-accent transition-colors select-none mt-1"
                    contentEditable={false}
                    onClick={toggle}
                >
                    <div className="p-0.5 rounded hover:bg-element">
                        {isCollapsed
                            ? <ChevronRight size={iconSize} strokeWidth={2.5} />
                            : <ChevronDown size={iconSize} strokeWidth={2.5} />}
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <input
                        value={title || ''}
                        onChange={(e) => updateAttributes({ title: e.target.value })}
                        onClick={(e) => { e.stopPropagation(); }}
                        className={cn(
                            "w-full bg-transparent border-none focus:outline-none focus:ring-0 caret-accent selection:bg-accent/30 selection:text-main font-bold placeholder:text-muted/50",
                            titleSizeClass,
                            titleMargin
                        )}
                        placeholder={titlePlaceholder}
                        style={{ color: colorVar, lineHeight: 1.4 }}
                    />
                </div>
            </div>

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
