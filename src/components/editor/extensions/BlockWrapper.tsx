import { NodeViewWrapper } from '@tiptap/react';
import React, { useCallback, useState, useRef, useEffect, memo } from 'react';
import { GripHorizontal, X, AlignLeft, AlignCenter, AlignRight, Minus, Maximize2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface BlockWrapperProps {
    node: any;
    updateAttributes: (attrs: any) => void;
    deleteNode: () => void;
    title?: string;
    icon?: React.ReactNode;
    children: React.ReactNode | ((isMinimized: boolean) => React.ReactNode);
    className?: string;
    showAlign?: boolean; // New prop to toggle alignment controls
}

export const BlockWrapper = memo(function BlockWrapper({
    node,
    updateAttributes,
    deleteNode,
    title,
    icon,
    children,
    className,
    showAlign = true // Default to true
}: BlockWrapperProps) {
    // Attributes from node
    const { width, align, isMinimized } = node.attrs;

    // Internal State for width override during animation
    const [w, setW] = useState(width || '100%');
    const [isResizing, setIsResizing] = useState(false);

    // Refs for resize logic
    const wrapperRef = useRef<HTMLDivElement>(null);
    const startXRef = useRef(0);
    const startWRef = useRef(0);

    // Sync width state with props if they change externally
    useEffect(() => {
        if (width) setW(width);
    }, [width]);



    // --- RESIZE HANDLERS ---
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent editor selection
        setIsResizing(true);
        startXRef.current = e.clientX;
        const currentWidth = wrapperRef.current?.offsetWidth || 0;
        startWRef.current = currentWidth;

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        const dx = e.clientX - startXRef.current;
        const newW = Math.max(200, startWRef.current + dx); // Min width 200px
        setW(`${newW}px`);
    }, []);

    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        if (wrapperRef.current) {
            updateAttributes({ width: `${wrapperRef.current.offsetWidth}px` });
        }
    }, [updateAttributes, handleMouseMove]);

    // --- TOGGLES ---
    const toggleMinimize = () => updateAttributes({ isMinimized: !isMinimized });
    const setAlign = (a: 'left' | 'center' | 'right') => updateAttributes({ align: a });

    const alignClass = {
        left: 'mr-auto',
        center: 'mx-auto',
        right: 'ml-auto'
    }[align as string] || 'mx-auto';

    return (
        <NodeViewWrapper
            className={cn(
                "relative transition-all duration-300 ease-in-out",
                alignClass,
                isMinimized ? "inline-block align-middle" : "block", // Layout behavior switch
                className
            )}
            style={{
                // Enforce strictly 260px width when minimized
                width: isMinimized ? '260px' : w,
                minWidth: isMinimized ? '260px' : 'auto',
                maxWidth: isMinimized ? '260px' : '100%',

                // Transition margins manually to prevent instant jumps
                marginTop: isMinimized ? '0.25rem' : '0.5rem',
                marginBottom: isMinimized ? '0.25rem' : '0.5rem',
                marginLeft: isMinimized ? '0.25rem' : undefined, // alignClass handles horizontal when open
                marginRight: isMinimized ? '0.25rem' : undefined,

                // Open: Width expands immediately (delay 0ms).
                // Close: Wait for height to collapse (delay 300ms).
                transitionProperty: 'all',
                transitionDelay: isMinimized ? '300ms' : '0ms',
                minHeight: isMinimized ? '32px' : undefined
            }}
        >
            <div
                ref={wrapperRef}
                data-state={isMinimized ? 'closed' : 'open'}
                className={cn(
                    "bg-element border-2 shadow-retro-sm flex flex-col transition-all duration-300 group overflow-hidden",
                    "border-border/50 dark:border-transparent",
                    "hover:border-accent hover:shadow-[3px_3px_0px_0px_var(--accent)]",
                    isResizing && "border-accent ring-2 ring-accent/30",
                    isMinimized ? "rounded-sm" : "rounded-none" // REMOVED h-8 to allow smooth collapse
                )}
            >
                {/* --- HEADER --- */}
                <div
                    className={cn(
                        "h-8 bg-secondary flex items-center justify-between px-2 border-b border-border select-none shrink-0 transition-opacity duration-300",
                        isMinimized && "border-b-0 bg-element"
                    )}
                >
                    {/* Left: Drag / Title */}
                    <div className="flex items-center gap-2 overflow-hidden">
                        {!isMinimized && <GripHorizontal size={14} className="text-muted cursor-grab active:cursor-grabbing hover:text-main" />}
                        {icon && <span className="text-accent">{icon}</span>}
                        <span className="text-xs font-mono font-bold text-main uppercase tracking-wide truncate max-w-[150px]">
                            {title || 'BLOCK'}
                        </span>
                    </div>

                    {/* Right: Controls */}
                    <div className="flex items-center gap-1">
                        {!isMinimized && showAlign && (
                            <div className="flex bg-background rounded p-0.5 gap-0.5 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setAlign('left')} className={cn("p-1 rounded hover:bg-secondary text-muted hover:text-main transition-colors", align === 'left' && "bg-accent text-background")}><AlignLeft size={12} /></button>
                                <button onClick={() => setAlign('center')} className={cn("p-1 rounded hover:bg-secondary text-muted hover:text-main transition-colors", align === 'center' && "bg-accent text-background")}><AlignCenter size={12} /></button>
                                <button onClick={() => setAlign('right')} className={cn("p-1 rounded hover:bg-secondary text-muted hover:text-main transition-colors", align === 'right' && "bg-accent text-background")}><AlignRight size={12} /></button>
                            </div>
                        )}

                        <div className="flex items-center border-l border-border pl-1 gap-1">
                            <button
                                onClick={toggleMinimize}
                                className="w-6 h-6 flex items-center justify-center rounded hover:bg-background text-muted hover:text-main transition-colors"
                            >
                                {isMinimized ? <Maximize2 size={12} /> : <Minus size={12} />}
                            </button>
                            <button
                                onClick={deleteNode}
                                className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent-red text-muted hover:text-white transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- CONTENT (Grid Animation) --- */}
                <div
                    className={cn(
                        "grid transition-all duration-300 ease-in-out bg-element",
                        isMinimized ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
                    )}
                    style={{
                        // PIANO ANIMATION: SEQUENCE LOGIC
                        // Open: Grid expands (300ms) -> Wait -> Width expands
                        // Close: Grid collapses (300ms) -> Wait -> Width shrinks
                        // Actually per prompt:
                        // Open: Width (immediate) -> Height
                        // Close: Height (immediate) -> Width
                        transitionProperty: "grid-template-rows, opacity",
                        transitionDelay: isMinimized ? '0ms' : '300ms'
                    }}
                >
                    <div className="overflow-hidden min-w-0">
                        {/* Wrapper div required for grid animation to work on height */}
                        <div className="p-0">
                            {typeof children === 'function' ? children(isMinimized) : children}
                        </div>

                        {!isMinimized && (
                            <div
                                className={cn(
                                    "absolute bottom-0 right-0 w-4 h-4 bg-secondary cursor-se-resize flex items-center justify-center text-muted opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-accent hover:text-background",
                                    isResizing && "opacity-100 bg-accent text-background"
                                )}
                                onMouseDown={handleMouseDown}
                            >
                                <GripHorizontal size={10} className="-rotate-45" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </NodeViewWrapper>
    );
});
