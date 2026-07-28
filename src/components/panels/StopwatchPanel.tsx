import { useCallback, useEffect, useRef, useState } from "react";
import { Clock3, Flag, Pause, Play, RotateCcw, X } from "lucide-react";
import { useStore } from "../../store/useStore";
import { cn } from "../../lib/utils";

const SILKSCREEN_STYLE = { fontFamily: '"Silkscreen", monospace' };

function formatElapsed(ms: number) {
  const safe = Math.max(0, ms);
  const h = Math.floor(safe / 3_600_000);
  const m = Math.floor((safe % 3_600_000) / 60_000);
  const s = Math.floor((safe % 60_000) / 1_000);
  const cs = Math.floor((safe % 1_000) / 10);
  return {
    main: [h, m, s].map((v) => String(v).padStart(2, "0")).join(":"),
    centiseconds: String(cs).padStart(2, "0"),
  };
}

export function StopwatchPanel() {
  const stopwatchState = useStore((s) => s.stopwatchState);
  const updateStopwatch = useStore((s) => s.updateStopwatch);

  const isRunning = stopwatchState?.isRunning ?? false;
  const startedAt = stopwatchState?.startedAt ?? null;
  const elapsedMs = stopwatchState?.elapsedMs ?? 0;
  const laps = stopwatchState?.laps ?? [];

  const startedAtRef = useRef(startedAt);
  const elapsedMsRef = useRef(elapsedMs);
  const isRunningRef = useRef(isRunning);

  useEffect(() => {
    startedAtRef.current = startedAt;
    elapsedMsRef.current = elapsedMs;
    isRunningRef.current = isRunning;
  });

  const getSnapshotMs = useCallback((): number => {
    if (!isRunningRef.current || startedAtRef.current === null) {
      return elapsedMsRef.current;
    }
    return elapsedMsRef.current + Math.max(0, Date.now() - startedAtRef.current);
  }, []);

  const [displayMs, setDisplayMs] = useState<number>(() =>
    isRunning && startedAt !== null
      ? elapsedMs + Math.max(0, Date.now() - startedAt)
      : elapsedMs,
  );

  useEffect(() => {
    if (!isRunning) {
      setDisplayMs(elapsedMs);
      return;
    }
    const tick = () => {
      if (startedAtRef.current !== null) {
        setDisplayMs(elapsedMsRef.current + Math.max(0, Date.now() - startedAtRef.current));
      }
    };
    tick();
    const id = window.setInterval(tick, 30);
    return () => window.clearInterval(id);
  }, [isRunning, elapsedMs]);

  const toggle = () => {
    if (isRunning) {
      const snapshot = getSnapshotMs();
      updateStopwatch({ isRunning: false, startedAt: null, elapsedMs: snapshot });
    } else {
      updateStopwatch({ isRunning: true, startedAt: Date.now() });
    }
  };

  const addLap = () => {
    const snapshot = getSnapshotMs();
    updateStopwatch({
      laps: [
        ...laps,
        { id: crypto.randomUUID(), elapsedMs: snapshot },
      ],
    });
  };

  const removeLap = (id: string) => {
    updateStopwatch({ laps: laps.filter((l) => l.id !== id) });
  };

  const reset = () => {
    updateStopwatch({ isRunning: false, startedAt: null, elapsedMs: 0, laps: [] });
  };

  const canReset = elapsedMs > 0 || displayMs > 0 || laps.length > 0;
  const canLap = isRunning || (displayMs > 0 && !isRunning);

  const lapRows = laps
    .map((lap, i) => ({
      ...lap,
      number: i + 1,
      splitMs: lap.elapsedMs - (i > 0 ? laps[i - 1].elapsedMs : 0),
    }))
    .reverse();

  const splitTimes = lapRows.map((l) => l.splitMs);
  const fastestSplit = splitTimes.length > 1 ? Math.min(...splitTimes) : null;
  const slowestSplit = splitTimes.length > 1 ? Math.max(...splitTimes) : null;

  const formatted = formatElapsed(displayMs);

  const statusLabel = isRunning ? "Running" : displayMs > 0 ? "Paused" : "Ready";

  return (
    <div
      className="h-full flex flex-col bg-[var(--bg-primary)] overflow-hidden"
      style={SILKSCREEN_STYLE}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b-2 border-border bg-[var(--bg-secondary)] flex-shrink-0">
        <div className="flex items-center gap-2 text-[var(--gruv-blue)]">
          <Clock3 size={15} strokeWidth={2.5} />
          <span className="text-xs leading-none uppercase tracking-widest">
            Stopwatch
          </span>
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 text-[9px] uppercase tracking-widest",
            isRunning ? "text-[var(--gruv-green)]" : "text-[var(--text-muted)]/60",
          )}
        >
          <span
            className={cn(
              "w-1.5 h-1.5 border border-current",
              isRunning && "bg-current animate-pulse",
            )}
          />
          {statusLabel}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center pt-4 pb-3 flex-shrink-0 select-none">
        <div className="flex items-end gap-1">
          <span
            className={cn(
              "text-[2.6rem] leading-none font-bold tracking-tight drop-shadow-[3px_3px_0_var(--shadow-color)] transition-colors duration-150",
              isRunning ? "text-[var(--gruv-green)]" : "text-[var(--text-main)]",
            )}
          >
            {formatted.main}
          </span>
          <span
            className={cn(
              "pb-1 text-base leading-none transition-colors duration-150",
              isRunning ? "text-[var(--gruv-green)]/60" : "text-[var(--text-muted)]/50",
            )}
          >
            .{formatted.centiseconds}
          </span>
        </div>

        {laps.length > 0 && (
          <div className="mt-1 text-[9px] uppercase tracking-widest text-[var(--text-muted)]/50">
            {laps.length} lap{laps.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      <div className="flex gap-2 px-3 pb-3 flex-shrink-0">
        <button
          onClick={toggle}
          className={cn(
            "flex-1 h-9 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-widest border-2 transition-all",
            "shadow-[3px_3px_0_0_var(--shadow-color)] active:translate-y-[3px] active:translate-x-[3px] active:shadow-none",
            isRunning
              ? "bg-[var(--bg-element)] border-[var(--border-color)] hover:bg-[var(--gruv-red)] hover:border-[var(--gruv-red)] hover:text-[var(--bg-primary)]"
              : "bg-[var(--bg-element)] border-[var(--border-color)] hover:bg-[var(--gruv-green)] hover:border-[var(--gruv-green)] hover:text-[var(--bg-primary)]",
          )}
        >
          {isRunning ? (
            <Pause size={13} fill="currentColor" />
          ) : (
            <Play size={13} fill="currentColor" className="ml-0.5" />
          )}
          {isRunning ? "Pause" : displayMs > 0 ? "Resume" : "Start"}
        </button>

        <button
          onClick={addLap}
          disabled={!canLap}
          title="Record Lap"
          aria-label="Record lap"
          className="w-9 h-9 flex items-center justify-center border-2 border-[var(--border-color)] bg-[var(--bg-element)] hover:bg-[var(--gruv-blue)] hover:border-[var(--gruv-blue)] hover:text-[var(--bg-primary)] transition-all shadow-[3px_3px_0_0_var(--shadow-color)] active:translate-y-[3px] active:translate-x-[3px] active:shadow-none disabled:opacity-30 disabled:pointer-events-none"
        >
          <Flag size={13} strokeWidth={2.5} />
        </button>

        <button
          onClick={reset}
          disabled={!canReset}
          title="Reset"
          aria-label="Reset stopwatch"
          className="w-9 h-9 flex items-center justify-center border-2 border-[var(--border-color)] bg-[var(--bg-element)] hover:bg-[var(--gruv-yellow)] hover:border-[var(--gruv-yellow)] hover:text-[var(--bg-primary)] transition-all shadow-[3px_3px_0_0_var(--shadow-color)] active:translate-y-[3px] active:translate-x-[3px] active:shadow-none disabled:opacity-30 disabled:pointer-events-none"
        >
          <RotateCcw size={13} strokeWidth={2.5} />
        </button>
      </div>

      <div className="min-h-0 flex-1 flex flex-col border-t-2 border-border overflow-hidden">
        <div className="flex items-center justify-between px-3 pt-1.5 pb-1 text-[9px] uppercase tracking-widest flex-shrink-0">
          <span className="text-[var(--text-muted)]/60">Laps</span>
          {laps.length > 0 && (
            <div className="flex items-center gap-2 text-[var(--text-muted)]/50">
              <span className="text-[var(--gruv-green)]">
                F {fastestSplit !== null ? formatElapsed(fastestSplit).main : "--"}
              </span>
              <span className="text-[var(--gruv-red)]">
                S {slowestSplit !== null ? formatElapsed(slowestSplit).main : "--"}
              </span>
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar px-3 pb-2">
          {lapRows.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[9px] uppercase tracking-widest text-[var(--text-muted)]/30">
              No laps recorded
            </div>
          ) : (
            <div className="space-y-1">
              {lapRows.map((lap) => {
                const split = formatElapsed(lap.splitMs);
                const total = formatElapsed(lap.elapsedMs);
                const isFastest = fastestSplit !== null && lap.splitMs === fastestSplit;
                const isSlowest = slowestSplit !== null && lap.splitMs === slowestSplit;

                return (
                  <div
                    key={lap.id}
                    className={cn(
                      "grid items-center gap-1 bg-[var(--bg-element)] border px-2 py-1 text-[9px] transition-colors group",
                      isFastest && "border-[var(--gruv-green)]/60",
                      isSlowest && "border-[var(--gruv-red)]/60",
                      !isFastest && !isSlowest && "border-[var(--border-color)]",
                    )}
                    style={{ gridTemplateColumns: "2.4rem 1fr 1fr auto" }}
                  >
                    <span
                      className={cn(
                        "font-bold",
                        isFastest && "text-[var(--gruv-green)]",
                        isSlowest && "text-[var(--gruv-red)]",
                        !isFastest && !isSlowest && "text-[var(--gruv-blue)]",
                      )}
                    >
                      #{String(lap.number).padStart(2, "0")}
                    </span>
                    <span className="text-[var(--text-main)]">
                      +{split.main}
                      <span className="text-[var(--text-muted)]/50">.{split.centiseconds}</span>
                    </span>
                    <span className="text-[var(--text-muted)]/70">
                      {total.main}
                      <span className="text-[var(--text-muted)]/40">.{total.centiseconds}</span>
                    </span>
                    <button
                      onClick={() => removeLap(lap.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-muted)]/40 hover:text-[var(--gruv-red)] p-0.5"
                      title="Remove lap"
                      aria-label="Remove lap"
                    >
                      <X size={9} strokeWidth={3} />
                    </button>
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
