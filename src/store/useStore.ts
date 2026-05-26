import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { dbService, NoteMetadata } from '../lib/database.ts';
import { debounce } from 'lodash-es';

export interface PageMetadata extends NoteMetadata { }

interface StoreState {
    pages: PageMetadata[];
    activePageId: string | null;
    isLoading: boolean;

    fetchPages: () => Promise<void>;
    addPage: () => Promise<void>;
    addSubpage: (parentId: string) => Promise<string>;
    removePage: (id: string, deleteDescendants?: boolean) => Promise<void>;

    deletionCandidateId: string | null;
    setDeletionCandidateId: (id: string | null) => void;

    setActivePage: (id: string) => void;

    updatePageTitle: (id: string, title: string) => void;
    updatePageIcon: (id: string, icon: string) => void;
    updatePageContent: (id: string, content: any) => void;

    wordCount: number;
    setWordCount: (count: number) => void;
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
    setSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void;

    isSettingsOpen: boolean;
    toggleSettings: () => void;

    themePreferences: {
        accentColor: string;
        sidebarColor: string;
        sidebarHoverColor: string;
        sidebarHoverOpacity: number;
        logoColor: string;
        activeItemColor: string;
        headingColor: string;
        editorTitleColor: string;
        fontBody: string;
        fontCode: string;
    };
    updateTheme: (prefs: Partial<StoreState['themePreferences']>) => void;

    panels: { id: string; type: string; position: { x: number; y: number } }[];
    openPanel: (type: string) => void;
    closePanel: (id: string) => void;
    updatePanelPosition: (id: string, position: { x: number; y: number }) => void;

    quickNotes: { id: string; text: string; createdAt: number }[];
    addQuickNote: (text: string) => void;
    removeQuickNote: (id: string) => void;
    updateQuickNoteText: (id: string, text: string) => void;

    pomodoroState: {
        timeLeft: number;
        isRunning: boolean;
        lastTimestamp: number | null;
        sessionsCompleted: number;
        focusDuration: number;
        shortBreakDuration: number;
        longBreakDuration: number;
        mode: 'work' | 'shortBreak' | 'longBreak';
    };
    updatePomodoro: (state: Partial<StoreState['pomodoroState']>) => void;

    isFocusMode: boolean;
    toggleFocusMode: () => void;

    sidebarWidth: number;
    setSidebarWidth: (width: number) => void;

    isCalendarModalOpen: boolean;
    toggleCalendarModal: () => void;
    calendarSelectedDate: string;
    setCalendarSelectedDate: (date: string) => void;
    calendarTodosByDate: Record<string, { id: string; text: string; done: boolean }[]>;
    updateCalendarTodos: (date: string, todos: { id: string; text: string; done: boolean }[]) => void;
}

const debouncedSaveContent = debounce(async (
    id: string,
    content: any,
    setSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void
) => {
    setSaveStatus('saving');
    try {
        await dbService.saveNoteContent(id, content);
        setSaveStatus('saved');
    } catch (error) {
        console.error("Failed to save note content:", error);
        setSaveStatus('error');
    }
}, 1000);

export const useStore = create<StoreState>()(
    persist(
        (set, get) => ({
            pages: [],
            activePageId: null,
            isLoading: true,
            wordCount: 0,
            setWordCount: (count) => set({ wordCount: count }),

            saveStatus: 'idle',
            setSaveStatus: (status) => set({ saveStatus: status }),

            isSettingsOpen: false,
            toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),

            themePreferences: {
                accentColor: '#e78a4e',
                sidebarColor: '#504945',
                sidebarHoverColor: '#d3869b',
                sidebarHoverOpacity: 0.1,
                logoColor: '#d3869b',
                activeItemColor: '#d3869b',
                headingColor: '#d8a657',
                editorTitleColor: '#e78a4e',
                fontBody: 'Inter',
                fontCode: 'JetBrains Mono',
            },
            updateTheme: (prefs) => set((state) => ({
                themePreferences: { ...state.themePreferences, ...prefs }
            })),

            panels: [],
            openPanel: (type) => set((state) => {
                if (state.panels.find(p => p.type === type)) return state;
                return {
                    panels: [...state.panels, {
                        id: crypto.randomUUID(),
                        type,
                        position: { x: 100 + state.panels.length * 30, y: 100 + state.panels.length * 30 }
                    }]
                };
            }),
            closePanel: (id) => set((state) => ({
                panels: state.panels.filter(p => p.id !== id)
            })),
            updatePanelPosition: (id, position) => set((state) => ({
                panels: state.panels.map(p => p.id === id ? { ...p, position } : p)
            })),

            quickNotes: [],
            addQuickNote: (text) => set((state) => ({
                quickNotes: [{ id: crypto.randomUUID(), text, createdAt: Date.now() }, ...(state.quickNotes || [])]
            })),
            removeQuickNote: (id) => set((state) => ({
                quickNotes: (state.quickNotes || []).filter(n => n.id !== id)
            })),
            updateQuickNoteText: (id, text) => set((state) => ({
                quickNotes: (state.quickNotes || []).map(n => n.id === id ? { ...n, text } : n)
            })),

            pomodoroState: {
                timeLeft: 25 * 60,
                isRunning: false,
                lastTimestamp: null,
                sessionsCompleted: 0,
                focusDuration: 25 * 60,
                shortBreakDuration: 5 * 60,
                longBreakDuration: 15 * 60,
                mode: 'work'
            },
            updatePomodoro: (newState) => set((state) => ({
                pomodoroState: { ...state.pomodoroState, ...newState }
            })),

            isFocusMode: false,
            toggleFocusMode: () => set((state) => ({ isFocusMode: !state.isFocusMode })),

            sidebarWidth: 288,
            setSidebarWidth: (width) => set({ sidebarWidth: width }),

            isCalendarModalOpen: false,
            toggleCalendarModal: () => set(state => ({ isCalendarModalOpen: !state.isCalendarModalOpen })),
            calendarSelectedDate: new Date().toISOString().split('T')[0],
            setCalendarSelectedDate: (date) => set({ calendarSelectedDate: date }),
            calendarTodosByDate: {},
            updateCalendarTodos: (date, todos) => set((state) => ({
                calendarTodosByDate: { ...state.calendarTodosByDate, [date]: todos }
            })),

            fetchPages: async () => {
                set({ isLoading: true });
                try {
                    await dbService.init();
                    const notesMetadata = await dbService.getNotesMetadata();
                    set({
                        pages: notesMetadata,
                        isLoading: false
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
                    title: '',
                    parent_id: null,
                    type: 'page',
                    is_deleted: false,
                    updated_at: now,
                    created_at: now
                };

                set((state) => ({
                    pages: [newPage, ...state.pages],
                    activePageId: newId
                }));

                try {
                    await dbService.createNote(newPage);
                } catch (e) {
                    console.error("Failed to create page in DB", e);
                    set((state) => ({
                        pages: state.pages.filter(p => p.id !== newId),
                        activePageId: state.pages.length > 0 ? state.pages[0].id : null
                    }));
                }
            },

            addSubpage: async (parentId: string): Promise<string> => {
                const newId = crypto.randomUUID();
                const now = Date.now();
                const newPage: PageMetadata = {
                    id: newId,
                    title: 'Untitled Subpage',
                    icon: 'file',
                    parent_id: parentId,
                    type: 'page',
                    is_deleted: false,
                    updated_at: now,
                    created_at: now
                };

                set((state) => ({
                    pages: [...state.pages, newPage],
                }));

                try {
                    await dbService.createNote(newPage);
                } catch (e) {
                    console.error("Failed to create subpage in DB", e);
                    set((state) => ({
                        pages: state.pages.filter(p => p.id !== newId)
                    }));
                }

                return newId;
            },

            removePage: async (id) => {
                debouncedSaveContent.flush();

                const getAllDescendants = (pageId: string, allPages: PageMetadata[]): string[] => {
                    const children = allPages.filter(p => p.parent_id === pageId);
                    let descendants: string[] = [];
                    for (const child of children) {
                        descendants.push(child.id);
                        descendants = descendants.concat(getAllDescendants(child.id, allPages));
                    }
                    return descendants;
                };

                const currentPages = get().pages;
                const toDelete = [id, ...getAllDescendants(id, currentPages)];
                const previousPages = [...currentPages];
                const previousActiveId = get().activePageId;

                set((state) => {
                    const newPages = state.pages.filter(p => !toDelete.includes(p.id));
                    let newActiveId = state.activePageId;
                    if (toDelete.includes(state.activePageId || '')) {
                        newActiveId = newPages.length > 0 ? newPages[0].id : null;
                    }
                    return { pages: newPages, activePageId: newActiveId };
                });

                try {
                    for (const pageId of toDelete) {
                        await dbService.deleteNote(pageId);
                    }
                } catch (e) {
                    console.error("Failed to delete pages in DB, rolling back", e);
                    set({ pages: previousPages, activePageId: previousActiveId });
                }
            },

            setActivePage: (id) => {
                debouncedSaveContent.flush();
                set({ activePageId: id });
            },

            updatePageTitle: (id, title) => {
                set(state => ({
                    pages: state.pages.map(p => p.id === id ? { ...p, title, updated_at: Date.now() } : p)
                }));
                dbService.updateNoteTitle(id, title).catch(e => {
                    console.error("Failed to save title:", e);
                });
            },

            updatePageIcon: (id, icon) => {
                set(state => ({
                    pages: state.pages.map(p => p.id === id ? { ...p, icon, updated_at: Date.now() } : p)
                }));
                dbService.updateNoteIcon(id, icon).catch(e => {
                    console.error("Failed to save icon:", e);
                });
            },

            updatePageContent: (id, content) => {
                set(state => ({
                    pages: state.pages.map(p => p.id === id ? { ...p, updated_at: Date.now() } : p)
                }));
                debouncedSaveContent(id, content, get().setSaveStatus);
            },

            deletionCandidateId: null,
            setDeletionCandidateId: (id) => set({ deletionCandidateId: id }),
        }),
        {
            name: 'notnip-storage',
            partialize: (state) => ({
                themePreferences: state.themePreferences,
                panelState: state.panels,
                panels: state.panels,
                quickNotes: state.quickNotes || [],
                pomodoroState: state.pomodoroState,
                calendarTodosByDate: state.calendarTodosByDate,
                sidebarWidth: state.sidebarWidth,
            }),
        }
    )
);
