import type { Editor } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import { Bold, Italic, Strikethrough, Code, Palette, X } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/utils";

const GRUVBOX_COLORS = [
  { label: "Red", value: "#ea6962" },
  { label: "Green", value: "#a9b665" },
  { label: "Yellow", value: "#d8a657" },
  { label: "Blue", value: "#7daea3" },
  { label: "Purple", value: "#d3869b" },
  { label: "Aqua", value: "#89b482" },
  { label: "Orange", value: "#e78a4e" },
] as const;

interface BubbleMenuProps {
  editor: Editor;
}

export function BubbleMenuComponent({ editor }: BubbleMenuProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMenuVisibleRef = useRef(false);

  const showMenu = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (isMenuVisibleRef.current || !menuRef.current) return;
    menuRef.current.style.display = "flex";
    menuRef.current.style.animation =
      "bubbleMenuIn 120ms cubic-bezier(0.16, 1, 0.3, 1) forwards";
    isMenuVisibleRef.current = true;
    setIsVisible(true);
  }, []);

  const hideMenu = useCallback(() => {
    if (!menuRef.current || !isMenuVisibleRef.current) return;
    isMenuVisibleRef.current = false;
    menuRef.current.style.animation = "bubbleMenuOut 80ms cubic-bezier(0.4, 0, 1, 1) forwards";
    hideTimerRef.current = setTimeout(() => {
      if (menuRef.current) menuRef.current.style.display = "none";
      setIsVisible(false);
      setShowColors(false);
    }, 80);
  }, []);

  const updatePosition = useCallback(() => {
    const { state, view } = editor;
    const { selection } = state;

    if (
      !(selection instanceof TextSelection) ||
      selection.empty ||
      editor.isActive("codeBlock")
    ) {
      hideMenu();
      return;
    }

    const domSel = window.getSelection();
    if (!domSel || domSel.rangeCount === 0) {
      hideMenu();
      return;
    }

    const range = domSel.getRangeAt(0);
    const editorDom = view.dom;
    if (!editorDom.contains(range.commonAncestorContainer)) {
      hideMenu();
      return;
    }

    const rect = range.getBoundingClientRect();

    if (rect.width === 0 && rect.height === 0) {
      hideMenu();
      return;
    }

    const editorRect = editorDom.getBoundingClientRect();
    if (
      rect.top < editorRect.top ||
      rect.bottom > editorRect.bottom + 200 ||
      rect.left < editorRect.left - 100
    ) {
      hideMenu();
      return;
    }

    if (!menuRef.current) return;

    menuRef.current.style.display = "flex";
    const menuWidth = menuRef.current.offsetWidth;
    const menuHeight = menuRef.current.offsetHeight;
    const GAP = 10;

    let x = rect.left + rect.width / 2 - menuWidth / 2;
    let y = rect.top - menuHeight - GAP;

    x = Math.max(8, Math.min(x, window.innerWidth - menuWidth - 8));
    if (y < 8) {
      y = rect.bottom + GAP;
    }

    menuRef.current.style.left = `${Math.round(x)}px`;
    menuRef.current.style.top = `${Math.round(y)}px`;

    showMenu();
  }, [editor, showMenu, hideMenu]);

  useEffect(() => {
    const handle = () => {
      const { selection } = editor.state;
      if (
        !(selection instanceof TextSelection) ||
        selection.empty ||
        editor.isActive("codeBlock")
      ) {
        hideMenu();
        return;
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updatePosition);
    };

    editor.on("selectionUpdate", handle);
    editor.on("transaction", handle);

    return () => {
      editor.off("selectionUpdate", handle);
      editor.off("transaction", handle);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      isMenuVisibleRef.current = false;
    };
  }, [editor, updatePosition]);

  useEffect(() => {
    if (!isVisible) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowColors(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isVisible]);

  const applyColor = useCallback(
    (color: string | null) => {
      if (color === null) {
        editor.chain().focus().unsetColor().run();
      } else {
        editor.chain().focus().setColor(color).run();
      }
      setShowColors(false);
    },
    [editor],
  );

  const currentColor = editor.getAttributes("textStyle").color as string | undefined;

  const menu = (
    <>
      <style>{`
        @keyframes bubbleMenuIn {
          from { opacity: 0; transform: translateY(6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes bubbleMenuOut {
          from { opacity: 1; transform: translateY(0)   scale(1); }
          to   { opacity: 0; transform: translateY(4px) scale(0.97); }
        }
      `}</style>
      <div
        ref={menuRef}
        style={{
          position: "fixed",
          display: "none",
          zIndex: 99990,
          fontFamily: "var(--font-code)",
          pointerEvents: "auto",
          willChange: "transform, opacity",
          transformOrigin: "center bottom",
        }}
        className="items-stretch bg-element border border-border shadow-retro-sm select-none"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <BubbleBtn
          active={editor.isActive("bold")}
          title="Bold (Ctrl+B)"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={12} />
        </BubbleBtn>

        <BubbleBtn
          active={editor.isActive("italic")}
          title="Italic (Ctrl+I)"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={12} />
        </BubbleBtn>

        <BubbleBtn
          active={editor.isActive("strike")}
          title="Strikethrough"
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={12} />
        </BubbleBtn>

        <BubbleBtn
          active={editor.isActive("code")}
          title="Inline Code (Ctrl+E)"
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code size={12} />
        </BubbleBtn>

        <div className="w-px bg-border self-stretch flex-shrink-0" />

        <BubbleBtn
          active={showColors || !!currentColor}
          title="Text Color"
          onClick={() => setShowColors((v) => !v)}
          style={currentColor ? { color: currentColor } : undefined}
        >
          <Palette size={12} />
        </BubbleBtn>

        {showColors && (
          <>
            <div className="w-px bg-border self-stretch flex-shrink-0" />
            <div className="flex items-center gap-1 px-2 flex-shrink-0">
              {GRUVBOX_COLORS.map((c) => (
                <button
                  key={c.value}
                  title={c.label}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyColor(c.value);
                  }}
                  className={cn(
                    "w-3.5 h-3.5 border border-border/60 transition-transform hover:scale-125 focus:outline-none flex-shrink-0",
                    currentColor === c.value &&
                      "ring-1 ring-white ring-offset-1 ring-offset-element",
                  )}
                  style={{ backgroundColor: c.value }}
                />
              ))}
              <button
                title="Clear color"
                onMouseDown={(e) => {
                  e.preventDefault();
                  applyColor(null);
                }}
                className="ml-0.5 text-muted hover:text-accent transition-colors"
              >
                <X size={10} />
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );

  return createPortal(menu, document.body);
}

function BubbleBtn({
  children,
  active,
  title,
  onClick,
  style,
}: {
  children: React.ReactNode;
  active: boolean;
  title: string;
  onClick: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <button
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      style={style}
      className={cn(
        "px-2.5 h-7 flex items-center justify-center text-xs transition-colors border-r border-border/50 last:border-r-0 flex-shrink-0",
        active
          ? "bg-accent/20 text-accent"
          : "text-muted hover:text-main hover:bg-background/60",
      )}
    >
      {children}
    </button>
  );
}
