import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Plus, X } from 'lucide-react';

const NOTE_COLORS = [
    'var(--gruv-yellow)',
    'var(--gruv-blue)',
    'var(--gruv-green)',
    'var(--gruv-purple)',
    'var(--gruv-aqua)',
    'var(--gruv-red)',
    'var(--gruv-orange)',
];

function getColorForIndex(idx: number) {
    return NOTE_COLORS[idx % NOTE_COLORS.length];
}

function truncatePreview(text: string, maxLen: number = 12): string {
    const firstLine = text.split('\n')[0];
    if (firstLine.length <= maxLen) return firstLine;
    return firstLine.slice(0, maxLen) + '...';
}

export function QuickNotePanel() {
    const { quickNotes, addQuickNote, removeQuickNote, updateQuickNoteText } = useStore();
    const [inputValue, setInputValue] = useState('');
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

    const handleAdd = () => {
        if (inputValue.trim()) {
            addQuickNote(inputValue.trim());
            setInputValue('');
        }
    };

    const notesList = quickNotes || [];
    const activeNote = activeNoteId ? notesList.find(n => n.id === activeNoteId) : null;

    return (
        <div className="h-full flex flex-col bg-[var(--bg-primary)] font-mono text-sm overflow-hidden">

            {activeNote ? (
                <div className="flex flex-col h-full p-3 gap-2">
                    <div className="flex items-center justify-between pb-2 border-b-2 border-border">
                        <button
                            onClick={() => setActiveNoteId(null)}
                            className="text-muted hover:text-main text-xs uppercase tracking-widest transition-colors"
                        >
                            &lt; BACK
                        </button>
                        <button
                            onClick={() => { removeQuickNote(activeNote.id); setActiveNoteId(null); }}
                            className="text-muted hover:text-gruv-red transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    <textarea
                        value={activeNote.text}
                        onChange={(e) => updateQuickNoteText(activeNote.id, e.target.value)}
                        className="flex-1 w-full bg-transparent text-main text-[13px] leading-relaxed p-1 resize-none focus:outline-none custom-scrollbar"
                    />
                    <div className="text-[10px] text-muted/50 text-right pt-1 border-t border-border/50">
                        {new Date(activeNote.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col h-full p-3 gap-3">
                    <div className="flex gap-2">
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd(); } }}
                            placeholder="Drop a thought..."
                            rows={2}
                            className="flex-1 bg-element border-2 border-border p-2 text-main placeholder:text-muted/40 focus:outline-none focus:border-accent transition-colors shadow-[2px_2px_0_0_var(--shadow-color)] resize-none text-[13px]"
                        />
                        <button
                            onClick={handleAdd}
                            className="self-end bg-element border-2 border-border text-accent px-2.5 py-2 font-bold hover:bg-accent hover:text-[var(--bg-primary)] transition-colors shadow-[2px_2px_0_0_var(--shadow-color)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
                        >
                            <Plus size={16} strokeWidth={3} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {notesList.length === 0 && (
                            <div className="text-muted/40 text-center mt-8 text-xs tracking-widest uppercase">No notes yet</div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                            {notesList.map((note, idx) => {
                                const dotColor = getColorForIndex(idx);
                                return (
                                    <button
                                        key={note.id}
                                        onClick={() => setActiveNoteId(note.id)}
                                        className="group relative text-left bg-element border-2 border-border p-2.5 hover:border-accent transition-colors shadow-[3px_3px_0_0_var(--shadow-color)] active:translate-y-[3px] active:translate-x-[3px] active:shadow-none"
                                    >
                                        <div className="flex items-start gap-2">
                                            <span
                                                className="inline-block w-2 h-2 mt-0.5 shrink-0"
                                                style={{ backgroundColor: dotColor }}
                                            />
                                            <span className="text-main text-[12px] leading-tight overflow-hidden">
                                                {truncatePreview(note.text)}
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeQuickNote(note.id); }}
                                            className="absolute top-1 right-1 text-muted hover:text-gruv-red transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <X size={12} />
                                        </button>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
