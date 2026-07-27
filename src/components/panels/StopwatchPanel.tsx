import { useCallback, useEffect, useState } from "react";
import { Clock3, Flag, Pause, Play, RotateCcw } from "lucide-react";
import { useStore } from "../../store/useStore";
import { cn } from "../../lib/utils";

const SILKSCREEN_STYLE = { fontFamily: '"Silkscreen", monospace' };

function formatElapsed(elapsedMs: number) {
  const safeElapsed = Math.max(0, elapsedMs);
  const hours = Math.floor(safeElapsed / 3_600_000);
  const minutes = Math.floor((safeElapsed % 3_600_000) / 60_000);
  const seconds = Math.floor((safeElapsed % 60_000) / 1_000);
  const centiseconds = Math.floor((safeElapsed % 1_000) / 10);

  return {
    main: [hours, minutes, seconds]
      .map((value) => String(value).padStart(2, "0"))
      .join(":"),
    centiseconds: String(centiseconds).padStart(2, "0"),
  };
}

export function StopwatchPanel() {
  const stopwatchState = useStore((state) => state.stopwatchState);
  const updateStopwatch = useStore((state) => state.updateStopwatch);

  const isRunning = stopwatchState?.isRunning ?? false;
  const startedAt = stopwatchState?.startedAt ?? null;
  const elapsedMs = stopwatchState?.elapsedMs ?? 0;
  const laps = stopwatchState?.laps ?? [];

  const calculateElapsed = useCallback(() => {
    if (!isRunning || startedAt === null) return elapsedMs;
    return elapsedMs + Math.max(0, Date.now() - startedAt);
  }, [elapsedMs, isRunning, startedAt]);

  const [displayElapsed, setDisplayElapsed] = useState(calculateElapsed);

  useEffect(() => {
    setDisplayElapsed(calculateElapsed());
  }, [calculateElapsed]);

  useEffect(() => {
    if (!isRunning) return;

    const intervalId = window.setInterval(() => {
      setDisplayElapsed(calculateElapsed());
    }, 31);

    return () => window.clearInterval(intervalId);
  }, [calculateElapsed, isRunning]);

  const toggle = () => {
    if (isRunning) {
      const pausedAt = calculateElapsed();
      updateStopwatch({
        isRunning: false,
        startedAt: null,
        elapsedMs: pausedAt,
      });
      return;
    }

    updateStopwatch({
      isRunning: true,
      startedAt: Date.now(),
    });
  };

  const addLap = () => {
    if (!isRunning) return;

    updateStopwatch({
      laps: [
        ...laps,
        {
          id: crypto.randomUUID(),
          elapsedMs: calculateElapsed(),
        },
      ],
    });
  };

  const reset = () => {
    updateStopwatch({
      isRunning: false,
      startedAt: null,
      elapsedMs: 0,
      laps: [],
    });
  };

  const formatted = formatElapsed(displayElapsed);
  const lapRows = laps
    .map((lap, index) => ({
      ...lap,
      number: index + 1,
      splitMs: lap.elapsedMs - (index > 0 ? laps[index - 1].elapsedMs : 0),
    }))
    .reverse();

  return (
    <div
      className="h-full flex flex-col bg-[var(--bg-primary)] p-3 pb-2 overflow-hidden"
      style={SILKSCREEN_STYLE}
    >
      <div className="flex items-center justify-between pb-3 border-b-2 border-border">
        <div className="flex items-center gap-2 text-gruv-blue">
          <Clock3 size={18} strokeWidth={2.5} />
          <span className="text-lg leading-none uppercase tracking-widest">
            Stopwatch
          </span>
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 text-[9px] uppercase tracking-widest",
            isRunning ? "text-gruv-green" : "text-muted/60",
          )}
        >
          <span
            className={cn(
              "w-2 h-2 border border-current",
              isRunning && "bg-current animate-pulse",
            )}
          />
          {isRunning ? "Running" : displayElapsed > 0 ? "Paused" : "Ready"}
        </div>
      </div>

      <div className="py-5 flex items-end justify-center text-main select-none">
        <span
          className={cn(
            "text-[2.35rem] leading-none font-bold tracking-tight drop-shadow-[2px_2px_0_var(--shadow-color)] transition-colors",
            isRunning && "text-gruv-green",
          )}
        >
          {formatted.main}
        </span>
        <span className="w-7 pb-0.5 text-sm text-muted">
          .{formatted.centiseconds}
        </span>
      </div>

      <div className="flex gap-2 pb-3">
        <button
          onClick={toggle}
          className="flex-1 h-11 flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest bg-element border-2 border-border hover:bg-gruv-green hover:border-gruv-green hover:text-bg-primary transition-all shadow-[3px_3px_0_0_var(--shadow-color)] active:translate-y-[3px] active:translate-x-[3px] active:shadow-none"
        >
          {isRunning ? (
            <Pause size={15} fill="currentColor" />
          ) : (
            <Play size={15} fill="currentColor" className="ml-0.5" />
          )}
          {isRunning ? "Pause" : displayElapsed > 0 ? "Resume" : "Start"}
        </button>
        <button
          onClick={addLap}
          disabled={!isRunning}
          className="w-11 h-11 flex items-center justify-center bg-element border-2 border-border hover:bg-gruv-blue hover:border-gruv-blue hover:text-bg-primary transition-all shadow-[3px_3px_0_0_var(--shadow-color)] active:translate-y-[3px] active:translate-x-[3px] active:shadow-none disabled:opacity-35 disabled:pointer-events-none"
          title="Record Lap"
          aria-label="Record lap"
        >
          <Flag size={16} strokeWidth={2.5} />
        </button>
        <button
          onClick={reset}
          disabled={displayElapsed === 0 && laps.length === 0}
          className="w-11 h-11 flex items-center justify-center bg-element border-2 border-border hover:bg-gruv-yellow hover:border-gruv-yellow hover:text-bg-primary transition-all shadow-[3px_3px_0_0_var(--shadow-color)] active:translate-y-[3px] active:translate-x-[3px] active:shadow-none disabled:opacity-35 disabled:pointer-events-none"
          title="Reset Stopwatch"
          aria-label="Reset stopwatch"
        >
          <RotateCcw size={16} strokeWidth={2.5} />
        </button>
      </div>

      <div className="min-h-0 flex-1 flex flex-col border-t-2 border-border pt-2">
        <div className="flex items-center justify-between pb-2 text-[10px] uppercase tracking-widest text-muted">
          <span>Laps</span>
          <span className="text-accent">{laps.length}</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar pr-1">
          {lapRows.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[10px] uppercase tracking-widest text-muted/40">
              No laps yet
            </div>
          ) : (
            <div className="space-y-1.5">
              {lapRows.map((lap) => {
                const split = formatElapsed(lap.splitMs);
                const total = formatElapsed(lap.elapsedMs);

                return (
                  <div
                    key={lap.id}
                    className="grid grid-cols-[3rem_1fr_1fr] items-center gap-2 bg-element border border-border px-2 py-1.5 text-[10px]"
                  >
                    <span className="text-gruv-blue">
                      #{String(lap.number).padStart(2, "0")}
                    </span>
                    <span className="text-main">
                      +{split.main}.{split.centiseconds}
                    </span>
                    <span className="text-right text-muted">
                      {total.main}.{total.centiseconds}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
