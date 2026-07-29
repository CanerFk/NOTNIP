import {
  X,
  RotateCcw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  AlertTriangle,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "../../lib/utils";

type Tab = "appearance" | "typography" | "editor" | "data" | "guide";

const EDITOR_DEFAULTS = {
  fontSize: 17,
  lineHeight: 1.1,
  paragraphSpacing: 0.4,
  zoom: 100,
  textAlign: "left" as const,
};

export function SettingsModal() {
  const toggleSettings = useStore((state) => state.toggleSettings);
  const storeUpdateTheme = useStore((state) => state.updateTheme);
  const storeThemePreferences = useStore((state) => state.themePreferences);
  const storeEditorAppearance = useStore((state) => state.editorAppearance);
  const storeUpdateEditorAppearance = useStore(
    (state) => state.updateEditorAppearance,
  );

  const storeSettingsTab = useStore((state) => state.settingsTab);
  const reopenWelcome = useStore((state) => state.reopenWelcome);
  const [activeTab, setActiveTab] = useState<Tab>(storeSettingsTab as Tab);
  const [isClosing, setIsClosing] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  useEffect(() => {
    setActiveTab(storeSettingsTab as Tab);
  }, [storeSettingsTab]);

  const initialThemeRef = useRef(storeThemePreferences);
  const initialAppearanceRef = useRef(storeEditorAppearance ?? EDITOR_DEFAULTS);

  const hasChanges = useMemo(() => {
    return (
      JSON.stringify(initialThemeRef.current) !== JSON.stringify(storeThemePreferences) ||
      JSON.stringify(initialAppearanceRef.current) !== JSON.stringify(storeEditorAppearance ?? EDITOR_DEFAULTS)
    );
  }, [storeThemePreferences, storeEditorAppearance]);

  const ea = storeEditorAppearance ?? EDITOR_DEFAULTS;

  const updateTheme = (updates: Partial<typeof storeThemePreferences>) => {
    storeUpdateTheme(updates);
  };

  const updateEditorAppearance = (updates: Partial<typeof ea>) => {
    storeUpdateEditorAppearance(updates);
  };

  const handleCloseTrigger = () => {
    if (hasChanges) {
      setShowConfirmCancel(true);
    } else {
      executeClose();
    }
  };

  const executeClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      toggleSettings();
      setIsClosing(false);
    }, 200);
  };

  const handleSave = () => {
    executeClose();
  };

  const handleCancelRevert = () => {
    storeUpdateTheme(initialThemeRef.current);
    storeUpdateEditorAppearance(initialAppearanceRef.current);
    executeClose();
  };

  const [isImporting, setIsImporting] = useState(false);
  const handleImport = async () => {
    setIsImporting(true);
    try {
      const { importFromFile } = await import("../../lib/page-import");
      const result = await importFromFile();
      if (result && result.success) {
        await useStore.getState().fetchPages();
        if (result.rootPageId) {
          useStore.getState().setActivePage(result.rootPageId);
        }
        executeClose(); 
      } else if (result && result.errors.length > 0) {
        console.error("Import Errors: ", result.errors);
      }
    } finally {
      setIsImporting(false);
    }
  };

  const colors = [
    "#ea6962",
    "#a9b665",
    "#d8a657",
    "#7daea3",
    "#d3869b",
    "#89b482",
    "#e78a4e",
    "#504945",
  ];

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-md",
          isClosing
            ? "animate-out fade-out duration-200"
            : "animate-in fade-in duration-150",
        )}
      >
        <div
          className={cn(
            "w-[740px] bg-background border-2 border-border shadow-retro flex flex-col relative h-[640px]",
            isClosing ? "animate-retro-shutter-close" : "animate-retro-shutter",
          )}
        >
          <div className="h-7 bg-element flex items-center justify-between px-2 border-b border-border select-none">
            <span className="text-xs font-mono font-bold text-main uppercase tracking-wider">
              SYSTEM SETTINGS
            </span>
            <button
              onClick={handleCloseTrigger}
              className="w-5 h-5 flex items-center justify-center border-l border-border bg-element hover:bg-red-500 hover:border-red-500 hover:text-white transition-all"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex border-b border-border bg-background/50">
            <TabButton
              label="APPEARANCE"
              active={activeTab === "appearance"}
              onClick={() => setActiveTab("appearance")}
            />
            <TabButton
              label="TYPOGRAPHY"
              active={activeTab === "typography"}
              onClick={() => setActiveTab("typography")}
            />
            <TabButton
              label="EDITOR"
              active={activeTab === "editor"}
              onClick={() => setActiveTab("editor")}
            />
            <TabButton
              label="DATA"
              active={activeTab === "data"}
              onClick={() => setActiveTab("data")}
            />
            <TabButton
              label="GUIDE"
              active={activeTab === "guide"}
              onClick={() => setActiveTab("guide")}
            />
          </div>

          <div className="flex-1 p-8 overflow-y-auto bg-sidebar custom-scrollbar">
            {activeTab === "appearance" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                <div>
                  <h3 className="text-xs font-mono font-bold text-muted mb-4 uppercase tracking-wider">
                    LAYOUT
                  </h3>
                  <label className="flex items-center gap-3 cursor-pointer group w-fit">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={storeThemePreferences.readableLineLength}
                        onChange={(e) =>
                          updateTheme({ readableLineLength: e.target.checked })
                        }
                      />
                      <div
                        className={cn(
                          "block w-10 h-5 border-2 border-border shadow-retro-sm transition-all",
                          storeThemePreferences.readableLineLength
                            ? "bg-accent"
                            : "bg-element",
                        )}
                      />
                      <div
                        className={cn(
                          "absolute left-1 top-1 w-2.5 h-2.5 transition-transform",
                          storeThemePreferences.readableLineLength
                            ? "translate-x-4 bg-background"
                            : "bg-main",
                        )}
                      />
                    </div>
                    <span className="text-sm font-mono text-main group-hover:text-accent transition-colors select-none">
                      Readable Line Length
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <ColorSection
                    label="GLOBAL ACCENT"
                    currentColor={storeThemePreferences.accentColor}
                    colors={colors}
                    onChange={(c) => updateTheme({ accentColor: c })}
                  />
                  <ColorSection
                    label="ACTIVE ICON COLOR"
                    currentColor={storeThemePreferences.activeItemColor}
                    colors={colors}
                    onChange={(c) => updateTheme({ activeItemColor: c })}
                  />
                  <ColorSection
                    label="HEADING COLOR"
                    currentColor={storeThemePreferences.headingColor}
                    colors={colors}
                    onChange={(c) => updateTheme({ headingColor: c })}
                  />
                  <ColorSection
                    label="EDITOR TITLE COLOR"
                    currentColor={storeThemePreferences.editorTitleColor}
                    colors={colors}
                    onChange={(c) => updateTheme({ editorTitleColor: c })}
                  />
                  <ColorSection
                    label="BOLD TEXT COLOR"
                    currentColor={storeThemePreferences.boldColor || "#e78a4e"}
                    colors={colors}
                    onChange={(c) => updateTheme({ boldColor: c })}
                  />
                  <ColorSection
                    label="SIDEBAR HOVER (Supports 'transparent')"
                    currentColor={storeThemePreferences.sidebarHoverColor}
                    colors={[...colors, "transparent"]}
                    onChange={(c) => updateTheme({ sidebarHoverColor: c })}
                  />
                </div>
              </div>
            )}

            {activeTab === "typography" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h3 className="text-xs font-mono font-bold text-muted mb-4 uppercase tracking-wider">
                    BODY FONT
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FontOption
                      label="Inter (Modern)"
                      value="Inter"
                      selected={storeThemePreferences.fontBody === "Inter"}
                      onClick={() => updateTheme({ fontBody: "Inter" })}
                      preview="The quick brown fox jumps over the lazy dog."
                      fontFamily="'Inter', sans-serif"
                    />
                    <FontOption
                      label="Retro (Courier)"
                      value="Retro"
                      selected={storeThemePreferences.fontBody === "Retro"}
                      onClick={() => updateTheme({ fontBody: "Retro" })}
                      preview="The quick brown fox jumps over the lazy dog."
                      fontFamily="'Courier New', monospace"
                    />
                    <FontOption
                      label="VT323 (Pixel)"
                      value="VT323"
                      selected={storeThemePreferences.fontBody === "VT323"}
                      onClick={() => updateTheme({ fontBody: "VT323" })}
                      preview="The quick brown fox jumps over the lazy dog."
                      fontFamily="'VT323', monospace"
                    />
                    <FontOption
                      label="IBM Plex Mono"
                      value="IBM Plex Mono"
                      selected={storeThemePreferences.fontBody === "IBM Plex Mono"}
                      onClick={() => updateTheme({ fontBody: "IBM Plex Mono" })}
                      preview="The quick brown fox jumps over the lazy dog."
                      fontFamily="'IBM Plex Mono', monospace"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-mono font-bold text-muted mb-4 uppercase tracking-wider">
                    CODE FONT
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FontOption
                      label="JetBrains Mono"
                      value="JetBrains Mono"
                      selected={storeThemePreferences.fontCode === "JetBrains Mono"}
                      onClick={() => updateTheme({ fontCode: "JetBrains Mono" })}
                      preview="const foo = 'bar';"
                      fontFamily="'JetBrains Mono', monospace"
                    />
                    <FontOption
                      label="Fira Code"
                      value="Fira Code"
                      selected={storeThemePreferences.fontCode === "Fira Code"}
                      onClick={() => updateTheme({ fontCode: "Fira Code" })}
                      preview="fn main() {}"
                      fontFamily="'Fira Code', monospace"
                    />
                    <FontOption
                      label="IBM Plex Mono"
                      value="IBM Plex Mono"
                      selected={storeThemePreferences.fontCode === "IBM Plex Mono"}
                      onClick={() => updateTheme({ fontCode: "IBM Plex Mono" })}
                      preview="def hello():"
                      fontFamily="'IBM Plex Mono', monospace"
                    />
                    <FontOption
                      label="VT323 (Retro)"
                      value="VT323"
                      selected={storeThemePreferences.fontCode === "VT323"}
                      onClick={() => updateTheme({ fontCode: "VT323" })}
                      preview="10 PRINT 'HELLO'"
                      fontFamily="'VT323', monospace"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "editor" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-mono font-bold text-muted uppercase tracking-wider">
                    EDITOR APPEARANCE
                  </h3>
                  <button
                    onClick={() => updateEditorAppearance(EDITOR_DEFAULTS)}
                    className="flex items-center gap-1 text-[10px] font-mono text-muted hover:text-accent transition-colors"
                    title="Reset to defaults"
                  >
                    <RotateCcw size={10} /> RESET
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <SettingSlider
                    label="Font Size"
                    value={ea.fontSize ?? 17}
                    min={12}
                    max={24}
                    step={1}
                    format={(v) => `${v}px`}
                    onChange={(v) => updateEditorAppearance({ fontSize: v })}
                  />
                  <SettingSlider
                    label="Line Height"
                    value={ea.lineHeight ?? 1.1}
                    min={1.0}
                    max={2.5}
                    step={0.1}
                    format={(v) => v.toFixed(1)}
                    onChange={(v) =>
                      updateEditorAppearance({
                        lineHeight: parseFloat(v.toFixed(1)),
                      })
                    }
                  />
                  <SettingSlider
                    label="Paragraph Spacing"
                    value={ea.paragraphSpacing ?? 0.4}
                    min={0}
                    max={2}
                    step={0.1}
                    format={(v) => `${v.toFixed(1)}em`}
                    onChange={(v) =>
                      updateEditorAppearance({
                        paragraphSpacing: parseFloat(v.toFixed(1)),
                      })
                    }
                  />
                  <SettingSlider
                    label="Zoom"
                    value={ea.zoom ?? 100}
                    min={70}
                    max={150}
                    step={5}
                    format={(v) => `${v}%`}
                    onChange={(v) => updateEditorAppearance({ zoom: v })}
                  />
                </div>

                <div className="pt-2">
                  <AlignmentControl
                    value={
                      (ea as any).textAlign ||
                      ((ea as any).justifyText ? "justify" : "left")
                    }
                    onChange={(textAlign) => updateEditorAppearance({ textAlign })}
                  />
                </div>
              </div>
            )}

            {activeTab === "data" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h3 className="text-xs font-mono font-bold text-muted mb-4 uppercase tracking-wider">
                    BACKUP & RESTORE
                  </h3>
                  <p className="text-sm text-muted mb-6 leading-relaxed">
                    Import a previously exported .notnip file to restore pages and
                    assets into your workspace. Note: duplicate IDs will be
                    automatically remapped to prevent overwriting existing notes.
                  </p>
                  <button
                    onClick={handleImport}
                    disabled={isImporting}
                    className="px-6 py-3 bg-element text-main font-bold border-2 border-border shadow-retro-sm transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:border-accent hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed uppercase font-mono tracking-widest text-sm"
                  >
                    {isImporting ? "Importing..." : "Import .notnip File"}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "guide" && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300 pb-12">
                <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h3 className="text-sm font-mono font-bold text-accent mb-1 uppercase tracking-widest border-b-2 border-accent pb-2 inline-block">
                    ~ Welcome to Notnip ~
                  </h3>
                  <p className="text-sm text-main/90 leading-relaxed font-mono mt-2">
                    A calm, completely local workspace built for performance. Let's make it yours.
                  </p>
                </div>
                <button
                  onClick={() => { reopenWelcome(); executeClose(); }}
                  className="flex-shrink-0 px-3 py-1.5 bg-element border border-border shadow-retro-sm font-mono text-[11px] uppercase tracking-wider text-muted hover:text-accent hover:border-accent transition-colors whitespace-nowrap"
                  title="Reopen the Quick Tour"
                >
                  Quick Tour
                </button>
              </div>

                {/* Command Menu & Flags */}
                <div className="space-y-4">
                  <h4 className="text-xs font-mono font-bold text-gruv-orange uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-gruv-orange"></span>
                    The Command Menu & Flags
                  </h4>
                  <div className="p-4 bg-background border-2 border-border shadow-retro-sm">
                    <p className="text-sm font-mono text-muted leading-relaxed mb-4">
                      Type <code className="text-gruv-green">/</code> anywhere to open the command menu. You can instantly insert Headers, Tasks, Dividers, or even custom Blocks.
                    </p>
                    <p className="text-sm font-mono text-muted leading-relaxed mb-4">
                      <strong className="text-main">The Flag System (-):</strong> Many commands support "flags" to customize them instantly. After typing a command, add a space and a dash. For example:
                    </p>
                    <ul className="list-none p-0 space-y-2 text-sm font-mono text-muted opacity-90 pl-4 border-l-2 border-element">
                      <li><code className="text-main">/h1 -c</code> : Creates a Heading 1 and opens the Color picker.</li>
                      <li><code className="text-main">/list -t</code> : Creates a Toggleable list.</li>
                      <li><code className="text-main">/quote -a</code> : Creates a Quote block with an Author citation.</li>
                    </ul>
                  </div>
                </div>

                {/* Templates & Applets */}
                <div className="space-y-4">
                  <h4 className="text-xs font-mono font-bold text-gruv-yellow uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-gruv-yellow"></span>
                    Templates & Applets
                  </h4>
                  <div className="p-4 bg-background border-2 border-border shadow-retro-sm">
                    <p className="text-sm font-mono text-muted leading-relaxed mb-4">
                      <strong className="text-main">Templates:</strong> Need a daily journal or a meeting note? Type <code className="text-gruv-green">/Template</code> to instantly inject pre-built structures into your current page.
                    </p>
                    <p className="text-sm font-mono text-muted leading-relaxed">
                      <strong className="text-main">Applets (Panels):</strong> Notnip isn't just text. It has built-in widgets like the Pomodoro Timer and Quick Notes. These run in independent panels so you can manage your focus without leaving your workspace.
                    </p>
                  </div>
                </div>

                {/* Keyboard Shortcuts */}
                <div className="space-y-4">
                  <h4 className="text-xs font-mono font-bold text-gruv-aqua uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-gruv-aqua"></span>
                    Essential Shortcuts
                  </h4>
                  <div className="p-4 bg-background border-2 border-border shadow-retro-sm overflow-hidden">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm font-mono text-muted opacity-90">
                      <div className="flex justify-between items-center border-b border-element pb-2">
                        <span>Quick Switcher</span>
                        <code className="text-main">Ctrl + P / K</code>
                      </div>
                      <div className="flex justify-between items-center border-b border-element pb-2">
                        <span>Find & Replace</span>
                        <code className="text-main">Ctrl + F</code>
                      </div>
                      <div className="flex justify-between items-center border-b border-element pb-2">
                        <span>Toggle Focus Mode</span>
                        <code className="text-main">Ctrl + Shift + F</code>
                      </div>
                      <div className="flex justify-between items-center border-b border-element pb-2">
                        <span>New Page</span>
                        <code className="text-main">Ctrl + N</code>
                      </div>
                      <div className="flex justify-between items-center border-b border-element pb-2">
                        <span>Close Page</span>
                        <code className="text-main">Ctrl + W</code>
                      </div>
                      <div className="flex justify-between items-center border-b border-element pb-2">
                        <span>Undo / Redo</span>
                        <code className="text-main">Ctrl + Z / Shift + Z</code>
                      </div>
                      <div className="flex justify-between items-center border-b border-element pb-2">
                        <span>Zoom In/Out</span>
                        <code className="text-main">Ctrl + Scroll</code>
                      </div>
                      <div className="flex justify-between items-center border-b border-element pb-2">
                        <span>Zoom +/-</span>
                        <code className="text-main">Ctrl + / -</code>
                      </div>
                      <div className="flex justify-between items-center border-b border-element pb-2">
                        <span>Reset Zoom</span>
                        <code className="text-main">Ctrl + 0</code>
                      </div>
                      <div className="flex justify-between items-center border-b border-element pb-2">
                        <span>Exit / Cancel</span>
                        <code className="text-main">ESC</code>
                      </div>
                      <div className="flex justify-between items-center border-b border-element pb-2">
                        <span>Bold Text</span>
                        <code className="text-main">Ctrl + B</code>
                      </div>
                      <div className="flex justify-between items-center border-b border-element pb-2">
                        <span>Italic Text</span>
                        <code className="text-main">Ctrl + I</code>
                      </div>
                      <div className="flex justify-between items-center border-b border-element pb-2">
                        <span>Inline Code</span>
                        <code className="text-main">Ctrl + E</code>
                      </div>
                      <div className="flex justify-between items-center border-b border-element pb-2">
                        <span>Open Link</span>
                        <code className="text-main">Ctrl + Click</code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Editor & Subpages */}
                <div className="space-y-4">
                  <h4 className="text-xs font-mono font-bold text-accent uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent"></span>
                    Editor Basics
                  </h4>
                  <div className="p-4 bg-background border-2 border-border shadow-retro-sm">
                    <p className="text-sm font-mono text-muted leading-relaxed mb-4">
                      <strong className="text-main">Text Selection:</strong> Highlight any text to reveal the contextual menu where you can instantly apply formatting or specific colors to individual words.
                    </p>
                    <p className="text-sm font-mono text-muted leading-relaxed">
                      <strong className="text-main">Subpages & Nesting:</strong> Keep your mind organized. Type <code className="text-gruv-green">/subpage</code> to nest a new document right where your cursor is. You can also drag and drop pages in the sidebar to organize them infinitely.
                    </p>
                  </div>
                </div>

              </div>
            )}
          </div>

          <div className="p-4 border-t-2 border-border bg-background/80 flex justify-between items-center z-10 backdrop-blur-sm">
            {hasChanges ? (
              <span className="text-xs font-mono text-gruv-orange animate-pulse">Unsaved changes...</span>
            ) : (
              <span className="text-xs font-mono text-muted/50">All settings applied immediately upon save.</span>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleCloseTrigger}
                className="px-6 py-2 text-xs font-mono font-bold text-muted hover:text-main bg-background border-2 border-border transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 shadow-retro-sm hover:border-muted focus:outline-none"
              >
                CANCEL
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className={cn(
                  "px-8 py-2 text-xs font-mono font-bold transition-all border-2 focus:outline-none",
                  hasChanges
                    ? "bg-accent text-[var(--bg-primary)] border-accent shadow-retro-sm hover:-translate-y-0.5 hover:-translate-x-0.5"
                    : "bg-element text-muted border-border opacity-50 cursor-not-allowed"
                )}
              >
                SAVE
              </button>
            </div>
          </div>
        </div>
      </div>

      {showConfirmCancel && (
        <ConfirmCancelModal
          onConfirm={() => {
            setShowConfirmCancel(false);
            handleCancelRevert();
          }}
          onCancel={() => setShowConfirmCancel(false)}
        />
      )}
    </>
  );
}

function ConfirmCancelModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [isClosing, setIsClosing] = useState(false);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelBtnRef.current?.focus();
  }, []);

  const handleCancel = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onCancel();
    }, 200);
  };

  const handleConfirm = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onConfirm();
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onKeyDown={handleKeyDown}
    >
      <div
        className={cn(
          "w-[380px] bg-background border-2 border-border shadow-retro flex flex-col",
          isClosing ? "animate-retro-shutter-close" : "animate-retro-shutter",
        )}
      >
        <div className="h-7 bg-element flex items-center justify-between px-2 border-b border-border select-none">
          <span className="text-xs font-mono font-bold text-accent-orange uppercase tracking-wider">
            Unsaved Changes
          </span>
          <button
            type="button"
            onClick={handleCancel}
            className="w-5 h-5 flex items-center justify-center border-l border-border bg-element hover:bg-accent-orange hover:text-white transition-all"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex items-start gap-4">
          <AlertTriangle
            size={28}
            className="text-accent-orange flex-shrink-0 mt-0.5"
          />
          <p className="text-sm text-main font-mono leading-relaxed">
            Are you sure you want to exit without saving? All changes will be lost.
          </p>
        </div>

        <div className="p-3 border-t border-border bg-background/50 flex justify-end gap-3">
          <button
            type="button"
            ref={cancelBtnRef}
            onClick={handleCancel}
            className="px-5 py-2 text-xs font-mono font-bold bg-background text-main border-2 border-border hover:border-muted transition-colors focus:outline-none focus:border-accent"
          >
            GO BACK
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 text-xs font-mono font-bold bg-accent-orange text-[var(--bg-primary)] border-2 border-accent-orange hover:opacity-90 transition-opacity focus:outline-none"
          >
            EXIT
          </button>
        </div>
      </div>
    </div>
  );
}

function AlignmentControl({
  value,
  onChange,
}: {
  value: "left" | "center" | "right" | "justify";
  onChange: (value: "left" | "center" | "right" | "justify") => void;
}) {
  const options = [
    { value: "left", label: "Left", icon: <AlignLeft size={14} /> },
    { value: "center", label: "Center", icon: <AlignCenter size={14} /> },
    { value: "right", label: "Right", icon: <AlignRight size={14} /> },
    { value: "justify", label: "Justify", icon: <AlignJustify size={14} /> },
  ] as const;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-mono text-muted font-bold uppercase tracking-wider">
          Text Alignment
        </span>
        <span className="text-xs font-mono text-accent font-bold uppercase">
          {value}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            title={option.label}
            className={cn(
              "h-10 flex items-center justify-center border-2 font-mono text-xs transition-all",
              value === option.value
                ? "bg-accent text-background border-accent shadow-retro-sm -translate-y-0.5 -translate-x-0.5"
                : "bg-element text-muted border-border hover:text-main hover:border-accent hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-retro-sm",
            )}
          >
            {option.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 py-3 text-xs font-bold tracking-widest transition-colors font-mono border-b-2 focus:outline-none",
        active
          ? "border-accent text-accent bg-background"
          : "border-transparent text-muted hover:text-main hover:bg-element",
      )}
    >
      {label}
    </button>
  );
}

function ColorSection({
  label,
  currentColor,
  colors,
  onChange,
}: {
  label: string;
  currentColor: string;
  colors: string[];
  onChange: (c: string) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[11px] font-mono text-muted font-bold tracking-wide">{label}</span>
        <span className="text-[10px] font-mono text-muted/50 uppercase">
          {currentColor}
        </span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className={cn(
              "w-6 h-6 rounded-none border border-border shadow-retro-sm hover:scale-110 transition-transform focus:outline-none",
              currentColor === color
                ? "ring-2 ring-accent ring-offset-2 ring-offset-sidebar"
                : "",
            )}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  );
}

function FontOption({
  label,
  value: _value,
  selected,
  onClick,
  preview,
  fontFamily,
}: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-4 border-2 text-left transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-retro-sm group focus:outline-none",
        selected ? "border-accent bg-element shadow-retro-sm -translate-y-0.5 -translate-x-0.5" : "border-border bg-background",
      )}
    >
      <div
        className={cn(
          "text-xs font-bold mb-1.5",
          selected ? "text-accent" : "text-muted group-hover:text-main",
        )}
      >
        {label}
      </div>
      <div className="text-xs opacity-70 truncate" style={{ fontFamily }}>
        {preview}
      </div>
    </button>
  );
}

function SettingSlider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[11px] font-mono text-muted font-bold uppercase tracking-wider">
          {label}
        </span>
        <span className="text-xs font-mono text-accent font-bold">
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 appearance-none bg-element border border-border accent-[var(--accent)] cursor-pointer"
      />
      <div className="flex justify-between text-[9px] font-mono text-muted/40 mt-1">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}
