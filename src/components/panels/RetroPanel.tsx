import { GripHorizontal, X } from 'lucide-react';
import { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface RetroPanelProps {
    id: string;
    title: string;
    children: React.ReactNode;
    initialPosition: { x: number; y: number };
    onClose: () => void;
    onPositionChange?: (position: { x: number; y: number }) => void;
    width?: number;
    height?: number;
}

export function RetroPanel({
    id: _id,
    title,
    children,
    initialPosition,
    onClose,
    onPositionChange,
    width = 320,
    height = 240,
}: RetroPanelProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState(initialPosition);
    const [isDragging, setIsDragging] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (panelRef.current) {
            const rect = panelRef.current.getBoundingClientRect();
            dragOffset.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
            setIsDragging(true);
        }
    }, []);

    const handleClose = () => {
        setIsClosing(true);
        // Wait for animation to complete before actually closing
        setTimeout(() => {
            onClose();
        }, 200); // Match animation duration
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const newPos = {
                    x: e.clientX - dragOffset.current.x,
                    y: e.clientY - dragOffset.current.y,
                };
                setPosition(newPos);
            }
        };

        const handleMouseUp = () => {
            if (isDragging) {
                setIsDragging(false);
                onPositionChange?.(position);
            }
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, onPositionChange, position]);

    return (
        <div
            ref={panelRef}
            className={cn(
                "fixed z-[100] bg-background border-2 border-border",
                "shadow-retro select-none",
                isClosing ? "animate-retro-shutter-close" : "animate-retro-shutter",
                isDragging && "cursor-grabbing opacity-90"
            )}
            style={{
                left: position.x,
                top: position.y,
                width,
                height,
            }}
        >
            {/* Titlebar */}
            <div
                className="h-7 bg-element flex items-center justify-between px-2 cursor-grab border-b border-border"
                onMouseDown={handleMouseDown}
            >
                <div className="flex items-center gap-2">
                    <GripHorizontal size={12} className="text-muted" />
                    <span className="text-xs font-mono font-bold text-main uppercase tracking-wider">
                        {title}
                    </span>
                </div>
                <button
                    onClick={handleClose}
                    className="w-5 h-5 flex items-center justify-center border-l border-border bg-element hover:bg-red-500 hover:border-red-500 hover:text-white transition-all group"
                    title="Close Panel"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Content */}
            <div
                className="overflow-auto custom-scrollbar"
                style={{ height: height - 28 }}
            >
                {children}
            </div>
        </div>
    );
}
