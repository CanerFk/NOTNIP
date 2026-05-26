import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export function FullCalendarModal() {
    const { isCalendarModalOpen, toggleCalendarModal, calendarSelectedDate, setCalendarSelectedDate, calendarTodosByDate } = useStore();

    // UI Local State for month viewed
    const [viewDate, setViewDate] = useState(new Date(calendarSelectedDate));

    if (!isCalendarModalOpen) return null;

    const currentMonth = viewDate.getMonth();
    const currentYear = viewDate.getFullYear();

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    // Adjust Sunday to be end of week if needed, or 0=Sunday
    const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const monthStr = viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

    const handleDayClick = (dayNumber: number) => {
        const newDate = new Date(currentYear, currentMonth, dayNumber);
        // Format strictly to YYYY-MM-DD
        const y = newDate.getFullYear();
        const m = String(newDate.getMonth() + 1).padStart(2, '0');
        const d = String(newDate.getDate()).padStart(2, '0');

        setCalendarSelectedDate(`${y}-${m}-${d}`);
        toggleCalendarModal(); // Auto-close
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) toggleCalendarModal();
    };

    const nextMonth = () => setViewDate(new Date(currentYear, currentMonth + 1, 1));
    const prevMonth = () => setViewDate(new Date(currentYear, currentMonth - 1, 1));
    const goToday = () => {
        const today = new Date();
        setViewDate(today);
        setCalendarSelectedDate(today.toISOString().split('T')[0]);
        toggleCalendarModal();
    };

    // Today strict calculation
    const todayStr = new Date().toISOString().split('T')[0];

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 p-4 animate-in fade-in duration-200"
            onClick={handleOverlayClick}
        >
            <div className="bg-element border-2 border-border shadow-retro max-w-lg w-full flex flex-col font-mono animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b-2 border-border bg-sidebar">
                    <div className="flex items-center gap-2">
                        <CalendarIcon size={18} className="text-accent" />
                        <h2 className="font-bold text-sm tracking-widest uppercase">Planning Calendar</h2>
                    </div>
                    <button
                        onClick={toggleCalendarModal}
                        className="text-muted hover:text-red-500 transition-colors p-1"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Calendar Body */}
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={prevMonth} className="px-3 py-1.5 bg-background border border-border hover:bg-accent hover:text-white transition-colors shadow-retro-sm active:shadow-none">
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-lg font-bold tracking-widest uppercase">{monthStr}</span>
                        <button onClick={nextMonth} className="px-3 py-1.5 bg-background border border-border hover:bg-accent hover:text-white transition-colors shadow-retro-sm active:shadow-none">
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-muted uppercase tracking-widest">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                            <div key={d}>{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {/* Empty offset squares */}
                        {Array.from({ length: offset }).map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-square border border-transparent opacity-20 bg-sidebar" />
                        ))}

                        {/* Days */}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const dayNum = i + 1;

                            // Build key str
                            const y = currentYear;
                            const m = String(currentMonth + 1).padStart(2, '0');
                            const d = String(dayNum).padStart(2, '0');
                            const dateKey = `${y}-${m}-${d}`;

                            const isSelected = dateKey === calendarSelectedDate;
                            const isToday = dateKey === todayStr;

                            const dayTodos = calendarTodosByDate[dateKey] || [];
                            const displayTodos = dayTodos.slice(0, 5);

                            return (
                                <button
                                    key={dayNum}
                                    onClick={() => handleDayClick(dayNum)}
                                    className={cn(
                                        "aspect-square flex flex-col items-center justify-center relative border transition-all shadow-retro-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]",
                                        isSelected ? "border-accent bg-accent/10" : "border-border bg-background hover:bg-sidebar",
                                        isToday && !isSelected && "border-white bg-white/5"
                                    )}
                                >
                                    <span className={cn(
                                        "text-sm font-bold",
                                        isSelected ? "text-accent" : (isToday ? "text-white" : "text-main")
                                    )}>
                                        {dayNum}
                                    </span>
                                    {displayTodos.length > 0 && (
                                        <div className="absolute bottom-1 right-1 flex gap-[2px] max-w-[80%] flex-wrap justify-end">
                                            {displayTodos.map((t, idx) => (
                                                <div
                                                    key={idx}
                                                    className={cn("w-1.5 h-1.5", t.done ? "bg-[#b8bb26]" : "bg-[#fe8019]")}
                                                    title={t.text}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-8 flex justify-between items-center">
                        <div className="text-xs text-muted flex items-center gap-2">
                            <div className="w-2 h-2 bg-gruv-aqua rounded-full" /> Tasks Pending
                        </div>
                        <button onClick={goToday} className="px-4 py-1.5 text-xs font-bold uppercase tracking-widest bg-element border border-border hover:border-accent hover:text-accent transition-colors shadow-retro-sm active:shadow-none">
                            Go to Today
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
