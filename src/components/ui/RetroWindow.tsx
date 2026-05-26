import { useState } from 'react';
import { Minus, X, Square } from 'lucide-react';
import { cn } from '../../lib/utils';

interface RetroWindowProps {
    title: string;
    children: React.ReactNode;
    onClose?: () => void;
    className?: string;
    defaultMinimized?: boolean;
}

export function RetroWindow({ title, children, onClose, className, defaultMinimized = false }: RetroWindowProps) {
    const [isMinimized, setIsMinimized] = useState(defaultMinimized);
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        if (onClose) {
            setIsClosing(true);
            setTimeout(() => onClose(), 200);
        }
    };

    return (
        <div
            className={cn(
                "bg-sidebar retro-bevel flex flex-col",
                isMinimized ? "" : "animate-retro-slide-open",
                isClosing && "animate-retro-slide-close",
                className
            )}
            style={{ maxHeight: isMinimized ? '32px' : undefined, overflow: isMinimized ? 'hidden' : undefined }}
        >
            {/* Title Bar - Win95 Style */}
            <div
                className="h-8 flex items-center justify-between px-2 select-none cursor-default"
                style={{
                    background: 'linear-gradient(90deg, #504945 0%, #7daea3 100%)',
                }}
            >
                <span className="text-white text-xs font-bold tracking-wide truncate">
                    {title}
                </span>
                <div className="flex items-center gap-0.5">
                    {/* Minimize Button */}
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="w-5 h-5 retro-bevel bg-element flex items-center justify-center hover:brightness-110 active:retro-bevel-inset"
                    >
                        <Minus size={10} className="text-main" />
                    </button>
                    {/* Maximize Placeholder (non-functional for now) */}
                    <button
                        className="w-5 h-5 retro-bevel bg-element flex items-center justify-center hover:brightness-110 active:retro-bevel-inset"
                        disabled
                    >
                        <Square size={8} className="text-main" />
                    </button>
                    {/* Close Button */}
                    {onClose && (
                        <button
                            onClick={handleClose}
                            className="w-5 h-5 retro-bevel bg-element flex items-center justify-center hover:bg-red-500 hover:text-white active:retro-bevel-inset"
                        >
                            <X size={10} />
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            {!isMinimized && (
                <div className="flex-1 bg-background retro-bevel-inset m-1">
                    {children}
                </div>
            )}
        </div>
    );
}
