import {
  Settings,
  Search,
  Plus,
  Moon,
  Sun,
  Trash2,
  Timer,
  StickyNote,
  Focus,
  ChevronRight,
  ChevronDown,
  Calendar,
  Star,
  Clock,
  Zap,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useTheme } from "../../hooks/useTheme";
import { getPageIndex, PageMetadata, useStore } from "../../store/useStore";
import { useState, useMemo, useEffect, useRef } from "react";
import { renderIcon } from "../ui/IconPicker";

export function Sidebar() {
  const { theme, toggleTheme } = useTheme();

  const pages = useStore((state) => state.pages);
  const activePageId = useStore((state) => state.activePageId);
  const isFocusMode = useStore((state) => state.isFocusMode);
  const addPage = useStore((state) => state.addPage);
  const setActivePage = useStore((state) => state.setActivePage);
  const toggleSettings = useStore((state) => state.toggleSettings);
  const openPanel = useStore((state) => state.openPanel);
  const toggleFocusMode = useStore((state) => state.toggleFocusMode);
  const openQuickSwitcher = useStore((state) => state.openQuickSwitcher);
  const favoritePageIds = useStore((state) => state.favoritePageIds);
  const recentPageIds = useStore((state) => state.recentPageIds);
  const toggleFavorite = useStore((state) => state.toggleFavorite);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(true);
  const [isRecentOpen, setIsRecentOpen] = useState(true);
  const navigationRef = useRef<HTMLElement>(null);

  const {
    rootPages,
    childrenMap,
    pageById,
    _expandedIdsFromSearch,
    bestMatchId,
  } =
    useMemo(() => {
      const childrenMap = new Map<string, PageMetadata[]>();
      const rootPages: PageMetadata[] = [];
      const lowerQuery = searchQuery.toLowerCase().trim();
      const pageById = getPageIndex(pages);

      const matchedIds = new Set<string>();
      const forcedExpanded = new Set<string>();
      const directMatches: PageMetadata[] = [];

      if (lowerQuery) {
        pages.forEach((page) => {
          const safeTitle = (page.title || "Untitled").toLowerCase();
          if (safeTitle.includes(lowerQuery)) {
            matchedIds.add(page.id);
            directMatches.push(page);
            let currParent = page.parent_id;
            while (currParent) {
              matchedIds.add(currParent);
              forcedExpanded.add(currParent);
              currParent = pageById.get(currParent)?.parent_id || null;
            }
          }
        });
      } else {
        pages.forEach((p) => matchedIds.add(p.id));
      }

      pages.forEach((page) => {
        if (!matchedIds.has(page.id)) return;
        if (page.parent_id && matchedIds.has(page.parent_id)) {
          const siblings = childrenMap.get(page.parent_id) || [];
          siblings.push(page);
          childrenMap.set(page.parent_id, siblings);
        } else {
          rootPages.push(page);
        }
      });

      let bestMatchId: string | null = null;
      if (lowerQuery && directMatches.length > 0) {
        directMatches.sort((a, b) => {
          const aTitle = a.title.toLowerCase();
          const bTitle = b.title.toLowerCase();
          const aStarts = aTitle.startsWith(lowerQuery) ? 1 : 0;
          const bStarts = bTitle.startsWith(lowerQuery) ? 1 : 0;
          if (aStarts !== bStarts) return bStarts - aStarts;
          return aTitle.length - bTitle.length;
        });
        bestMatchId = directMatches[0].id;
      }

      return {
        rootPages,
        childrenMap,
        pageById,
        _expandedIdsFromSearch: forcedExpanded,
        bestMatchId,
      };
    }, [pages, searchQuery]);

  useEffect(() => {
    if (searchQuery) {
      setExpandedIds((prev) => new Set([...prev, ..._expandedIdsFromSearch]));
    }
  }, [_expandedIdsFromSearch, searchQuery]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getIcon = (iconName?: string, size = 16) => {
    return renderIcon(iconName || "file", size);
  };

  const renderPage = (page: PageMetadata, depth: number = 0) => {
    const children = childrenMap.get(page.id) || [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.has(page.id);
    const iconName = page.icon || "file";

    return (
      <div key={page.id}>
        <div
          className="group flex items-center"
          style={{ paddingLeft: depth * 12 }}
        >
          {/* Fixed-width chevron area - always present to maintain alignment */}
          <span
            className="w-5 h-5 flex items-center justify-center flex-shrink-0"
            onClick={(e) => {
              if (hasChildren) {
                e.stopPropagation();
                toggleExpanded(page.id);
              }
            }}
          >
            {hasChildren && (
              <span className="p-0.5 hover:bg-element rounded-sm cursor-pointer text-muted">
                {isExpanded ? (
                  <ChevronDown size={12} />
                ) : (
                  <ChevronRight size={12} />
                )}
              </span>
            )}
          </span>

          {/* Main button for page selection */}
          <button
            onClick={() => setActivePage(page.id)}
            className={cn(
              "flex items-center gap-2 flex-1 px-2 py-2 transition-all duration-100 border-none text-left text-sm min-w-0",
              activePageId === page.id
                ? "bg-element/80 text-main font-bold"
                : "text-muted hover:text-main hover:bg-element/50",
            )}
          >
            <span
              className={cn(
                "flex-shrink-0 transition-colors duration-300",
                activePageId === page.id && "text-[var(--active-icon-color)]",
              )}
            >
              {getIcon(iconName)}
            </span>
            <span className="truncate">{page.title || "Untitled"}</span>
          </button>

          {/* Star / Favorite button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(page.id);
            }}
            className={cn(
              "opacity-0 group-hover:opacity-100 p-1 transition-opacity flex-shrink-0",
              favoritePageIds.includes(page.id)
                ? "opacity-100 text-[var(--favorite-star-color)]"
                : "text-muted hover:text-[var(--favorite-star-color)]",
            )}
            title={
              favoritePageIds.includes(page.id)
                ? "Remove from favorites"
                : "Add to favorites"
            }
          >
            <Star
              size={10}
              fill={favoritePageIds.includes(page.id) ? "currentColor" : "none"}
            />
          </button>
          {/* Delete button - triggers confirmation modal */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              useStore.getState().setDeletionCandidateId(page.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-red-500 transition-opacity flex-shrink-0"
            title="Delete page"
            aria-label={`Delete page ${page.title || "Untitled"}`}
          >
            <Trash2 size={12} />
          </button>
        </div>
        {hasChildren && isExpanded && (
          <div
            className="border-l border-border/30"
            style={{ marginLeft: depth * 12 + 10 }}
          >
            {children.map((child) => renderPage(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full w-full bg-sidebar flex flex-col border-r border-border p-0 font-mono text-sm select-none transition-colors duration-300">
      {/* Action Button */}
      <div className="p-6">
        <button
          onClick={addPage}
          className={cn(
            "flex items-center justify-center gap-2 w-full bg-element text-main p-4",
            "border border-border transition-all duration-300",
            "hover:bg-accent hover:text-white hover:border-accent hover:shadow-retro-sm hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0 active:translate-x-0 active:shadow-none",
            "font-bold tracking-tight text-base",
          )}
          aria-label="Create New Note"
        >
          <Plus size={18} />
          <span>NEW NOTE</span>
        </button>
      </div>

      {/* Navigation */}
      <nav
        ref={navigationRef}
        className="flex-1 overflow-y-auto px-4 pt-6 space-y-10 custom-scrollbar"
      >
        <div>
          <h3 className="text-xs text-muted mb-4 px-2 uppercase tracking-widest font-bold opacity-70">
            Menu
          </h3>
          <div className="space-y-3">
            
            <SidebarItem
              icon={<Search size={18} />}
              label="SEARCH"
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                if (isSearchOpen) setSearchQuery("");
              }}
            />
            {isSearchOpen && (
              <div className="px-4 pb-2 animate-retro-shutter">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        searchQuery.trim() &&
                        bestMatchId
                      ) {
                        setActivePage(bestMatchId);
                        setSearchQuery("");
                        setIsSearchOpen(false);
                      }
                      if (e.key === "Escape") {
                        setSearchQuery("");
                        setIsSearchOpen(false);
                      }
                    }}
                    placeholder="Find note..."
                    className="w-full bg-element border-2 border-border text-main text-sm py-1.5 pl-9 pr-3 focus:outline-none focus:border-accent transition-colors shadow-retro-sm placeholder:text-muted/50"
                  />
                </div>
              </div>
            )}
            <SidebarItem
              icon={<Settings size={18} />}
              label="SETTINGS"
              onClick={toggleSettings}
            />
            <SidebarItem
              icon={<Focus size={18} />}
              label="FOCUS MODE"
              active={isFocusMode}
              onClick={toggleFocusMode}
            />
            <SidebarItem
              icon={<Zap size={18} />}
              label="QUICK SWITCH"
              onClick={openQuickSwitcher}
            />
          </div>
        </div>

        {/* Widgets Section */}
        <div>
          <h3 className="text-xs text-muted mb-4 px-2 uppercase tracking-widest font-bold opacity-70">
            Widgets
          </h3>
          <div className="space-y-3">
            <SidebarItem
              icon={<Calendar size={18} />}
              label="CALENDAR"
              onClick={() => openPanel("calendar")}
            />
            <SidebarItem
              icon={<Timer size={18} />}
              label="POMODORO"
              onClick={() => openPanel("pomodoro")}
            />
            <SidebarItem
              icon={<StickyNote size={18} />}
              label="QUICK NOTE"
              onClick={() => openPanel("quicknote")}
            />
          </div>
        </div>

        {/* Favorites */}
        {favoritePageIds.length > 0 &&
          (() => {
            const favPages = (favoritePageIds
              .map((id) => pageById.get(id))
              .filter((page) => page && !page.is_deleted)) as PageMetadata[];
            if (favPages.length === 0) return null;
            return (
              <div>
                <button
                  type="button"
                  onClick={() => setIsFavoritesOpen((open) => !open)}
                  className="w-full text-xs text-muted mb-3 px-2 uppercase tracking-widest font-bold opacity-70 hover:opacity-100 hover:text-main transition-colors flex items-center gap-1.5"
                >
                  {isFavoritesOpen ? (
                    <ChevronDown size={11} />
                  ) : (
                    <ChevronRight size={11} />
                  )}
                  <Star size={10} /> Favorites
                </button>
                <div
                  aria-hidden={!isFavoritesOpen}
                  className={cn(
                    "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
                    isFavoritesOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0 pointer-events-none",
                  )}
                >
                  <div className="space-y-0.5 overflow-hidden">
                    {favPages.map((p) => (
                      <div key={p.id} className="group flex items-center">
                        <button
                          onClick={() => setActivePage(p.id)}
                          className={cn(
                            "flex items-center gap-2 flex-1 px-2 py-1.5 transition-all border-none text-left text-sm min-w-0",
                            activePageId === p.id
                              ? "bg-element/80 text-main font-bold"
                              : "text-muted hover:text-main hover:bg-element/50",
                          )}
                        >
                          <span
                            className={cn(
                              "flex-shrink-0 transition-colors",
                              activePageId === p.id &&
                                "text-[var(--active-icon-color)]",
                            )}
                          >
                            {renderIcon(p.icon || "file", 14)}
                          </span>
                          <span className="truncate text-xs">
                            {p.title || "Untitled"}
                          </span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(p.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-[var(--favorite-star-color)] transition-opacity flex-shrink-0"
                          title="Remove from favorites"
                        >
                          <Star size={10} fill="currentColor" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

        {/* Recent */}
        {recentPageIds.length > 0 &&
          (() => {
            const recPages = recentPageIds
              .map((id) => pageById.get(id))
              .filter((page) => page && !page.is_deleted)
              .slice(0, 5) as PageMetadata[];
            if (recPages.length === 0) return null;
            return (
              <div>
                <button
                  type="button"
                  onClick={() => setIsRecentOpen((open) => !open)}
                  className="w-full text-xs text-muted mb-3 px-2 uppercase tracking-widest font-bold opacity-70 hover:opacity-100 hover:text-main transition-colors flex items-center gap-1.5"
                >
                  {isRecentOpen ? (
                    <ChevronDown size={11} />
                  ) : (
                    <ChevronRight size={11} />
                  )}
                  <Clock size={10} /> Recent
                </button>
                <div
                  aria-hidden={!isRecentOpen}
                  className={cn(
                    "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
                    isRecentOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0 pointer-events-none",
                  )}
                >
                  <div className="space-y-0.5 overflow-hidden">
                    {recPages.map((p) => (
                      <div key={p.id} className="group flex items-center">
                        <button
                          onClick={() => setActivePage(p.id)}
                          className={cn(
                            "flex items-center gap-2 flex-1 px-2 py-1.5 transition-all border-none text-left text-sm min-w-0",
                            activePageId === p.id
                              ? "bg-element/80 text-main font-bold"
                              : "text-muted hover:text-main hover:bg-element/50",
                          )}
                        >
                          <span className="flex-shrink-0 text-muted/60">
                            {renderIcon(p.icon || "file", 14)}
                          </span>
                          <span className="truncate text-xs">
                            {p.title || "Untitled"}
                          </span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(p.id);
                          }}
                          className={cn(
                            "opacity-0 group-hover:opacity-100 p-1 transition-opacity flex-shrink-0 hover:text-[var(--favorite-star-color)]",
                            favoritePageIds.includes(p.id)
                              ? "text-[var(--favorite-star-color)]"
                              : "text-muted",
                          )}
                          title={
                            favoritePageIds.includes(p.id)
                              ? "Remove from favorites"
                              : "Add to favorites"
                          }
                        >
                          <Star
                            size={10}
                            fill={
                              favoritePageIds.includes(p.id)
                                ? "currentColor"
                                : "none"
                            }
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

        <div>
          <h3 className="text-xs text-muted mb-4 px-2 uppercase tracking-widest font-bold opacity-70">
            Pages ({pages.length})
          </h3>
          <div className="space-y-1 pb-8">
            {rootPages.map((page) => renderPage(page))}
          </div>
        </div>
      </nav>

      {/* Footer / Theme Toggle */}
      <div className="p-4 border-t border-border flex items-center justify-between bg-background/30">
        <div className="flex items-center gap-3">
          <div className="text-xs text-muted opacity-50">v0.6.2 BETA</div>
          <SaveStatusIndicator />
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 text-muted hover:text-accent hover:bg-element transition-colors duration-300 rounded-none border border-transparent hover:border-border"
          title="Toggle Theme"
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 w-full px-4 py-3 transition-all duration-100 border-none text-left",
        active
          ? "bg-element/80 text-main font-bold"
          : "text-muted hover:text-main hover:bg-[var(--sidebar-hover-bg)]",
      )}
    >
      <span
        className={cn("transition-colors duration-300 flex-shrink-0")}
        style={active ? { color: "var(--active-icon-color)" } : undefined}
      >
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function SaveStatusIndicator() {
  const saveStatus = useStore((state) => state.saveStatus);
  const [displayStatus, setDisplayStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  useEffect(() => {
    if (saveStatus === "saving") {
      setDisplayStatus("saving");
    } else if (saveStatus === "saved") {
      setDisplayStatus("saved");
      const timer = setTimeout(() => setDisplayStatus("idle"), 2000);
      return () => clearTimeout(timer);
    } else if (saveStatus === "error") {
      setDisplayStatus("error");
    }
  }, [saveStatus]);

  if (displayStatus === "idle") return null;

  return (
    <div className="flex items-center gap-1.5 animate-in fade-in duration-300">
      <div
        className={cn(
          "w-1.5 h-1.5 rounded-full animate-pulse",
          displayStatus === "saving" && "bg-yellow-500",
          displayStatus === "saved" && "bg-green-500",
          displayStatus === "error" && "bg-red-500",
        )}
      />
      <span className="text-[10px] font-mono text-muted uppercase tracking-wider">
        {displayStatus === "saving" && "SAVING..."}
        {displayStatus === "saved" && "SAVED"}
        {displayStatus === "error" && "ERROR"}
      </span>
    </div>
  );
}
