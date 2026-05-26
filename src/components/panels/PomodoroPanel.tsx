import { useEffect, useRef, useState } from 'react';
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

export function PomodoroPanel() {
    const { pomodoroState, updatePomodoro } = useStore();
    const {
        timeLeft,
        isRunning,
        lastTimestamp,
        mode,
        sessionsCompleted,
        focusDuration,
        shortBreakDuration,
        longBreakDuration
    } = pomodoroState;

    const currentMode = mode || 'work';
    const currentSessions = sessionsCompleted || 0;

    const intervalRef = useRef<number | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        if (isRunning && lastTimestamp) {
            const now = Date.now();
            const elapsedSeconds = Math.floor((now - lastTimestamp) / 1000);
            if (elapsedSeconds > 0) {
                const newTimeLeft = Math.max(0, timeLeft - elapsedSeconds);
                updatePomodoro({
                    timeLeft: newTimeLeft,
                    lastTimestamp: now,
                    isRunning: newTimeLeft > 0
                });
            }
        }
    }, []);

    const cycleNextMode = () => {
        if (currentMode === 'work') {
            const nextSessionVal = currentSessions + 1;
            if (nextSessionVal % 4 === 0) {
                updatePomodoro({ mode: 'longBreak', timeLeft: longBreakDuration || 15 * 60, sessionsCompleted: nextSessionVal });
            } else {
                updatePomodoro({ mode: 'shortBreak', timeLeft: shortBreakDuration || 5 * 60, sessionsCompleted: nextSessionVal });
            }
        } else {
            updatePomodoro({ mode: 'work', timeLeft: focusDuration || 25 * 60 });
        }
    };

    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = window.setInterval(() => {
                const now = Date.now();
                updatePomodoro({
                    timeLeft: timeLeft - 1,
                    lastTimestamp: now
                });
            }, 1000);
        } else if (timeLeft === 0 && isRunning) {
            updatePomodoro({ isRunning: false, lastTimestamp: null });
            cycleNextMode();
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, timeLeft, updatePomodoro, currentMode, currentSessions, focusDuration, shortBreakDuration, longBreakDuration]);

    const toggle = () => {
        updatePomodoro({ isRunning: !isRunning, lastTimestamp: !isRunning ? Date.now() : null });
    };

    const reset = () => {
        const timeVal = currentMode === 'work' ? focusDuration : (currentMode === 'shortBreak' ? shortBreakDuration : longBreakDuration);
        updatePomodoro({
            isRunning: false,
            timeLeft: timeVal || 25 * 60,
            lastTimestamp: null
        });
    };

    const resetSessions = () => {
        updatePomodoro({
            sessionsCompleted: 0,
            mode: 'work',
            timeLeft: focusDuration || 25 * 60,
            isRunning: false,
            lastTimestamp: null
        });
    };

    const applyConfiguration = (newMode: 'work' | 'shortBreak' | 'longBreak', newTime: number) => {
        const upd: any = { isRunning: false, lastTimestamp: null };
        if (newMode === 'work') upd.focusDuration = newTime;
        if (newMode === 'shortBreak') upd.shortBreakDuration = newTime;
        if (newMode === 'longBreak') upd.longBreakDuration = newTime;

        if (currentMode === newMode) {
            upd.timeLeft = newTime;
        }
        updatePomodoro(upd);
    };

    const forceMode = (m: 'work' | 'shortBreak' | 'longBreak') => {
        const timeVal = m === 'work' ? focusDuration : (m === 'shortBreak' ? shortBreakDuration : longBreakDuration);
        updatePomodoro({
            mode: m,
            timeLeft: timeVal || 25 * 60,
            isRunning: false,
            lastTimestamp: null
        });
        setIsSettingsOpen(false);
    };

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

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

                <div className="pt-2 flex gap-4 pb-1 justify-center">
                    <button
                        onClick={toggle}
                        className="w-full max-w-[100px] h-12 flex items-center justify-center font-bold text-xl uppercase tracking-widest bg-element border-3 border-border hover:bg-gruv-green hover:border-gruv-green hover:text-bg-primary transition-all shadow-[4px_4px_0_0_var(--shadow-color)] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none"
                    >
                        {isRunning ? <Square size={18} fill="currentColor" strokeWidth={0} /> : <Play size={20} fill="currentColor" className="ml-0.5" strokeWidth={0} />}
                    </button>
                    <button
                        onClick={reset}
                        className="w-12 h-12 flex items-center justify-center bg-element border-3 border-border hover:bg-gruv-yellow hover:border-gruv-yellow hover:text-bg-primary transition-all shadow-[4px_4px_0_0_var(--shadow-color)] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none"
                    >
                        <RotateCcw size={20} strokeWidth={3} />
                    </button>
                </div>
            </div>

            <div
                className={`absolute inset-0 bg-[var(--bg-primary)] z-10 p-4 flex flex-col transition-transform duration-200 ${isSettingsOpen ? 'translate-x-0' : 'translate-x-full'}`}
                style={{ fontFamily: '"Silkscreen", monospace' }}
            >
                <div className="flex items-center justify-between pb-3 border-b-2 border-border mb-4">
                    <span className="text-xl tracking-widest uppercase flex items-center gap-2 text-accent">
                        <Settings size={18} /> OPTIONS
                    </span>
                    <button
                        onClick={() => setIsSettingsOpen(false)}
                        className="text-muted hover:text-gruv-red transition-colors"
                    >
                        <X size={22} strokeWidth={2} />
                    </button>
                </div>

                <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1">

                    <div className="flex flex-col gap-2">
                        <span className="text-muted text-base tracking-widest uppercase">FOCUS</span>
                        <div className="grid grid-cols-3 gap-2">
                            {[25, 30, 50].map(m => (
                                <button
                                    key={m}
                                    onClick={() => applyConfiguration('work', m * 60)}
                                    className={`py-2 border-2 text-lg font-bold transition-all shadow-[3px_3px_0_0_var(--shadow-color)] active:translate-y-[3px] active:translate-x-[3px] active:shadow-none ${wDur === m * 60 ? 'bg-gruv-red/20 border-gruv-red text-gruv-red' : 'bg-element border-border hover:bg-element/80'}`}
                                >
                                    {m}m
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <span className="text-muted text-base tracking-widest uppercase">BREAKS</span>
                        <div className="flex justify-between items-center bg-element p-2 border-2 border-border shadow-[3px_3px_0_0_var(--shadow-color)]">
                            <span className="text-lg text-gruv-blue flex items-center gap-1"><Coffee size={14} /> Short</span>
                            <div className="flex gap-1">
                                {[5, 10].map(m => (
                                    <button
                                        key={m} onClick={() => applyConfiguration('shortBreak', m * 60)}
                                        className={`px-2 py-0.5 border-2 text-base transition-colors ${sbDur === m * 60 ? 'bg-gruv-blue text-bg-primary border-gruv-blue' : 'border-border hover:border-gruv-blue'}`}
                                    >
                                        {m}m
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-between items-center bg-element p-2 border-2 border-border shadow-[3px_3px_0_0_var(--shadow-color)]">
                            <span className="text-lg text-gruv-purple flex items-center gap-1"><Moon size={14} /> Long</span>
                            <div className="flex gap-1">
                                {[15, 20, 30].map(m => (
                                    <button
                                        key={m} onClick={() => applyConfiguration('longBreak', m * 60)}
                                        className={`px-2 py-0.5 border-2 text-base transition-colors ${lbDur === m * 60 ? 'bg-gruv-purple text-bg-primary border-gruv-purple' : 'border-border hover:border-gruv-purple'}`}
                                    >
                                        {m}m
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <span className="text-muted text-base tracking-widest uppercase">JUMP TO</span>
                        <div className="flex gap-2">
                            <button onClick={() => forceMode('work')} className="flex-1 flex items-center justify-center gap-1 p-2 bg-element border-2 border-border hover:bg-gruv-red hover:text-bg-primary transition-colors text-base">
                                <Briefcase size={14} /> Focus
                            </button>
                            <button onClick={() => forceMode('shortBreak')} className="flex-1 flex items-center justify-center gap-1 p-2 bg-element border-2 border-border hover:bg-gruv-blue hover:text-bg-primary transition-colors text-base">
                                <Coffee size={14} /> Break
                            </button>
                        </div>
                    </div>

                    <button onClick={resetSessions} className="mt-2 flex items-center justify-center gap-1 p-2 border-2 border-dashed border-gruv-red text-gruv-red hover:bg-gruv-red/10 transition-colors text-base tracking-widest">
                        <RefreshCw size={14} /> RESET CYCLES
                    </button>
                </div>
            </div>
        </div>
    );
}
