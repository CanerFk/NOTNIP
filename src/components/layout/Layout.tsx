import { Sidebar } from './Sidebar';
import { Titlebar } from './Titlebar';
import { useStore } from '../../store/useStore';
import { SettingsModal } from '../modals/SettingsModal';
import { FullCalendarModal } from '../modals/FullCalendarModal';
import { ThemeManager } from '../ThemeManager';
import { PanelManager } from '../panels/PanelManager';
import { cn } from '../../lib/utils';
import { useEffect, useState } from 'react';
import { Minimize2 } from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
    const { wordCount, isFocusMode, toggleFocusMode, sidebarWidth, setSidebarWidth } = useStore();
    const [isResizingSidebar, setIsResizingSidebar] = useState(false);

    // Sidebar Resize Drag Logic
    useEffect(() => {
        if (!isResizingSidebar) return;

        const handleMouseMove = (e: MouseEvent) => {
            // Clamp between 230px (20% less) and 288px (w-72 default)
            const newWidth = Math.min(288, Math.max(230, e.clientX));
            setSidebarWidth(newWidth);
        };

        const handleMouseUp = () => {
            setIsResizingSidebar(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
        };
    }, [isResizingSidebar, setSidebarWidth]);

    // ESC key to exit focus mode - Capture phase to override editor
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isFocusMode && e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                toggleFocusMode();
            }
        };
        window.addEventListener('keydown', handleKeyDown, { capture: true });
        return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
    }, [isFocusMode, toggleFocusMode]);

    return (
        <div className="flex flex-col h-screen w-screen bg-background text-main font-sans overflow-hidden border border-border shadow-2xl rounded-none relative">
            <ThemeManager />

            {/* Titlebar - hidden in focus mode */}
            <div className={cn("transition-opacity duration-300", isFocusMode && "opacity-0 pointer-events-none")}>
                <Titlebar />
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar - hidden in focus mode */}
                <aside
                    className={cn(
                        "flex-shrink-0 overflow-hidden relative",
                        !isResizingSidebar && "transition-all duration-300",
                        isFocusMode ? "opacity-0 pointer-events-none" : "opacity-100"
                    )}
                    style={{ width: isFocusMode ? 0 : sidebarWidth }}
                >
                    <Sidebar />
                    {/* Invisible drag handle edge */}
                    {!isFocusMode && (
                        <div
                            className={cn(
                                "absolute top-0 right-0 w-1.5 h-full cursor-col-resize z-50 transition-colors",
                                isResizingSidebar ? "bg-accent" : "hover:bg-accent/50"
                            )}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                setIsResizingSidebar(true);
                            }}
                            title="Resize Sidebar"
                        />
                    )}
                </aside>

                <main className="flex-1 h-full overflow-hidden relative flex flex-col">
                    <div className="flex-1 overflow-hidden relative">
                        {children}
                    </div>

                    {/* Status Bar */}
                    <div className={cn(
                        "h-6 bg-sidebar border-t border-border flex items-center px-4 text-[10px] font-mono text-muted select-none justify-between transition-opacity duration-300",
                        isFocusMode && "opacity-0"
                    )}>
                        <div className="flex items-center gap-4">
                            <span>{isFocusMode ? 'FOCUS MODE (ESC to exit)' : 'READY'}</span>
                            <span>UTF-8</span>
                        </div>
                        <div>
                            <span>{wordCount} WORDS</span>
                        </div>
                    </div>
                </main>
            </div>

            <SettingsModal />
            <FullCalendarModal />

            {/* Floating Retro Panels */}
            <PanelManager />

            {/* EXIT FOCUS MODE BUTTON - Subtle retro style */}
            {isFocusMode && (
                <button
                    onClick={toggleFocusMode}
                    className="fixed top-3 right-3 z-[99999] px-3 py-1.5 bg-element/80 backdrop-blur-sm text-muted hover:text-accent border border-border hover:border-accent transition-all rounded-none shadow-retro-sm cursor-pointer font-mono text-xs uppercase tracking-wider"
                    title="Exit Focus Mode (ESC)"
                >
                    <Minimize2 size={14} className="inline mr-1.5" />
                    ESC
                </button>
            )}
        </div>
    );
}
