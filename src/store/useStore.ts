import { create } from "zustand";
import { persist } from "zustand/middleware";
import { dbService, NoteMetadata } from "../lib/database.ts";

export interface PageMetadata extends NoteMetadata {}

const pageIndexCache = new WeakMap<
  PageMetadata[],
  ReadonlyMap<string, PageMetadata>
>();

export function getPageIndex(
  pages: PageMetadata[],
): ReadonlyMap<string, PageMetadata> {
  const cachedIndex = pageIndexCache.get(pages);
  if (cachedIndex) return cachedIndex;

  const pageIndex = new Map(pages.map((page) => [page.id, page]));
  pageIndexCache.set(pages, pageIndex);
  return pageIndex;
}

const pendingPageCreations = new Map<string, Promise<void>>();

function trackPageCreation(note: PageMetadata): Promise<void> {
  const creation = dbService.createNote(note);
  pendingPageCreations.set(note.id, creation);
  void creation.then(
    () => {
      if (pendingPageCreations.get(note.id) === creation) {
        pendingPageCreations.delete(note.id);
      }
    },
    () => {
      if (pendingPageCreations.get(note.id) === creation) {
        pendingPageCreations.delete(note.id);
      }
    },
  );
  return creation;
}

function debounce<T extends (...args: any[]) => any>(
  fn: T,
  ms: number,
): T & { flush: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: any[] | null = null;

  const debounced = (...args: any[]) => {
    lastArgs = args;
    if (timeoutId !== null) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = null;
      lastArgs = null;
      fn(...args);
    }, ms);
  };

  debounced.flush = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
      if (lastArgs) {
        const args = lastArgs;
        lastArgs = null;
        fn(...args);
      }
    }
  };

  return debounced as T & { flush: () => void };
}

interface StoreState {
  pages: PageMetadata[];
  activePageId: string | null;
  isLoading: boolean;
  fetchPages: () => Promise<void>;
  addPage: () => Promise<void>;
  addSubpage: (parentId: string) => Promise<string>;
  removePage: (id: string) => Promise<boolean>;

  deletionCandidateId: string | null;
  deletionCandidateCleanup: (() => void) | null;
  setDeletionCandidateId: (id: string | null, cleanup?: (() => void) | null) => void;

  setActivePage: (id: string) => void;
  closeActivePage: () => void;

  updatePageTitle: (id: string, title: string) => void;
  updatePageIcon: (id: string, icon: string) => void;
  updatePageContent: (id: string, content: any) => void;
  flushSaveContent: () => void;

  saveStatus: "idle" | "saving" | "saved" | "error";
  setSaveStatus: (status: "idle" | "saving" | "saved" | "error") => void;

  isSettingsOpen: boolean;
  settingsTab: "appearance" | "typography" | "editor" | "data" | "guide";
  toggleSettings: () => void;
  openSettings: (tab?: "appearance" | "typography" | "editor" | "data" | "guide") => void;

  themePreferences: {
    accentColor: string;
    sidebarColor: string;
    sidebarHoverColor: string;
    sidebarHoverOpacity: number;
    logoColor: string;
    activeItemColor: string;
    headingColor: string;
    editorTitleColor: string;
    boldColor: string;
    fontBody: string;
    fontCode: string;
    readableLineLength: boolean;
  };
  updateTheme: (prefs: Partial<StoreState["themePreferences"]>) => void;

  panels: { id: string; type: string; position: { x: number; y: number } }[];
  openPanel: (type: string) => void;
  closePanel: (id: string) => void;
  updatePanelPosition: (id: string, position: { x: number; y: number }) => void;

  quickNotes: { id: string; text: string; createdAt: number }[];
  addQuickNote: (text: string) => void;
  removeQuickNote: (id: string) => void;
  updateQuickNoteText: (id: string, text: string) => void;

  pomodoroState: {
    isRunning: boolean;
    startedAt: number | null;
    pausedRemaining: number | null;
    sessionsCompleted: number;
    focusDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
    mode: "work" | "shortBreak" | "longBreak";
  };
  updatePomodoro: (state: Partial<StoreState["pomodoroState"]>) => void;

  isFocusMode: boolean;
  toggleFocusMode: () => void;

  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;

  isCalendarModalOpen: boolean;
  toggleCalendarModal: () => void;
  calendarSelectedDate: string;
  setCalendarSelectedDate: (date: string) => void;
  calendarTodosByDate: Record<
    string,
    { id: string; text: string; done: boolean }[]
  >;
  updateCalendarTodos: (
    date: string,
    todos: { id: string; text: string; done: boolean }[],
  ) => void;

  editorAppearance: {
    fontSize: number;
    lineHeight: number;
    paragraphSpacing: number;
    zoom: number;
    textAlign: "left" | "center" | "right" | "justify";
  };
  updateEditorAppearance: (
    prefs: Partial<StoreState["editorAppearance"]>,
  ) => void;

  favoritePageIds: string[];
  toggleFavorite: (id: string) => void;

  recentPageIds: string[];

  isQuickSwitcherOpen: boolean;
  openQuickSwitcher: () => void;
  closeQuickSwitcher: () => void;

  openOrCreateDailyNote: () => Promise<void>;
}

export const debouncedSaveContent = debounce(
  async (
    id: string,
    content: any,
    setSaveStatus: (status: "idle" | "saving" | "saved" | "error") => void,
  ) => {
    setSaveStatus("saving");
    try {
      await dbService.saveNoteContent(id, content);
      setSaveStatus("saved");
    } catch (error) {
      console.error("Failed to save note content:", error);
      setSaveStatus("error");
    }
  },
  1000,
);

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    debouncedSaveContent.flush();
  });
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      pages: [],
      activePageId: null,
      isLoading: true,
      saveStatus: "idle",
      setSaveStatus: (status) => set({ saveStatus: status }),

      isSettingsOpen: false,
      settingsTab: "appearance",
      toggleSettings: () =>
        set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
      openSettings: (tab = "appearance") =>
        set({ isSettingsOpen: true, settingsTab: tab }),

      themePreferences: {
        accentColor: "#e78a4e",
        sidebarColor: "#504945",
        sidebarHoverColor: "#d3869b",
        sidebarHoverOpacity: 0.1,
        logoColor: "#d3869b",
        activeItemColor: "#d3869b",
        headingColor: "#d8a657",
        editorTitleColor: "#e78a4e",
        boldColor: "#e78a4e",
        fontBody: "Inter",
        fontCode: "JetBrains Mono",
        readableLineLength: true,
      },
      updateTheme: (prefs) =>
        set((state) => ({
          themePreferences: { ...state.themePreferences, ...prefs },
        })),

      editorAppearance: {
        fontSize: 17,
        lineHeight: 1.1,
        paragraphSpacing: 0.4,
        zoom: 100,
        textAlign: "left",
      },
      updateEditorAppearance: (prefs) =>
        set((state) => ({
          editorAppearance: { ...state.editorAppearance, ...prefs },
        })),

      favoritePageIds: [],
      toggleFavorite: (id) =>
        set((state) => ({
          favoritePageIds: state.favoritePageIds.includes(id)
            ? state.favoritePageIds.filter((f) => f !== id)
            : [...state.favoritePageIds, id],
        })),

      recentPageIds: [],

      isQuickSwitcherOpen: false,
      openQuickSwitcher: () => set({ isQuickSwitcherOpen: true }),
      closeQuickSwitcher: () => set({ isQuickSwitcherOpen: false }),

      openOrCreateDailyNote: async () => {
        const today = new Date().toISOString().slice(0, 10);
        const title = `Daily / ${today}`;
        const existing = get().pages.find(
          (p) => p.title === title && !p.is_deleted,
        );
        if (existing) {
          get().setActivePage(existing.id);
          return;
        }
        const newId = crypto.randomUUID();
        const now = Date.now();
        const newPage: PageMetadata = {
          id: newId,
          title,
          icon: "calendar",
          parent_id: null,
          type: "page",
          is_deleted: false,
          updated_at: now,
          created_at: now,
        };
        set((state) => ({
          pages: [newPage, ...state.pages],
          activePageId: newId,
        }));
        try {
          await trackPageCreation(newPage);
        } catch (e) {
          console.error("Failed to create daily note", e);
          set((state) => ({
            pages: state.pages.filter((p) => p.id !== newId),
            activePageId: state.pages.length > 0 ? state.pages[0].id : null,
          }));
        }
      },

      panels: [],
      openPanel: (type) =>
        set((state) => {
          if (state.panels.find((p) => p.type === type)) return state;
          return {
            panels: [
              ...state.panels,
              {
                id: crypto.randomUUID(),
                type,
                position: {
                  x: 100 + state.panels.length * 30,
                  y: 100 + state.panels.length * 30,
                },
              },
            ],
          };
        }),
      closePanel: (id) =>
        set((state) => ({
          panels: state.panels.filter((p) => p.id !== id),
        })),
      updatePanelPosition: (id, position) =>
        set((state) => ({
          panels: state.panels.map((p) =>
            p.id === id ? { ...p, position } : p,
          ),
        })),

      quickNotes: [],
      addQuickNote: (text) =>
        set((state) => ({
          quickNotes: [
            { id: crypto.randomUUID(), text, createdAt: Date.now() },
            ...(state.quickNotes || []),
          ],
        })),
      removeQuickNote: (id) =>
        set((state) => ({
          quickNotes: (state.quickNotes || []).filter((n) => n.id !== id),
        })),
      updateQuickNoteText: (id, text) =>
        set((state) => ({
          quickNotes: (state.quickNotes || []).map((n) =>
            n.id === id ? { ...n, text } : n,
          ),
        })),

      pomodoroState: {
        isRunning: false,
        startedAt: null,
        pausedRemaining: null,
        sessionsCompleted: 0,
        focusDuration: 25 * 60,
        shortBreakDuration: 5 * 60,
        longBreakDuration: 15 * 60,
        mode: "work",
      },
      updatePomodoro: (newState) =>
        set((state) => ({
          pomodoroState: { ...state.pomodoroState, ...newState },
        })),

      isFocusMode: false,
      toggleFocusMode: () =>
        set((state) => ({ isFocusMode: !state.isFocusMode })),

      sidebarWidth: 288,
      setSidebarWidth: (width) => set({ sidebarWidth: width }),

      isCalendarModalOpen: false,
      toggleCalendarModal: () =>
        set((state) => ({ isCalendarModalOpen: !state.isCalendarModalOpen })),
      calendarSelectedDate: new Date().toISOString().split("T")[0],
      setCalendarSelectedDate: (date) => set({ calendarSelectedDate: date }),
      calendarTodosByDate: {},
      updateCalendarTodos: (date, todos) =>
        set((state) => ({
          calendarTodosByDate: { ...state.calendarTodosByDate, [date]: todos },
        })),

      fetchPages: async () => {
        set({ isLoading: true });
        try {
          await dbService.init();
          const notesMetadata = await dbService.getNotesMetadata();
          set({
            pages: notesMetadata,
            isLoading: false,
          });
        } catch (e) {
          console.error("[Store] Failed to fetch pages:", e);
          set({ isLoading: false });
        }
      },

      addPage: async () => {
        const newId = crypto.randomUUID();
        const now = Date.now();
        const newPage: PageMetadata = {
          id: newId,
          title: "",
          parent_id: null,
          type: "page",
          is_deleted: false,
          updated_at: now,
          created_at: now,
        };

        set((state) => ({
          pages: [newPage, ...state.pages],
          activePageId: newId,
        }));

        try {
          await trackPageCreation(newPage);
        } catch (e) {
          console.error("Failed to create page in DB", e);
          set((state) => ({
            pages: state.pages.filter((p) => p.id !== newId),
            activePageId: state.pages.length > 0 ? state.pages[0].id : null,
          }));
        }
      },

      addSubpage: async (parentId: string): Promise<string> => {
        const newId = crypto.randomUUID();
        const now = Date.now();
        const newPage: PageMetadata = {
          id: newId,
          title: "Untitled Subpage",
          icon: "file",
          parent_id: parentId,
          type: "page",
          is_deleted: false,
          updated_at: now,
          created_at: now,
        };

        set((state) => ({
          pages: [...state.pages, newPage],
        }));

        try {
          await trackPageCreation(newPage);
        } catch (e) {
          console.error("Failed to create subpage in DB", e);
          set((state) => ({
            pages: state.pages.filter((p) => p.id !== newId),
          }));
        }

        return newId;
      },

      removePage: async (id) => {
        const getAllDescendants = (pageId: string, allPages: PageMetadata[]) => {
          const childrenByParent = new Map<string, string[]>();
          for (const page of allPages) {
            if (!page.parent_id) continue;
            const siblings = childrenByParent.get(page.parent_id);
            if (siblings) siblings.push(page.id);
            else childrenByParent.set(page.parent_id, [page.id]);
          }

          const descendants: string[] = [];
          const stack = [...(childrenByParent.get(pageId) || [])];
          while (stack.length > 0) {
            const childId = stack.pop();
            if (!childId) continue;
            descendants.push(childId);
            const children = childrenByParent.get(childId);
            if (children) stack.push(...children);
          }
          return descendants;
        };

        const stateBeforeDelete = get();
        const currentPages = stateBeforeDelete.pages;
        if (!currentPages.some((page) => page.id === id)) return false;
        const toDelete = [id, ...getAllDescendants(id, currentPages)];
        const toDeleteSet = new Set(toDelete);
        const pagesAfterDelete = currentPages.filter(
          (page) => !toDeleteSet.has(page.id),
        );
        const activePageIdAfterDelete = toDeleteSet.has(
          stateBeforeDelete.activePageId || "",
        )
          ? pagesAfterDelete[0]?.id ?? null
          : stateBeforeDelete.activePageId;
        const previousDeleteState = {
          pages: [...currentPages],
          activePageId: stateBeforeDelete.activePageId,
          favoritePageIds: [...stateBeforeDelete.favoritePageIds],
          recentPageIds: [...stateBeforeDelete.recentPageIds],
        };

        set((state) => {
          return {
            pages: state.pages.filter((page) => !toDeleteSet.has(page.id)),
            activePageId: activePageIdAfterDelete,
            favoritePageIds: state.favoritePageIds.filter(
              (id) => !toDeleteSet.has(id),
            ),
            recentPageIds: state.recentPageIds.filter(
              (id) => !toDeleteSet.has(id),
            ),
          };
        });

        try {
          await Promise.allSettled(
            toDelete
              .map((pageId) => pendingPageCreations.get(pageId))
              .filter((creation): creation is Promise<void> => !!creation),
          );
          await dbService.deleteNotesBatch(toDelete);
          return true;
        } catch (e) {
          console.error("Failed to delete pages in DB, rolling back", e);
          set((state) => {
            const currentPageIds = new Set(state.pages.map((page) => page.id));
            const restoredPages = previousDeleteState.pages.filter(
              (page) =>
                toDeleteSet.has(page.id) && !currentPageIds.has(page.id),
            );
            const restoreIds = new Set(restoredPages.map((page) => page.id));
            return {
              pages: [...state.pages, ...restoredPages],
              activePageId:
                state.activePageId === activePageIdAfterDelete
                  ? previousDeleteState.activePageId
                  : state.activePageId,
              favoritePageIds: [
                ...state.favoritePageIds,
                ...previousDeleteState.favoritePageIds.filter(
                  (pageId) =>
                    restoreIds.has(pageId) &&
                    !state.favoritePageIds.includes(pageId),
                ),
              ],
              recentPageIds: [
                ...previousDeleteState.recentPageIds.filter((pageId) =>
                  restoreIds.has(pageId),
                ),
                ...state.recentPageIds.filter(
                  (pageId) => !restoreIds.has(pageId),
                ),
              ].slice(0, 20),
            };
          });
          return false;
        }
      },

      setActivePage: (id) => {
        debouncedSaveContent.flush();
        set((state) => {
          const recent = [
            id,
            ...state.recentPageIds.filter((r) => r !== id),
          ].slice(0, 20);
          return { activePageId: id, recentPageIds: recent };
        });
      },

      closeActivePage: () => {
        debouncedSaveContent.flush();
        set({ activePageId: null });
      },

      updatePageTitle: (id, title) => {
        set((state) => ({
          pages: state.pages.map((p) =>
            p.id === id ? { ...p, title, updated_at: Date.now() } : p,
          ),
        }));
        dbService.updateNoteTitle(id, title).catch((e) => {
          console.error("Failed to save title:", e);
        });
      },

      updatePageIcon: (id, icon) => {
        set((state) => ({
          pages: state.pages.map((p) =>
            p.id === id ? { ...p, icon, updated_at: Date.now() } : p,
          ),
        }));
        dbService.updateNoteIcon(id, icon).catch((e) => {
          console.error("Failed to save icon:", e);
        });
      },

      updatePageContent: (id, content) => {
        debouncedSaveContent(id, content, get().setSaveStatus);
      },
      flushSaveContent: () => {
        debouncedSaveContent.flush();
      },

      deletionCandidateId: null,
      deletionCandidateCleanup: null,
      setDeletionCandidateId: (id, cleanup = null) =>
        set({ deletionCandidateId: id, deletionCandidateCleanup: cleanup }),
    }),
    {
      name: "notnip-storage",
      partialize: (state) => ({
        themePreferences: state.themePreferences,
        panels: state.panels,
        quickNotes: state.quickNotes || [],
        pomodoroState: state.pomodoroState,
        calendarTodosByDate: state.calendarTodosByDate,
        sidebarWidth: state.sidebarWidth,
        editorAppearance: state.editorAppearance,
        favoritePageIds: state.favoritePageIds,
        recentPageIds: state.recentPageIds,
      }),
    },
  ),
);
