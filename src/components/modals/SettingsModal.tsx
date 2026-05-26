import { X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useState } from 'react';
import { cn } from '../../lib/utils';

type Tab = 'appearance' | 'typography' | 'data';

export function SettingsModal() {
    const { isSettingsOpen, toggleSettings, updateTheme, themePreferences } = useStore();
    const [activeTab, setActiveTab] = useState<Tab>('appearance');
    const [isClosing, setIsClosing] = useState(false);

    // Handle Closing Animation
    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            toggleSettings();
            setIsClosing(false);
        }, 200); // Match animation duration
    };

    const [isImporting, setIsImporting] = useState(false);
    const handleImport = async () => {
        setIsImporting(true);
        try {
            // Lazy load the import function so we don't circularly depend if not needed
            const { importFromFile } = await import('../../lib/page-import');
            const result = await importFromFile();
            if (result && result.success) {
                await useStore.getState().fetchPages();
                if (result.rootPageId) {
                    useStore.getState().setActivePage(result.rootPageId);
                }
                handleClose(); // Close settings when done
            } else if (result && result.errors.length > 0) {
                console.error("Import Errors: ", result.errors);
            }
        } finally {
            setIsImporting(false);
        }
    };

    if (!isSettingsOpen && !isClosing) return null;

    const colors = ['#ea6962', '#a9b665', '#d8a657', '#7daea3', '#d3869b', '#89b482', '#e78a4e', '#504945'];

    return (
        <div className={cn(
            "fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-md",
            isClosing ? "animate-out fade-out duration-200" : "animate-in fade-in duration-150"
        )}>
            <div className={cn(
                "w-[600px] bg-background border-2 border-border shadow-retro flex flex-col relative h-[500px]",
                isClosing ? "animate-retro-shutter-close" : "animate-retro-shutter"
            )}>

                {/* Header - Matching RetroPanel Titlebar */}
                <div className="h-7 bg-element flex items-center justify-between px-2 border-b border-border select-none">
                    <span className="text-xs font-mono font-bold text-main uppercase tracking-wider">
                        SYSTEM SETTINGS
                    </span>
                    <button
                        onClick={handleClose}
                        className="w-5 h-5 flex items-center justify-center border-l border-border bg-element hover:bg-red-500 hover:border-red-500 hover:text-white transition-all"
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border bg-background/50">
                    <TabButton label="APPEARANCE" active={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')} />
                    <TabButton label="TYPOGRAPHY" active={activeTab === 'typography'} onClick={() => setActiveTab('typography')} />
                    <TabButton label="DATA" active={activeTab === 'data'} onClick={() => setActiveTab('data')} />
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 overflow-y-auto bg-sidebar">

                    {activeTab === 'appearance' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                            {/* Accent Color */}
                            <ColorSection
                                label="GLOBAL ACCENT"
                                currentColor={themePreferences.accentColor}
                                colors={colors}
                                onChange={(c) => updateTheme({ accentColor: c })}
                            />
                            {/* Active Icon Color */}
                            <ColorSection
                                label="ACTIVE ICON COLOR"
                                currentColor={themePreferences.activeItemColor}
                                colors={colors}
                                onChange={(c) => updateTheme({ activeItemColor: c })}
                            />
                            {/* Heading Color */}
                            <ColorSection
                                label="HEADING COLOR"
                                currentColor={themePreferences.headingColor}
                                colors={colors}
                                onChange={(c) => updateTheme({ headingColor: c })}
                            />
                            {/* NEW: Sidebar Hover */}
                            <ColorSection
                                label="SIDEBAR HOVER (Supports 'transparent')"
                                currentColor={themePreferences.sidebarHoverColor}
                                colors={[...colors, 'transparent']}
                                onChange={(c) => updateTheme({ sidebarHoverColor: c })}
                            />
                            {/* NEW: Editor Title */}
                            <ColorSection
                                label="EDITOR TITLE COLOR"
                                currentColor={themePreferences.editorTitleColor}
                                colors={colors}
                                onChange={(c) => updateTheme({ editorTitleColor: c })}
                            />
                        </div>
                    )}

                    {activeTab === 'typography' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h3 className="text-xs font-mono font-bold text-muted mb-4 uppercase tracking-wider">BODY FONT</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FontOption
                                        label="Inter (Modern)"
                                        value="Inter"
                                        selected={themePreferences.fontBody === 'Inter'}
                                        onClick={() => updateTheme({ fontBody: 'Inter' })}
                                        preview="The quick brown fox jumps over the lazy dog."
                                        fontFamily="'Inter', sans-serif"
                                    />
                                    <FontOption
                                        label="Retro (Courier)"
                                        value="Retro"
                                        selected={themePreferences.fontBody === 'Retro'}
                                        onClick={() => updateTheme({ fontBody: 'Retro' })}
                                        preview="The quick brown fox jumps over the lazy dog."
                                        fontFamily="'Courier New', monospace"
                                    />
                                    <FontOption
                                        label="VT323 (Pixel)"
                                        value="VT323"
                                        selected={themePreferences.fontBody === 'VT323'}
                                        onClick={() => updateTheme({ fontBody: 'VT323' })}
                                        preview="The quick brown fox jumps over the lazy dog."
                                        fontFamily="'VT323', monospace"
                                    />
                                    <FontOption
                                        label="IBM Plex Mono"
                                        value="IBM Plex Mono"
                                        selected={themePreferences.fontBody === 'IBM Plex Mono'}
                                        onClick={() => updateTheme({ fontBody: 'IBM Plex Mono' })}
                                        preview="The quick brown fox jumps over the lazy dog."
                                        fontFamily="'IBM Plex Mono', monospace"
                                    />
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-mono font-bold text-muted mb-4 uppercase tracking-wider">CODE FONT</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FontOption
                                        label="JetBrains Mono"
                                        value="JetBrains Mono"
                                        selected={themePreferences.fontCode === 'JetBrains Mono'}
                                        onClick={() => updateTheme({ fontCode: 'JetBrains Mono' })}
                                        preview="const foo = 'bar';"
                                        fontFamily="'JetBrains Mono', monospace"
                                    />
                                    <FontOption
                                        label="Fira Code"
                                        value="Fira Code"
                                        selected={themePreferences.fontCode === 'Fira Code'}
                                        onClick={() => updateTheme({ fontCode: 'Fira Code' })}
                                        preview="fn main() {}"
                                        fontFamily="'Fira Code', monospace"
                                    />
                                    <FontOption
                                        label="IBM Plex Mono"
                                        value="IBM Plex Mono"
                                        selected={themePreferences.fontCode === 'IBM Plex Mono'}
                                        onClick={() => updateTheme({ fontCode: 'IBM Plex Mono' })}
                                        preview="def hello():"
                                        fontFamily="'IBM Plex Mono', monospace"
                                    />
                                    <FontOption
                                        label="VT323 (Retro)"
                                        value="VT323"
                                        selected={themePreferences.fontCode === 'VT323'}
                                        onClick={() => updateTheme({ fontCode: 'VT323' })}
                                        preview="10 PRINT 'HELLO'"
                                        fontFamily="'VT323', monospace"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'data' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h3 className="text-xs font-mono font-bold text-muted mb-4 uppercase tracking-wider">BACKUP & RESTORE</h3>
                                <p className="text-xs text-muted mb-4 opacity-80">Import a previously exported .notnip file to restore pages and assets into your workspace. Note: duplicate IDs will be automatically remapped to prevent overwriting.</p>
                                <button
                                    onClick={handleImport}
                                    disabled={isImporting}
                                    className="px-6 py-3 bg-element text-main font-bold border-2 border-border shadow-retro-sm transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:border-accent hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isImporting ? "IMPORTING..." : "IMPORT .NOTNIP FILE"}
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-4 border-t-2 border-border bg-background/30 flex justify-end">
                    <button
                        onClick={handleClose}
                        className="px-6 py-2 bg-element text-main font-bold border-2 border-border shadow-retro-sm hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-none transition-all active:bg-accent active:text-white"
                    >
                        DONE
                    </button>
                </div>
            </div>
        </div>
    );
}

function TabButton({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex-1 py-3 text-xs font-bold tracking-widest transition-colors font-mono border-b-2",
                active ? "border-accent text-accent bg-background" : "border-transparent text-muted hover:text-main hover:bg-element"
            )}
        >
            {label}
        </button>
    )
}

function ColorSection({ label, currentColor, colors, onChange }: { label: string, currentColor: string, colors: string[], onChange: (c: string) => void }) {
    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-mono text-muted font-bold">{label}</span>
                <span className="text-[10px] font-mono text-muted/50 uppercase">{currentColor}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
                {colors.map(color => (
                    <button
                        key={color}
                        onClick={() => onChange(color)}
                        className={cn(
                            "w-6 h-6 rounded-none border border-border shadow-retro-sm hover:scale-110 transition-transform focus:outline-none",
                            currentColor === color ? "ring-2 ring-accent ring-offset-2 ring-offset-sidebar" : ""
                        )}
                        style={{ backgroundColor: color }}
                        title={color}
                    />
                ))}
            </div>
        </div>
    )
}

function FontOption({ label, value: _value, selected, onClick, preview, fontFamily }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "p-3 border-2 text-left transition-all hover:bg-element group",
                selected ? "border-accent bg-element" : "border-border bg-background"
            )}
        >
            <div className={cn("text-xs font-bold mb-1", selected ? "text-accent" : "text-muted group-hover:text-main")}>{label}</div>
            <div className="text-xs opacity-70 truncate" style={{ fontFamily }}>{preview}</div>
        </button>
    )
}
