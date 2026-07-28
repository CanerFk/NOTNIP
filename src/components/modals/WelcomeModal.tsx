import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useStore } from "../../store/useStore";
import { cn } from "../../lib/utils";

const STEPS = [
  {
    id: "commands",
    label: "Commands",
    headline: "The Slash Menu & Flags",
    body: "Type \"/\" on any blank line to open the command palette. Notnip's real power comes from flags — type a dash after a command to instantly customize it. For example, \"/h1 -c\" creates a heading and opens the color picker.",
    keys: [
      { keys: ["/"], desc: "Open command palette" },
      { keys: ["-"], desc: "Add a flag to a command (e.g. /list -t)" },
    ],
    visual: "commands",
  },
  {
    id: "panels",
    label: "Applets",
    headline: "Floating Panels",
    body: "Notnip isn't just a text editor. It includes built-in applets like a Pomodoro Timer, Quick Notes, and Calendar. They run in independent, draggable panels so you can manage your workflow without leaving your current page.",
    keys: [],
    visual: "panels",
  },
  {
    id: "structure",
    label: "Structure",
    headline: "Infinite Organization",
    body: "Keep your workspace perfectly organized. Type \"/subpage\" to nest a new document right where your cursor is. Need a specific format? Use \"/Template\" to instantly inject pre-built structures into your page.",
    keys: [
      { keys: ["Ctrl", "P"], desc: "Quick Switcher — jump anywhere instantly" },
    ],
    visual: "structure",
  },
  {
    id: "done",
    label: "Done",
    headline: "You're all set",
    body: "That's the core of Notnip. You can revisit this Quick Tour or read the full documentation detailing every block, flag, and shortcut in Settings > Guide.",
    keys: [],
    visual: "done",
  },
] as const;

type VisualKey = (typeof STEPS)[number]["visual"];

const VISUAL_COMMANDS = (
  <svg viewBox="0 0 200 130" className="w-full h-full" aria-hidden="true">
    <rect x="0" y="0" width="200" height="130" fill="var(--bg-primary)" />
    {/* Editor background lines */}
    <rect x="20" y="20" width="100" height="8" rx="1" fill="var(--accent)" opacity="0.4" />
    <rect x="20" y="40" width="160" height="6" rx="1" fill="var(--text-main)" opacity="0.2" />
    <rect x="20" y="52" width="140" height="6" rx="1" fill="var(--text-main)" opacity="0.2" />
    
    {/* The slash query */}
    <rect x="20" y="68" width="12" height="8" rx="1" fill="var(--gruv-green)" opacity="0.8" />
    <rect x="36" y="68" width="24" height="8" rx="1" fill="var(--text-main)" opacity="0.8" />
    {/* The flag */}
    <rect x="64" y="68" width="16" height="8" rx="1" fill="var(--gruv-orange)" opacity="0.9" />
    
    {/* Command Menu Popup */}
    <rect x="20" y="82" width="100" height="40" rx="2" fill="var(--bg-secondary)" stroke="var(--border-color)" strokeWidth="1" />
    {/* Selected Item */}
    <rect x="22" y="84" width="96" height="14" rx="1" fill="var(--accent)" opacity="0.8" />
    <rect x="26" y="88" width="8" height="6" rx="1" fill="var(--bg-primary)" />
    <rect x="40" y="89" width="40" height="4" rx="1" fill="var(--bg-primary)" opacity="0.9" />
    {/* Other Item */}
    <rect x="26" y="104" width="8" height="6" rx="1" fill="var(--text-muted)" opacity="0.5" />
    <rect x="40" y="105" width="30" height="4" rx="1" fill="var(--text-main)" opacity="0.5" />
  </svg>
);

const VISUAL_PANELS = (
  <svg viewBox="0 0 200 130" className="w-full h-full" aria-hidden="true">
    <rect x="0" y="0" width="200" height="130" fill="var(--bg-primary)" />
    {/* Background Editor */}
    <rect x="20" y="20" width="120" height="6" rx="1" fill="var(--text-main)" opacity="0.2" />
    <rect x="20" y="32" width="100" height="6" rx="1" fill="var(--text-main)" opacity="0.2" />
    <rect x="20" y="44" width="140" height="6" rx="1" fill="var(--text-main)" opacity="0.2" />
    
    {/* Floating Panel 1 (Pomodoro) */}
    <g transform="translate(110, 15)">
      <rect x="0" y="0" width="70" height="50" rx="3" fill="var(--bg-secondary)" stroke="var(--border-color)" strokeWidth="1" />
      <rect x="0" y="0" width="70" height="12" fill="var(--bg-element)" rx="2" />
      <circle cx="35" cy="32" r="12" fill="none" stroke="var(--gruv-red)" strokeWidth="3" opacity="0.8" />
      <circle cx="35" cy="32" r="12" fill="none" stroke="var(--gruv-red)" strokeWidth="3" strokeDasharray="40 75" />
      <rect x="58" y="4" width="8" height="4" rx="1" fill="var(--text-muted)" opacity="0.5" />
    </g>

    {/* Floating Panel 2 (Quick Note) */}
    <g transform="translate(60, 60)">
      <rect x="0" y="0" width="80" height="60" rx="3" fill="var(--bg-secondary)" stroke="var(--border-color)" strokeWidth="1" />
      <rect x="0" y="0" width="80" height="12" fill="var(--gruv-yellow)" opacity="0.2" rx="2" />
      <rect x="6" y="4" width="20" height="4" rx="1" fill="var(--gruv-yellow)" opacity="0.8" />
      <rect x="8" y="22" width="64" height="4" rx="1" fill="var(--text-main)" opacity="0.5" />
      <rect x="8" y="30" width="54" height="4" rx="1" fill="var(--text-main)" opacity="0.5" />
      <rect x="8" y="38" width="40" height="4" rx="1" fill="var(--text-main)" opacity="0.5" />
    </g>
  </svg>
);

const VISUAL_STRUCTURE = (
  <svg viewBox="0 0 200 130" className="w-full h-full" aria-hidden="true">
    <rect x="0" y="0" width="60" height="130" fill="var(--bg-secondary)" />
    {/* Sidebar items with nesting */}
    <rect x="8" y="10" width="40" height="6" rx="1" fill="var(--text-main)" opacity="0.7" />
    <rect x="8" y="24" width="30" height="6" rx="1" fill="var(--text-muted)" opacity="0.5" />
    <rect x="16" y="34" width="24" height="6" rx="1" fill="var(--text-muted)" opacity="0.5" />
    <rect x="24" y="44" width="28" height="6" rx="1" fill="var(--accent)" opacity="0.8" />
    <rect x="16" y="54" width="30" height="6" rx="1" fill="var(--text-muted)" opacity="0.5" />
    <rect x="8" y="68" width="36" height="6" rx="1" fill="var(--text-muted)" opacity="0.5" />

    <rect x="60" y="0" width="140" height="130" fill="var(--bg-primary)" />
    
    {/* Inline Subpage Block */}
    <rect x="70" y="20" width="110" height="6" rx="1" fill="var(--text-main)" opacity="0.3" />
    <rect x="70" y="36" width="100" height="24" rx="2" fill="var(--bg-secondary)" stroke="var(--border-color)" strokeWidth="1" />
    <rect x="76" y="42" width="10" height="12" rx="1" fill="var(--gruv-blue)" opacity="0.8" />
    <rect x="92" y="45" width="40" height="6" rx="1" fill="var(--text-main)" opacity="0.7" />
    
    {/* Template Block */}
    <rect x="70" y="74" width="110" height="40" rx="2" fill="var(--bg-element)" stroke="var(--gruv-purple)" strokeWidth="1" strokeDasharray="2 2" />
    <rect x="76" y="80" width="30" height="6" rx="1" fill="var(--gruv-purple)" opacity="0.8" />
    <rect x="76" y="92" width="90" height="4" rx="1" fill="var(--text-main)" opacity="0.4" />
    <rect x="76" y="100" width="70" height="4" rx="1" fill="var(--text-main)" opacity="0.4" />
  </svg>
);

const VISUAL_DONE = (
  <svg viewBox="0 0 200 130" className="w-full h-full" aria-hidden="true">
    <rect x="0" y="0" width="200" height="130" fill="var(--bg-primary)" />
    <circle cx="100" cy="58" r="28" fill="none" stroke="var(--accent)" strokeWidth="2" />
    <polyline points="86,58 96,68 116,48" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="30" y="100" width="140" height="6" rx="1" fill="var(--text-muted)" opacity="0.3" />
    <rect x="60" y="112" width="80" height="6" rx="1" fill="var(--text-muted)" opacity="0.3" />
  </svg>
);

const VISUALS: Record<VisualKey, React.ReactElement> = {
  commands: VISUAL_COMMANDS,
  panels: VISUAL_PANELS,
  structure: VISUAL_STRUCTURE,
  done: VISUAL_DONE,
};

export function WelcomeModal() {
  const hasSeenWelcome = useStore((s) => s.hasSeenWelcome);
  const dismissWelcome = useStore((s) => s.dismissWelcome);

  const [stepIndex, setStepIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!hasSeenWelcome) {
      setStepIndex(0);
      setIsExiting(false);
      setIsVisible(false);
      const t = setTimeout(() => setIsVisible(true), 80);
      return () => clearTimeout(t);
    }
  }, [hasSeenWelcome]);

  const close = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      dismissWelcome();
    }, 220);
  }, [dismissWelcome]);

  useEffect(() => {
    if (hasSeenWelcome) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        close();
      }
    };
    window.addEventListener("keydown", handleKey, { capture: true });
    return () => window.removeEventListener("keydown", handleKey, { capture: true });
  }, [hasSeenWelcome, close]);

  if (hasSeenWelcome) return null;

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  const modal = (
    <div
      className={cn(
        "fixed inset-0 z-[999999] flex items-center justify-center transition-all duration-200",
        isVisible && !isExiting ? "bg-black/50 backdrop-blur-sm" : "bg-black/0 backdrop-blur-none",
      )}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className={cn(
          "relative flex flex-col w-[540px] max-w-[95vw] bg-background border-2 border-border shadow-retro select-none transition-all duration-220",
          isVisible && !isExiting
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-4 scale-[0.97]",
        )}
        style={{ willChange: "transform, opacity" }}
      >
        <div className="h-7 bg-element border-b-2 border-border flex items-center justify-between px-3 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setStepIndex(i)}
                className={cn(
                  "h-2 transition-all duration-150 border border-border/60",
                  i === stepIndex
                    ? "w-6 bg-accent border-accent"
                    : i < stepIndex
                    ? "w-2 bg-accent/40"
                    : "w-2 bg-element",
                )}
                aria-label={s.label}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-muted uppercase tracking-widest">
              {stepIndex + 1} / {STEPS.length}
            </span>
            <button
              onClick={close}
              className="font-mono text-[10px] text-muted hover:text-accent transition-colors uppercase tracking-wider"
              title="Close (Esc)"
            >
              ESC
            </button>
          </div>
        </div>

        <div className="h-[130px] bg-sidebar border-b border-border flex-shrink-0 overflow-hidden">
          {VISUALS[step.visual as VisualKey]}
        </div>

        <div className="p-6 flex flex-col gap-4 flex-1">
          <div>
            <div className="font-mono text-[10px] text-accent uppercase tracking-widest mb-1.5">
              {step.label}
            </div>
            <h2 className="text-base font-bold text-main leading-snug" style={{ color: "var(--heading-color)" }}>
              {step.headline}
            </h2>
            <p className="mt-2 text-sm text-muted leading-relaxed font-sans">
              {step.body}
            </p>
          </div>

          {step.keys.length > 0 && (
            <div className="flex flex-col gap-1.5 border-t border-border/40 pt-3">
              {step.keys.map((item) => (
                <div key={item.keys.join("+")} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {item.keys.map((k) => (
                      <kbd
                        key={k}
                        className="px-1.5 py-0.5 bg-element border border-border shadow-retro-sm font-mono text-[11px] text-main"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                  <span className="text-[12px] text-muted">{item.desc}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 pb-5 flex items-center justify-between border-t border-border/30 pt-4 flex-shrink-0">
          <button
            onClick={() => setStepIndex((i) => Math.max(i - 1, 0))}
            disabled={stepIndex === 0}
            className="font-mono text-[11px] uppercase tracking-wider text-muted hover:text-main transition-colors disabled:opacity-20 disabled:pointer-events-none"
          >
            ← Back
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={close}
              className="font-mono text-[11px] uppercase tracking-wider text-muted/60 hover:text-muted transition-colors"
            >
              Skip tour
            </button>

            <button
              onClick={() => {
                if (isLastStep) {
                  close();
                } else {
                  setStepIndex((i) => i + 1);
                }
              }}
              className="px-4 py-1.5 bg-accent text-background font-mono text-[11px] uppercase tracking-wider shadow-retro-sm hover:opacity-90 transition-opacity border border-accent"
            >
              {isLastStep ? "Get Started" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
