import { useState, useEffect, useRef } from "react";
import { X, AlertTriangle } from "lucide-react";
import { cn } from "../../lib/utils";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDeleteModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      cancelBtnRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCancel = () => {
    if (isSubmittingRef.current) return;
    onCancel();
  };

  const handleConfirm = () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    void (async () => {
      try {
        await onConfirm();
      } catch {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    })();
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
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60"
      onKeyDown={handleKeyDown}
    >
      <div
        className={cn(
          "w-[360px] bg-background border-2 border-border shadow-retro flex flex-col",
          "animate-retro-shutter",
        )}
        aria-busy={isSubmitting}
      >
        {/* Titlebar */}
        <div className="h-7 bg-element flex items-center justify-between px-2 border-b border-border select-none">
          <span className="text-xs font-mono font-bold text-main uppercase tracking-wider">
            {title}
          </span>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="w-5 h-5 flex items-center justify-center border-l border-border bg-element hover:bg-red-500 hover:text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}

        <div className="p-4 flex items-start gap-3">
          <AlertTriangle
            size={24}
            className="text-yellow-500 flex-shrink-0 mt-0.5"
          />
          <p className="text-sm text-main font-mono">{message}</p>
        </div>

        {/* Buttons - Cancel is default focused so Enter does not accidentally delete */}
        <div className="p-3 border-t border-border flex justify-end gap-2">
          <button
            type="button"
            ref={cancelBtnRef}
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-4 py-1.5 text-xs font-mono font-bold bg-element border border-border hover:bg-muted transition-colors focus:outline focus:outline-2 focus:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-4 py-1.5 text-xs font-mono font-bold bg-red-600 text-white border border-red-700 hover:bg-red-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "DELETING..." : "DELETE"}
          </button>
        </div>
      </div>
    </div>
  );
}
