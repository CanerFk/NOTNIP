import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Square, Coffee, Briefcase, Moon, Settings, X, RefreshCw, RotateCcw } from 'lucide-react';
import { useStore } from '../../store/useStore';

const COLOR_MAP = {
    work: 'var(--gruv-red)',
    shortBreak: 'var(--gruv-blue)',
    longBreak: 'var(--gruv-purple)'
};

const MODE_ICONS = {
    work: Briefcase,
    shortBreak: Coffee,
    longBreak: Moon
};

function getDurationForMode(mode: string, focusDuration: number, shortBreakDuration: number, longBreakDuration: number): number {
    if (mode === 'work') return focusDuration || 25 * 60;
    if (mode === 'shortBreak') return shortBreakDuration || 5 * 60;
    return longBreakDuration || 15 * 60;
}

export function PomodoroPanel() {
    const pomodoroState = useStore(state => state.pomodoroState);
    const updatePomodoro = useStore(state => state.updatePomodoro);

    const {
        isRunning,
        startedAt,
        pausedRemaining,
        mode,
        sessionsCompleted,
        focusDuration,
        shortBreakDuration,
        longBreakDuration
    } = pomodoroState;

    const currentMode = mode || 'work';
    const currentSessions = sessionsCompleted || 0;
    const totalDuration = getDurationForMode(currentMode, focusDuration, shortBreakDuration, longBreakDuration);

    const computeTimeLeft = useCallback((): number => {
        if (!isRunning || startedAt === null) {
            return pausedRemaining !== null ? pausedRemaining : totalDuration;
        }
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        return Math.max(0, totalDuration - elapsed);
    }, [isRunning, startedAt, pausedRemaining, totalDuration]);

    const [displayTime, setDisplayTime] = useState(computeTimeLeft);
    const intervalRef = useRef<number | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        setDisplayTime(computeTimeLeft());
    }, [computeTimeLeft]);

    useEffect(() => {
        if (!isRunning) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        intervalRef.current = window.setInterval(() => {
            const remaining = computeTimeLeft();
            setDisplayTime(remaining);

            if (remaining <= 0) {
                if (intervalRef.current) clearInterval(intervalRef.current);
                intervalRef.current = null;

                if (currentMode === 'work') {
                    const nextSession = currentSessions + 1;
                    const isLong = nextSession % 4 === 0;
                    const nextMode = isLong ? 'longBreak' : 'shortBreak';
                    updatePomodoro({
                        isRunning: false,
                        startedAt: null,
                        pausedRemaining: null,
                        sessionsCompleted: nextSession,
                        mode: nextMode
                    });
                } else {
                    updatePomodoro({
                        isRunning: false,
                        startedAt: null,
                        pausedRemaining: null,
                        mode: 'work'
                    });
                }
            }
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isRunning, computeTimeLeft, currentMode, currentSessions, updatePomodoro]);

    const toggle = () => {
        if (isRunning) {
            const remaining = computeTimeLeft();
            updatePomodoro({
                isRunning: false,
                startedAt: null,
                pausedRemaining: remaining
            });
        } else {
            const remaining = pausedRemaining !== null ? pausedRemaining : totalDuration;
            const now = Date.now();
            updatePomodoro({
                isRunning: true,
                startedAt: now - ((totalDuration - remaining) * 1000),
                pausedRemaining: null
            });
        }
    };

    const reset = () => {
        updatePomodoro({
            isRunning: false,
            startedAt: null,
            pausedRemaining: null
        });
    };

    const resetSessions = () => {
        updatePomodoro({
            sessionsCompleted: 0,
            mode: 'work',
            isRunning: false,
            startedAt: null,
            pausedRemaining: null
        });
    };

    const applyConfiguration = (newMode: 'work' | 'shortBreak' | 'longBreak', newTime: number) => {
        const upd: any = { isRunning: false, startedAt: null, pausedRemaining: null };
        if (newMode === 'work') upd.focusDuration = newTime;
        if (newMode === 'shortBreak') upd.shortBreakDuration = newTime;
        if (newMode === 'longBreak') upd.longBreakDuration = newTime;
        updatePomodoro(upd);
    };

    const forceMode = (m: 'work' | 'shortBreak' | 'longBreak') => {
        updatePomodoro({
            mode: m,
            isRunning: false,
            startedAt: null,
            pausedRemaining: null
        });
        setIsSettingsOpen(false);
    };

    const minutes = Math.floor(displayTime / 60);
    const seconds = displayTime % 60;

    const wDur = focusDuration || 25 * 60;
    const sbDur = shortBreakDuration || 5 * 60;
    const lbDur = longBreakDuration || 15 * 60;

    const ActiveIcon = MODE_ICONS[currentMode as keyof typeof MODE_ICONS] || Briefcase;

    return (
        <div className="relative flex flex-col h-full bg-[var(--bg-primary)] overflow-hidden" style={{ fontFamily: '"Silkscreen", monospace' }}>
            <div className="flex flex-col h-full z-0 p-3 pb-2">

                <div className="flex items-center justify-between opacity-90 select-none pb-3 border-b-2 border-border mb-2">
                    <div className="flex items-center gap-2 drop-shadow-sm transition-colors duration-300" style={{ color: COLOR_MAP[currentMode as keyof typeof COLOR_MAP] }}>
                        <ActiveIcon size={18} strokeWidth={2.5} />
                        <span className="text-xl leading-none uppercase tracking-widest translate-y-[1px]">
                            {currentMode === 'work' ? 'FOCUS' : currentMode === 'shortBreak' ? 'SHORT BREAK' : 'LONG BREAK'}
                        </span>
                    </div>
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="text-muted hover:text-main transition-colors"
                    >
                        <Settings size={18} strokeWidth={2} />
                    </button>
                </div>

                <div className="text-base text-muted/60 tracking-widest uppercase flex items-center justify-between mb-1">
                    <span>CYCLES</span>
                    <span className="font-bold text-accent text-lg">{currentSessions}</span>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="text-[3.5rem] leading-[1] font-bold tracking-[0.02em] drop-shadow-[2px_2px_0_var(--shadow-color)] select-none transition-colors duration-500"
                        style={{ color: isRunning ? 'var(--gruv-green)' : 'var(--text-main)' }}>
                        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </div>
                </div>

                <div className="pt-2 flex gap-2 pb-1">
                    <button
                        onClick={toggle}
                        className="flex-1 h-11 flex items-center justify-center gap-2 font-bold text-sm uppercase tracking-widest bg-element border-2 border-border hover:bg-gruv-green hover:border-gruv-green hover:text-bg-primary transition-all shadow-[3px_3px_0_0_var(--shadow-color)] active:translate-y-[3px] active:translate-x-[3px] active:shadow-none"
                    >
                        {isRunning ? <Square size={14} fill="currentColor" strokeWidth={0} /> : <Play size={16} fill="currentColor" className="ml-0.5" strokeWidth={0} />}
                        <span>{isRunning ? 'PAUSE' : 'START'}</span>
                    </button>
                    <button
                        onClick={reset}
                        className="w-11 h-11 flex-shrink-0 flex items-center justify-center bg-element border-2 border-border hover:bg-gruv-yellow hover:border-gruv-yellow hover:text-bg-primary transition-all shadow-[3px_3px_0_0_var(--shadow-color)] active:translate-y-[3px] active:translate-x-[3px] active:shadow-none"
                        title="Reset Timer"
                    >
                        <RotateCcw size={16} strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            <div
                className={`absolute inset-0 bg-[var(--bg-primary)] z-10 p-3 flex flex-col transition-transform duration-200 ${isSettingsOpen ? 'translate-x-0' : 'translate-x-full'}`}
                style={{ fontFamily: '"Silkscreen", monospace' }}
            >
                <div className="flex items-center justify-between pb-2 border-b-2 border-border mb-2">
                    <span className="text-base tracking-widest uppercase flex items-center gap-1.5 text-accent">
                        <Settings size={14} /> OPTIONS
                    </span>
                    <button
                        onClick={() => setIsSettingsOpen(false)}
                        className="text-muted hover:text-gruv-red transition-colors"
                    >
                        <X size={18} strokeWidth={2} />
                    </button>
                </div>

                <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto custom-scrollbar pr-1">

                    <div className="flex flex-col gap-1.5">
                        <span className="text-muted text-[10px] tracking-widest uppercase">FOCUS</span>
                        <div className="grid grid-cols-3 gap-1.5">
                            {[25, 30, 50].map(m => (
                                <button
                                    key={m}
                                    onClick={() => applyConfiguration('work', m * 60)}
                                    className={`py-1.5 border-2 text-sm font-bold transition-all shadow-[2px_2px_0_0_var(--shadow-color)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none ${wDur === m * 60 ? 'bg-gruv-red/20 border-gruv-red text-gruv-red' : 'bg-element border-border hover:bg-element/80'}`}
                                >
                                    {m}m
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <span className="text-muted text-[10px] tracking-widest uppercase">BREAKS</span>
                        <div className="flex justify-between items-center bg-element px-2 py-1.5 border-2 border-border shadow-[2px_2px_0_0_var(--shadow-color)]">
                            <span className="text-sm text-gruv-blue flex items-center gap-1"><Coffee size={12} /> Short</span>
                            <div className="flex gap-1">
                                {[5, 10].map(m => (
                                    <button
                                        key={m} onClick={() => applyConfiguration('shortBreak', m * 60)}
                                        className={`px-2 py-0.5 border-2 text-xs transition-colors ${sbDur === m * 60 ? 'bg-gruv-blue text-bg-primary border-gruv-blue' : 'border-border hover:border-gruv-blue'}`}
                                    >
                                        {m}m
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-between items-center bg-element px-2 py-1.5 border-2 border-border shadow-[2px_2px_0_0_var(--shadow-color)]">
                            <span className="text-sm text-gruv-purple flex items-center gap-1"><Moon size={12} /> Long</span>
                            <div className="flex gap-1">
                                {[15, 20, 30].map(m => (
                                    <button
                                        key={m} onClick={() => applyConfiguration('longBreak', m * 60)}
                                        className={`px-2 py-0.5 border-2 text-xs transition-colors ${lbDur === m * 60 ? 'bg-gruv-purple text-bg-primary border-gruv-purple' : 'border-border hover:border-gruv-purple'}`}
                                    >
                                        {m}m
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <span className="text-muted text-[10px] tracking-widest uppercase">JUMP TO</span>
                        <div className="flex gap-1.5">
                            <button onClick={() => forceMode('work')} className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-element border-2 border-border hover:bg-gruv-red hover:text-bg-primary transition-colors text-xs">
                                <Briefcase size={12} /> Focus
                            </button>
                            <button onClick={() => forceMode('shortBreak')} className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-element border-2 border-border hover:bg-gruv-blue hover:text-bg-primary transition-colors text-xs">
                                <Coffee size={12} /> Break
                            </button>
                        </div>
                    </div>

                    <button onClick={resetSessions} className="mt-auto flex items-center justify-center gap-1 py-1.5 px-2 border-2 border-dashed border-gruv-red text-gruv-red hover:bg-gruv-red/10 transition-colors text-xs tracking-widest">
                        <RefreshCw size={12} /> RESET CYCLES
                    </button>
                </div>
            </div>
        </div>
    );
}
