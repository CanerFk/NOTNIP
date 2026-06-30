import { useEffect, useCallback } from "react";
import { Layout } from "./components/layout/Layout";
import { Editor } from "./components/editor/Editor";
import { useStore } from "./store/useStore";

function isNonEditorInputTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.closest(".ProseMirror")) return false;
  if (target.closest("input, textarea, select, button, [role='button']"))
    return true;

  const editableTarget = target.closest("[contenteditable='true']");
  return editableTarget !== null;
}

const ZOOM_STEP = 5;
const ZOOM_MIN = 70;
const ZOOM_MAX = 150;

function App() {
  const fetchPages = useStore((state) => state.fetchPages);
  const isLoading = useStore((state) => state.isLoading);
  const addPage = useStore((state) => state.addPage);
  const closeActivePage = useStore((state) => state.closeActivePage);
  const deletionCandidateId = useStore((state) => state.deletionCandidateId);
  const updateEditorAppearance = useStore(
    (state) => state.updateEditorAppearance,
  );
  const openQuickSwitcher = useStore((state) => state.openQuickSwitcher);

  const adjustZoom = useCallback(
    (delta: number) => {
      const ea = useStore.getState().editorAppearance;
      const current = ea?.zoom ?? 100;
      const next = Math.min(
        ZOOM_MAX,
        Math.max(
          ZOOM_MIN,
          Math.round((current + delta) / ZOOM_STEP) * ZOOM_STEP,
        ),
      );
      if (next !== current) updateEditorAppearance({ zoom: next });
    },
    [updateEditorAppearance],
  );

  useEffect(() => {
    fetchPages();

    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;

      const key = e.key.toLowerCase();

      if (key === "f") {
        e.preventDefault();
        return;
      }

      if (key === "k" || key === "p") {
        e.preventDefault();
        openQuickSwitcher();
        return;
      }

      if (key === "=" || e.key === "+" || e.key === "NumpadAdd") {
        e.preventDefault();
        adjustZoom(ZOOM_STEP);
        return;
      }
      if (key === "-" || e.key === "NumpadSubtract") {
        e.preventDefault();
        adjustZoom(-ZOOM_STEP);
        return;
      }
      if (key === "0") {
        e.preventDefault();
        updateEditorAppearance({ zoom: 100 });
        return;
      }

      const isManagedShortcut = key === "n" || key === "w";
      if (!isManagedShortcut) return;

      e.preventDefault();

      if (deletionCandidateId || isNonEditorInputTarget(e.target)) {
        return;
      }

      if (key === "n") {
        addPage();
        return;
      }

      if (key === "w") {
        closeActivePage();
        return;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      // Only zoom when the wheel event originates inside the editor scroll area
      const target = e.target as HTMLElement | null;
      if (!target?.closest('[data-editor-scroll="true"]')) return;
      e.preventDefault();
      adjustZoom(e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP);
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("wheel", handleWheel, {
      passive: false,
      capture: true,
    });
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("wheel", handleWheel, { capture: true });
    };
  }, [
    addPage,
    closeActivePage,
    deletionCandidateId,
    adjustZoom,
    updateEditorAppearance,
    openQuickSwitcher,
  ]);

  if (isLoading) {
    return (
      <div className="retro-loading-screen">
        <div className="retro-loading-logo">NOTNIP</div>
        <div className="retro-loading-bar-track">
          <div className="retro-loading-bar-fill" />
        </div>
        <div className="retro-loading-text">LOADING...</div>
      </div>
    );
  }

  return (
    <Layout>{(setWordCount) => <Editor setWordCount={setWordCount} />}</Layout>
  );
}

export default App;
