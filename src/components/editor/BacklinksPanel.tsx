import { useState, useEffect, useRef } from "react";
import { Link, ChevronDown, ChevronRight, Loader } from "lucide-react";
import { useStore } from "../../store/useStore";
import { dbService } from "../../lib/database";
import { renderIcon } from "../ui/IconPicker";

interface Backlink {
  pageId: string;
  title: string;
  icon?: string;
}

export function BacklinksPanel({ activePageId }: { activePageId: string }) {
  const pages = useStore((state) => state.pages);
  const setActivePage = useStore((state) => state.setActivePage);

  const [isOpen, setIsOpen] = useState(false);
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Tracks which page ID the current cached result is for
  const [scannedFor, setScannedFor] = useState<string | null>(null);
  // Prevents concurrent scans; holds an abort flag object shared with the running async fn
  const scanRef = useRef<{ cancelled: boolean } | null>(null);

  // Reset everything when the active page changes
  useEffect(() => {
    // Cancel any in-progress scan for the previous page
    if (scanRef.current) {
      scanRef.current.cancelled = true;
      scanRef.current = null;
    }
    setScannedFor(null);
    setBacklinks([]);
    setIsLoading(false);
    setIsOpen(false);
  }, [activePageId]);

  // Trigger a scan when the panel opens and no cached result exists
  useEffect(() => {
    if (!isOpen) return;
    if (scannedFor === activePageId) return;
    // Already scanning — don't start a second one
    if (scanRef.current && !scanRef.current.cancelled) return;

    const guard = { cancelled: false };
    scanRef.current = guard;
    setIsLoading(true);

    const candidates = pages.filter(
      (p) => p.id !== activePageId && !p.is_deleted,
    );

    async function scan() {
      const found: Backlink[] = [];

      for (const page of candidates) {
        if (guard.cancelled) break;
        try {
          const noteContent = await dbService.getNoteContent(page.id);
          if (guard.cancelled) break;
          if (noteContent?.content) {
            const json = JSON.stringify(noteContent.content);
            if (json.includes(`"id":"${activePageId}"`)) {
              found.push({
                pageId: page.id,
                title: page.title || "Untitled",
                icon: page.icon,
              });
            }
          }
        } catch (_e) {
          // skip unreadable pages
        }
      }

      if (!guard.cancelled) {
        setBacklinks(found);
        setScannedFor(activePageId);
        setIsLoading(false);
        scanRef.current = null;
      }
    }

    scan();
  }, [isOpen, activePageId, scannedFor, pages]);

  return (
    <div className="border-t border-border mt-8 pt-4 pb-8">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center gap-2 text-muted hover:text-main transition-colors w-full text-left mb-2 select-none"
      >
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <Link size={14} />
        <span className="text-xs font-mono uppercase tracking-widest">
          Backlinks
        </span>
        {isLoading && (
          <Loader size={11} className="text-muted/50 animate-spin ml-1" />
        )}
        {!isLoading && isOpen && (
          <span className="text-xs font-mono text-muted/50 ml-1">
            ({backlinks.length})
          </span>
        )}
      </button>

      {isOpen && (
        <div className="pl-5 space-y-1">
          {isLoading && (
            <span className="text-xs font-mono text-muted/50">
              Scanning pages...
            </span>
          )}
          {!isLoading && backlinks.length === 0 && (
            <span className="text-xs font-mono text-muted/40">
              No backlinks found.
            </span>
          )}
          {backlinks.map((bl) => (
            <button
              key={bl.pageId}
              onClick={() => setActivePage(bl.pageId)}
              className="flex items-center gap-2 text-xs font-mono text-muted hover:text-accent transition-colors w-full text-left py-0.5"
            >
              <span className="flex-shrink-0">
                {renderIcon(bl.icon || "file", 12)}
              </span>
              <span className="truncate">{bl.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
