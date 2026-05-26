import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { cn } from '../../lib/utils';
import { parseSlashQuery, CommandFlag } from './extensions/Commands';

export const CommandList = forwardRef((props: any, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            props.command(item);
        }
    };

    useEffect(() => setSelectedIndex(0), [props.items]);

    useEffect(() => {
        const row = itemRefs.current[selectedIndex];
        if (row && containerRef.current) {
            const container = containerRef.current;
            const itemTop = row.offsetTop;
            const itemBottom = itemTop + row.clientHeight;
            const scrollTop = container.scrollTop;
            const scrollBottom = scrollTop + container.clientHeight;

            if (itemTop < scrollTop) {
                container.scrollTop = itemTop;
            } else if (itemBottom > scrollBottom) {
                container.scrollTop = itemBottom - container.clientHeight;
            }
        }
    }, [selectedIndex]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === 'ArrowUp') {
                event.preventDefault();
                setSelectedIndex((prev) =>
                    prev <= 0 ? props.items.length - 1 : prev - 1
                );
                return true;
            }

            if (event.key === 'ArrowDown') {
                event.preventDefault();
                setSelectedIndex((prev) =>
                    prev >= props.items.length - 1 ? 0 : prev + 1
                );
                return true;
            }

            if (event.key === 'Tab') {
                event.preventDefault();
                if (event.shiftKey) {
                    setSelectedIndex((prev) =>
                        prev <= 0 ? props.items.length - 1 : prev - 1
                    );
                } else {
                    setSelectedIndex((prev) =>
                        prev >= props.items.length - 1 ? 0 : prev + 1
                    );
                }
                return true;
            }

            if (event.key === '-') {
                const item = props.items[selectedIndex];
                if (item && item.flags?.length > 0 && props.editor && props.range) {
                    const { hasFlags } = parseSlashQuery(props.query || '');
                    if (!hasFlags) {
                        event.preventDefault();
                        const { from, to } = props.range;
                        const newQueryText = item.title.toLowerCase() + ' -';
                        const tr = props.editor.state.tr;
                        tr.insertText(newQueryText, from + 1, to);
                        props.editor.view.dispatch(tr);
                        return true;
                    }
                }
            }

            if (event.key === 'Enter') {
                selectItem(selectedIndex);
                return true;
            }

            return false;
        },
    }));

    const { activeFlags, hasFlags } = parseSlashQuery(props.query || '');
    const currentItem = props.items[selectedIndex];
    const itemFlags: CommandFlag[] = currentItem?.flags || [];
    const showFlags = hasFlags && itemFlags.length > 0;

    const supportsColor = itemFlags.some((f) => f.key === 'c' && f.label === 'Color');
    const isTypingColor = supportsColor && activeFlags.some((f) => f.startsWith('c'));

    const colorHints = [
        { key: 'cr', color: 'var(--gruv-red)', name: 'Red' },
        { key: 'cy', color: 'var(--gruv-yellow)', name: 'Yellow' },
        { key: 'cg', color: 'var(--gruv-green)', name: 'Green' },
        { key: 'cb', color: 'var(--gruv-blue)', name: 'Blue' },
        { key: 'cp', color: 'var(--gruv-purple)', name: 'Purple' },
        { key: 'ca', color: 'var(--gruv-aqua)', name: 'Aqua' },
        { key: 'co', color: 'var(--gruv-orange)', name: 'Orange' },
    ];

    return (
        <div className="relative flex pointer-events-none">
            {/* Main Command Panel */}
            <div
                ref={containerRef}
                className="flex flex-col gap-0.5 p-1 w-72 bg-sidebar border-2 border-border shadow-retro rounded-none overflow-y-auto max-h-80 animate-in fade-in zoom-in-95 duration-100 z-50 custom-scrollbar pointer-events-auto"
            >
                <div className="flex items-center justify-between px-2 py-1 border-b border-border/50 mb-0.5 sticky top-0 bg-sidebar z-10 select-none pointer-events-none">
                    <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Blocks</span>
                    {currentItem && (
                        <span className="font-mono text-[10px] text-accent/60 tracking-wide truncate max-w-[140px]">
                            /{currentItem.title.toLowerCase()}
                            {activeFlags.length > 0 && (
                                <span className="text-accent"> -{activeFlags.join(' -')}</span>
                            )}
                        </span>
                    )}
                </div>

                {props.items.length ? (
                    props.items.map((item: any, index: number) => (
                        <button
                            ref={(el) => { itemRefs.current[index] = el; }}
                            className={cn(
                                "flex items-center gap-2 px-2 py-1.5 text-sm text-left transition-colors font-mono w-full",
                                index === selectedIndex
                                    ? "bg-accent text-white shadow-retro-sm"
                                    : "text-main hover:bg-element"
                            )}
                            key={index}
                            onClick={() => selectItem(index)}
                        >
                            <div className={cn(
                                "p-0.5 rounded-sm border border-transparent flex-shrink-0",
                                index === selectedIndex ? "text-white" : "text-muted"
                            )}>
                                {item.icon}
                            </div>
                            <span className="flex-1 font-medium truncate">{item.title}</span>
                            {index === selectedIndex && item.flags?.length > 0 && !hasFlags && (
                                <span className="text-[9px] opacity-50 whitespace-nowrap">- flags</span>
                            )}
                            {index === selectedIndex && (
                                <span className="text-[9px] opacity-60 uppercase tracking-wider flex-shrink-0">enter</span>
                            )}
                        </button>
                    ))
                ) : (
                    <div className="px-2 py-2 text-sm text-muted font-mono">No result</div>
                )}

                {showFlags && (
                    <div className="border-t-2 border-border/50 mt-0.5 pt-1 px-1">
                        <div className="text-[9px] uppercase font-bold text-muted/50 tracking-widest px-1 mb-1">Flags</div>
                        <div className="flex flex-wrap gap-1 pb-1">
                            {itemFlags.map((flag) => {
                                const isActive = activeFlags.includes(flag.key);
                                return (
                                    <div
                                        key={flag.key}
                                        className={cn(
                                            "flex items-center gap-1 px-1.5 py-0.5 font-mono text-[10px] border transition-colors",
                                            isActive
                                                ? "border-accent bg-accent/20 text-accent font-bold"
                                                : flag.isDefault
                                                    ? "border-border/50 bg-element/50 text-muted"
                                                    : "border-transparent text-muted/70"
                                        )}
                                    >
                                        <span className={cn("font-bold", isActive ? "text-accent" : "text-muted/50")}>
                                            -{flag.key}
                                        </span>
                                        <span>{flag.label}</span>
                                        {flag.isDefault && !isActive && (
                                            <span className="text-[8px] text-muted/40 uppercase">def</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between px-2 py-0.5 border-t border-border/30 mt-0.5 select-none pointer-events-none">
                    <span className="text-[9px] text-muted/40 font-mono">tab navigate</span>
                    <span className="text-[9px] text-muted/40 font-mono">enter select</span>
                </div>
            </div>

            {/* Color Hint Panel Overlay */}
            {isTypingColor && (
                <div className="absolute left-full top-0 ml-2 flex flex-col gap-1 p-2 bg-sidebar border-2 border-border shadow-retro w-[140px] animate-in slide-in-from-left-2 duration-150 pointer-events-auto">
                    <span className="text-[10px] uppercase font-bold text-muted tracking-wider border-b border-border/50 pb-1 mb-1">Color Palette</span>
                    {colorHints.map(c => {
                        const isActive = activeFlags.includes(c.key);
                        return (
                            <div key={c.key} className={cn(
                                "flex items-center gap-2 px-1.5 py-1 transition-colors text-xs font-mono",
                                isActive ? "bg-accent text-white font-bold" : "text-main"
                            )}>
                                <div className="w-3 h-3 flex-shrink-0 border border-border/50 shadow-retro-sm" style={{ backgroundColor: c.color }} />
                                <span className={isActive ? "opacity-100" : "opacity-60"}>-{c.key}</span>
                                <span className="opacity-40 text-[10px] ml-auto">{c.name}</span>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
});

CommandList.displayName = 'CommandList';
