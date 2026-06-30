import { useState, useEffect, useRef } from "react";
import { X, ChevronUp, ChevronDown, Search, Replace } from "lucide-react";
import type { Editor } from "@tiptap/react";

interface SearchBarProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
}

export function SearchBar({ editor, isOpen, onClose }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [matchInfo, setMatchInfo] = useState({ count: 0, activeIndex: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    } else {
      setSearchTerm("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    editor.commands.setSearchTerm(searchTerm);
  }, [searchTerm, editor, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const updateMatchInfo = () => {
      const storage = (editor.storage as any).searchAndReplace;
      if (storage) {
        setMatchInfo({
          count: storage.results?.length || 0,
          activeIndex: storage.activeIndex || 0,
        });
      }
    };

    updateMatchInfo();
    editor.on("transaction", updateMatchInfo);
    return () => {
      editor.off("transaction", updateMatchInfo);
    };
  }, [editor, isOpen]);

  useEffect(() => {
    if (!isOpen || matchInfo.count === 0) return;
    requestAnimationFrame(() => {
      const activeEl = document.querySelector(".search-highlight-active");
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }
    });
  }, [matchInfo.activeIndex, matchInfo.count, isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleClose = () => {
    setSearchTerm("");
    editor.commands.clearSearch();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      handleClose();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        editor.commands.goToPrevMatch();
      } else {
        editor.commands.goToNextMatch();
      }
    }
  };

  const handleReplaceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      handleClose();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        handleReplaceAll();
      } else {
        handleReplace();
      }
    }
  };

  const handleReplace = () => {
    if (matchInfo.count > 0) {
      editor.commands.replaceCurrent(replaceTerm);
    }
  };

  const handleReplaceAll = () => {
    if (matchInfo.count > 0) {
      editor.commands.replaceAll(replaceTerm);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`search-bar-container ${isOpen ? "search-bar-open" : ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="search-bar-row">
        <div className="search-input-wrapper">
          <Search size={14} className="text-gruv-orange" />
          <input
            ref={inputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Find in page..."
            spellCheck={false}
          />
          <span className="search-counter">
            {searchTerm
              ? `${matchInfo.count > 0 ? matchInfo.activeIndex + 1 : 0}/${matchInfo.count}`
              : ""}
          </span>
        </div>
        <div className="search-actions">
          <button
            onClick={() => editor.commands.goToPrevMatch()}
            className="search-btn"
            title="Previous (Shift+Enter)"
            disabled={matchInfo.count === 0}
          >
            <ChevronUp size={14} />
          </button>
          <button
            onClick={() => editor.commands.goToNextMatch()}
            className="search-btn"
            title="Next (Enter)"
            disabled={matchInfo.count === 0}
          >
            <ChevronDown size={14} />
          </button>
          <button
            onClick={handleClose}
            className="search-btn search-close-btn ml-1"
            title="Close (Escape)"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="search-bar-row">
        <div className="search-input-wrapper">
          <Replace size={14} className="text-gruv-blue" />
          <input
            value={replaceTerm}
            onChange={(e) => setReplaceTerm(e.target.value)}
            onKeyDown={handleReplaceKeyDown}
            placeholder="Replace with..."
            spellCheck={false}
          />
        </div>
        <div className="search-actions">
          <button
            onClick={handleReplace}
            className="search-btn search-btn-text replace-hover"
            title="Replace (Enter)"
            disabled={matchInfo.count === 0}
          >
            Rep
          </button>
          <button
            onClick={handleReplaceAll}
            className="search-btn search-btn-text replace-hover"
            title="Replace All (Shift+Enter)"
            disabled={matchInfo.count === 0}
          >
            All
          </button>
        </div>
      </div>
    </div>
  );
}
