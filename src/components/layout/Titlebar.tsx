import { Minus, X, Square, Maximize } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';


export function Titlebar() {
    // const { activePageId, pages } = useStore(); // Unused for now
    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
        // Check initial state
        getCurrentWindow().isMaximized().then(setIsMaximized);
        // There isn't a direct event listener for maximize change easily accessible without more heavy lifting
        // For now we just toggle state on click.
    }, []);

    const handleMinimize = () => getCurrentWindow().minimize();

    const handleMaximize = async () => {
        await getCurrentWindow().toggleMaximize();
        const max = await getCurrentWindow().isMaximized();
        setIsMaximized(max);
    };

    const handleClose = () => getCurrentWindow().close();

    return (
        <div className="h-10 bg-background flex items-center justify-between px-3 select-none z-50 transition-colors duration-300">
            {/* Logo / Title */}
            <div className="flex items-center gap-2 pointer-events-none mr-4">
                <div className="w-3 h-3 rounded-none shadow-retro-sm" style={{ backgroundColor: 'var(--gruv-purple)' }} />
                <span className="text-sm font-mono font-bold tracking-widest text-muted">NOTNIP</span>
            </div>

            {/* Drag Region Spacer */}
            <div data-tauri-drag-region className="flex-1 h-full" />

            {/* Window Controls */}
            <div className="flex items-center gap-1 z-50 relative">


                <div className="w-px h-3 bg-border mx-1" />

                <TitlebarButton onClick={handleMinimize}>
                    <Minus size={14} />
                </TitlebarButton>
                <TitlebarButton onClick={handleMaximize}>
                    {isMaximized ? <Maximize size={12} className="rotate-180" /> : <Square size={12} />}
                </TitlebarButton>
                <TitlebarButton onClick={handleClose} isClose>
                    <X size={14} />
                </TitlebarButton>
            </div>
        </div>
    );
}

function TitlebarButton({ children, onClick, isClose }: { children: React.ReactNode, onClick: () => void, isClose?: boolean }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "p-1.5 transition-colors hover:bg-element text-muted hover:text-main",
                isClose && "hover:bg-red-500 hover:text-white"
            )}
        >
            {children}
        </button>
    )
}
