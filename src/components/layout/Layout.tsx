import { Sidebar } from "./Sidebar";
import { Titlebar } from "./Titlebar";
import { useStore } from "../../store/useStore";
import { SettingsModal } from "../modals/SettingsModal";
import { FullCalendarModal } from "../modals/FullCalendarModal";
import { WelcomeModal } from "../modals/WelcomeModal";
import { ThemeManager } from "../ThemeManager";
import { PanelManager } from "../panels/PanelManager";
import { QuickSwitcher } from "../modals/QuickSwitcher";
import { cn } from "../../lib/utils";
import { useEffect, useState } from "react";
import { Minimize2 } from "lucide-react";

function FocusSaveIndicator() {
  const saveStatus = useStore((state) => state.saveStatus);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (saveStatus === "saved") {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(t);
    }
  }, [saveStatus]);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-8 left-6 z-[99998] font-mono text-[10px] uppercase tracking-widest select-none pointer-events-none"
      style={{ color: "var(--gruv-green)", opacity: 0.45 }}
    >
      SAVED
    </div>
  );
}

export function Layout({
  children,
}: {
  children: (setWordCount: (n: number) => void) => React.ReactNode;
}) {
  const [wordCount, setWordCount] = useState(0);
  const isFocusMode = useStore((state) => state.isFocusMode);
  const toggleFocusMode = useStore((state) => state.toggleFocusMode);
  const sidebarWidth = useStore((state) => state.sidebarWidth);
  const setSidebarWidth = useStore((state) => state.setSidebarWidth);
  const isSettingsOpen = useStore((state) => state.isSettingsOpen);
  const isCalendarModalOpen = useStore((state) => state.isCalendarModalOpen);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);

  useEffect(() => {
    if (!isResizingSidebar) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.min(288, Math.max(230, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
    };
  }, [isResizingSidebar, setSidebarWidth]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "F") {
        e.preventDefault();
        toggleFocusMode();
        return;
      }

      if (isFocusMode && e.key === "Escape") {
        e.preventDefault();
        toggleFocusMode();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocusMode, toggleFocusMode]);

  return (
    <div className="flex flex-col h-screen w-screen bg-background text-main font-sans overflow-hidden border border-border shadow-2xl rounded-none relative">
      <ThemeManager />

      <div
        className={cn(
          "transition-opacity duration-300",
          isFocusMode && "opacity-0 pointer-events-none",
        )}
      >
        <Titlebar />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={cn(
            "flex-shrink-0 overflow-hidden relative",
            !isResizingSidebar && "transition-all duration-300",
            isFocusMode ? "opacity-0 pointer-events-none" : "opacity-100",
          )}
          style={{ width: isFocusMode ? 0 : sidebarWidth }}
        >
          <Sidebar />
          {!isFocusMode && (
            <div
              className={cn(
                "absolute top-0 right-0 w-1.5 h-full cursor-col-resize z-50 transition-colors",
                isResizingSidebar ? "bg-accent" : "hover:bg-accent/50",
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
            {children(setWordCount)}
          </div>

          <div
            className={cn(
              "h-6 bg-sidebar border-t border-border flex items-center px-4 text-[10px] font-mono text-muted select-none justify-between transition-opacity duration-300",
              isFocusMode && "opacity-0",
            )}
          >
            <div className="flex items-center gap-4">
              <span>{isFocusMode ? "FOCUS MODE (ESC to exit)" : "READY"}</span>
              <span>UTF-8</span>
            </div>
            <div>
              <span>{wordCount} WORDS</span>
            </div>
          </div>
        </main>
      </div>

      {isSettingsOpen && <SettingsModal />}
      {isCalendarModalOpen && <FullCalendarModal />}
      <QuickSwitcher />

      <PanelManager />

      <WelcomeModal />

      {isFocusMode && (
        <button
          onClick={toggleFocusMode}
          className="fixed top-3 right-3 z-[99999] px-3 py-1.5 bg-element/80 backdrop-blur-sm text-muted hover:text-accent border border-border hover:border-accent transition-all rounded-none shadow-retro-sm cursor-pointer font-mono text-xs uppercase tracking-wider"
          title="Exit Focus Mode (Ctrl+Shift+F or ESC)"
        >
          <Minimize2 size={14} className="inline mr-1.5" />
          ESC
        </button>
      )}

      <FocusSaveIndicator />
    </div>
  );
}
