import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDeleteModal({ isOpen, title, message, onConfirm, onCancel }: ConfirmDeleteModalProps) {
    const [isClosing, setIsClosing] = useState(false);

    if (!isOpen) return null;

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

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60">
            <div className={cn(
                "w-[360px] bg-background border-2 border-border shadow-retro flex flex-col",
                isClosing ? "animate-retro-shutter-close" : "animate-retro-shutter"
            )}>
                {/* Titlebar */}
                <div className="h-7 bg-element flex items-center justify-between px-2 border-b border-border select-none">
                    <span className="text-xs font-mono font-bold text-main uppercase tracking-wider">
                        {title}
                    </span>
                    <button
                        onClick={handleCancel}
                        className="w-5 h-5 flex items-center justify-center border-l border-border bg-element hover:bg-red-500 hover:text-white transition-all"
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 flex items-start gap-3">
                    <AlertTriangle size={24} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-main font-mono">{message}</p>
                </div>

                {/* Buttons */}
                <div className="p-3 border-t border-border flex justify-end gap-2">
                    <button
                        onClick={handleCancel}
                        className="px-4 py-1.5 text-xs font-mono font-bold bg-element border border-border hover:bg-muted transition-colors"
                    >
                        CANCEL
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-1.5 text-xs font-mono font-bold bg-red-600 text-white border border-red-700 hover:bg-red-700 transition-colors"
                    >
                        DELETE
                    </button>
                </div>
            </div>
        </div>
    );
}
