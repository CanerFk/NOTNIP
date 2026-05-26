import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Calendar, CheckSquare, Square, Trash2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export function CalendarPanel() {
    const { calendarTodosByDate, updateCalendarTodos, calendarSelectedDate, setCalendarSelectedDate, toggleCalendarModal } = useStore();
    const [inputValue, setInputValue] = useState('');

    const currentTodos = calendarTodosByDate?.[calendarSelectedDate] || [];

    const toggleTodo = (id: string) => {
        updateCalendarTodos(calendarSelectedDate, currentTodos.map(t => t.id === id ? { ...t, done: !t.done } : t));
    };

    const deleteTodo = (id: string) => {
        updateCalendarTodos(calendarSelectedDate, currentTodos.filter(t => t.id !== id));
    };

    const addTodo = () => {
        if (!inputValue.trim()) return;
        updateCalendarTodos(calendarSelectedDate, [...currentTodos, { id: crypto.randomUUID(), text: inputValue.trim(), done: false }]);
        setInputValue('');
    };

    const jumpDay = (offset: number) => {
        const d = new Date(calendarSelectedDate);
        d.setDate(d.getDate() + offset);
        setCalendarSelectedDate(d.toISOString().split('T')[0]);
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = calendarSelectedDate === todayStr;
    const displayDateStr = new Date(calendarSelectedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' });

    return (
        <div className="h-full flex flex-col font-mono text-sm bg-background">
            <div className="p-3 border-b border-border bg-sidebar shrink-0 relative overflow-hidden">
                <div className="flex items-center justify-between z-10 relative">
                    <button onClick={() => jumpDay(-1)} className="p-1 hover:bg-element text-muted hover:text-main transition-colors border border-transparent rounded-sm"><ChevronLeft size={16} /></button>
                    <div className="flex flex-col items-center">
                        <span className={cn("font-bold tracking-wider uppercase text-xs", isToday ? "text-accent" : "text-main")}>
                            {displayDateStr}
                        </span>
                        {isToday && <span className="text-[9px] text-muted -mt-1 font-bold">TODAY</span>}
                    </div>
                    <button onClick={() => jumpDay(1)} className="p-1 hover:bg-element text-muted hover:text-main transition-colors border border-transparent rounded-sm"><ChevronRight size={16} /></button>

                    <button onClick={toggleCalendarModal} title="Open Month View" className="absolute right-0 top-1/2 -translate-y-1/2 p-2 hover:bg-accent text-muted hover:text-white transition-colors border-l border-border hover:shadow-retro-sm active:shadow-none bg-element">
                        <Calendar size={16} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-2">
                {currentTodos.length === 0 ? (
                    <div className="text-center text-muted opacity-50 italic mt-6 text-xs">No tasks for this day...</div>
                ) : (
                    currentTodos.map(todo => (
                        <div key={todo.id} className="group flex items-start gap-2">
                            <button onClick={() => toggleTodo(todo.id)} className="shrink-0 mt-0.5 text-accent hover:text-main transition-colors">
                                {todo.done ? <CheckSquare size={14} /> : <Square size={14} />}
                            </button>
                            <span className={cn("flex-1 text-xs leading-relaxed transition-all break-words", todo.done ? "line-through opacity-40 text-muted" : "text-main")}>
                                {todo.text}
                            </span>
                            <button onClick={() => deleteTodo(todo.id)} className="shrink-0 opacity-0 group-hover:opacity-100 text-muted hover:text-red-500 transition-opacity">
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            <div className="p-2 border-t border-border shrink-0 flex gap-2">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTodo()}
                    placeholder="New task..."
                    className="flex-1 bg-element border border-transparent focus:border-accent text-xs px-2 py-1.5 focus:outline-none transition-colors caret-accent font-mono placeholder:text-muted/50"
                />
                <button onClick={addTodo} className="shrink-0 aspect-square p-1.5 flex items-center justify-center bg-element border border-border hover:bg-accent hover:text-white transition-colors shadow-retro-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]">
                    <Plus size={14} />
                </button>
            </div>
        </div>
    );
}
