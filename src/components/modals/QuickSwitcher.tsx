import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { getPageIndex, useStore } from "../../store/useStore";
import {
  Search,
  Plus,
  Settings,
  Sun,
  Timer,
  StickyNote,
  Calendar,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { renderIcon } from "../ui/IconPicker";
import { useTheme } from "../../hooks/useTheme";

interface PageResult {
  kind: "page";
  id: string;
  title: string;
  icon?: string;
  score: number;
}

interface CommandResult {
  kind: "command";
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

type SwitcherResult = PageResult | CommandResult;

function scoreTitle(title: string, query: string): number {
  if (!query) return 0;
  const t = title.toLowerCase();
  const q = query.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 60;
  const words = t.split(/\s+/);
  if (words.some((w) => w.startsWith(q))) return 50;
  return 0;
}


export function QuickSwitcher() {
  const isOpen = useStore((state) => state.isQuickSwitcherOpen);
  const closeQuickSwitcher = useStore((state) => state.closeQuickSwitcher);
  const pages = useStore((state) => state.pages);
  const recentPageIds = useStore((state) => state.recentPageIds);
  const favoritePageIds = useStore((state) => state.favoritePageIds);
  const setActivePage = useStore((state) => state.setActivePage);
  const addPage = useStore((state) => state.addPage);
  const toggleSettings = useStore((state) => state.toggleSettings);
  const openPanel = useStore((state) => state.openPanel);
  const openOrCreateDailyNote = useStore(
    (state) => state.openOrCreateDailyNote,
  );
  const { toggleTheme } = useTheme();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const requestClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      closeQuickSwitcher();
      setIsClosing(false);
    }, 160);
  }, [closeQuickSwitcher]);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [isOpen]);

  const commands: CommandResult[] = useMemo(
    () => [
      {
        kind: "command" as const,
        id: "new-page",
        label: "New Page",
        icon: <Plus size={14} />,
        action: () => {
          addPage();
          requestClose();
        },
      },
      {
        kind: "command" as const,
        id: "daily-note",
        label: "Open Daily Note",
        icon: <Calendar size={14} />,
        action: () => {
          openOrCreateDailyNote();
          requestClose();
        },
      },
      {
        kind: "command" as const,
        id: "settings",
        label: "Open Settings",
        icon: <Settings size={14} />,
        action: () => {
          toggleSettings();
          requestClose();
        },
      },
      {
        kind: "command" as const,
        id: "toggle-theme",
        label: "Toggle Theme (Light / Dark)",
        icon: <Sun size={14} />,
        action: () => {
          toggleTheme();
          requestClose();
        },
      },
      {
        kind: "command" as const,
        id: "pomodoro",
        label: "Open Pomodoro",
        icon: <Timer size={14} />,
        action: () => {
          openPanel("pomodoro");
          requestClose();
        },
      },
      {
        kind: "command" as const,
        id: "quicknote",
        label: "Open Quick Notes",
        icon: <StickyNote size={14} />,
        action: () => {
          openPanel("quicknote");
          requestClose();
        },
      },
      {
        kind: "command" as const,
        id: "calendar",
        label: "Open Calendar",
        icon: <Calendar size={14} />,
        action: () => {
          openPanel("calendar");
          requestClose();
        },
      },
    ],
    [
      addPage,
      openOrCreateDailyNote,
      toggleSettings,
      toggleTheme,
      openPanel,
      requestClose,
    ],
  );

  const results: SwitcherResult[] = useMemo(() => {
    const q = query.trim();
    const lowerQ = q.toLowerCase();

    if (!q) {
      const pageById = getPageIndex(pages);
      const recentPageIdSet = new Set(recentPageIds);
      const recentPages: PageResult[] = recentPageIds
        .map((id) => pageById.get(id))
        .filter((page) => page && !page.is_deleted)
        .map((p) => ({
          kind: "page" as const,
          id: p!.id,
          title: p!.title || "Untitled",
          icon: p!.icon,
          score: 90,
        }))
        .slice(0, 8);

      const favoritePages: PageResult[] = favoritePageIds
        .map((id) => pageById.get(id))
        .filter((page) => page && !page.is_deleted)
        .filter((page) => !recentPageIdSet.has(page!.id))
        .map((p) => ({
          kind: "page" as const,
          id: p!.id,
          title: p!.title || "Untitled",
          icon: p!.icon,
          score: 70,
        }));

      return [...recentPages, ...favoritePages, ...commands].slice(0, 12);
    }

    const pageResults: PageResult[] = pages
      .filter((p) => !p.is_deleted)
      .map((p) => {
        const title = p.title || "Untitled";
        const score = scoreTitle(title, lowerQ);
        return { kind: "page" as const, id: p.id, title, icon: p.icon, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    const commandResults = commands.filter((c) =>
      c.label.toLowerCase().includes(lowerQ),
    );

    return [...pageResults, ...commandResults].slice(0, 12);
  }, [query, pages, recentPageIds, favoritePageIds, commands]);

  useEffect(() => {
    setSelectedIndex((prev) => Math.min(prev, Math.max(0, results.length - 1)));
  }, [results.length]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const activate = useCallback(
    (result: SwitcherResult) => {
      if (result.kind === "page") {
        setActivePage(result.id);
        requestClose();
      } else {
        result.action();
      }
    },
    [setActivePage, requestClose],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      requestClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[selectedIndex];
      if (r) activate(r);
    }
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[99999] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm",
        isClosing ? "animate-out fade-out duration-150" : "animate-in fade-in duration-100",
      )}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div
        className={cn(
          "w-[520px] bg-background border-2 border-border shadow-retro flex flex-col max-h-[60vh]",
          isClosing ? "animate-retro-shutter-close" : "animate-retro-shutter",
        )}
      >
        {/* Header */}
        <div className="h-7 bg-element flex items-center gap-2 px-3 border-b border-border select-none flex-shrink-0">
          <Search size={12} className="text-accent flex-shrink-0" />
          <span className="text-xs font-mono font-bold text-main uppercase tracking-wider">
            QUICK SWITCHER
          </span>
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border flex-shrink-0">
          <Search size={14} className="text-muted flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages or type a command..."
            spellCheck={false}
            className="flex-1 bg-transparent text-main text-sm font-mono outline-none placeholder:text-muted/50"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className="text-muted hover:text-main transition-colors text-xs font-mono"
            >
              ✕
            </button>
          )}
        </div>

        {/* Results */}
        <div ref={listRef} className="flex-1 overflow-y-auto custom-scrollbar">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-muted text-xs font-mono text-center opacity-60">
              No results for "{query}"
            </div>
          ) : (
            results.map((result, idx) => (
              <button
                key={result.id}
                data-idx={idx}
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => activate(result)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-none",
                  idx === selectedIndex
                    ? "bg-accent/20 text-main"
                    : "text-muted hover:text-main hover:bg-element/50",
                )}
              >
                <span
                  className={cn(
                    "flex-shrink-0",
                    idx === selectedIndex ? "text-accent" : "text-muted/70",
                  )}
                >
                  {result.kind === "page"
                    ? renderIcon(result.icon || "file", 14)
                    : result.icon}
                </span>
                <span className="flex-1 text-sm font-mono truncate">
                  {result.kind === "page"
                    ? result.title || "Untitled"
                    : result.label}
                </span>
                <span className="text-[10px] font-mono text-muted/40 flex-shrink-0">
                  {result.kind === "command" ? "CMD" : "PAGE"}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div className="h-6 border-t border-border flex items-center px-3 gap-4 flex-shrink-0 bg-element/30">
          <span className="text-[10px] font-mono text-muted/50">
            ↑↓ navigate
          </span>
          <span className="text-[10px] font-mono text-muted/50">
            Enter select
          </span>
          <span className="text-[10px] font-mono text-muted/50">Esc close</span>
        </div>
      </div>
    </div>
  );
}
