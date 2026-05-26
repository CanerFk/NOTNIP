
import Database from '@tauri-apps/plugin-sql';

const DB_NAME = 'notnip.db';

export interface NoteMetadata {
    id: string;
    parent_id: string | null;
    type: 'page' | 'collection';
    title: string;
    icon?: string;
    cover_image?: string;
    properties?: string;
    is_deleted: boolean;
    updated_at: number;
    created_at: number;
}

export interface NoteContent {
    id: string;
    content: any;
}

class DatabaseService {
    private db: Database | null = null;
    private initPromise: Promise<void> | null = null;

    async init() {
        if (this.db) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            try {
                this.db = await Database.load(`sqlite:${DB_NAME}`);
                await this.runMigrations();
            } catch (error) {
                console.error('Failed to initialize database:', error);
                throw error;
            } finally {
                this.initPromise = null;
            }
        })();

        return this.initPromise;
    }

    getDb(): Database {
        if (!this.db) throw new Error('Database not initialized');
        return this.db;
    }

    private async getSchemaVersion(): Promise<number> {
        if (!this.db) throw new Error('Database not initialized');
        const result = await this.db.select<{ user_version: number }[]>('PRAGMA user_version');
        return result[0]?.user_version ?? 0;
    }

    private async setSchemaVersion(version: number): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');
        await this.db.execute(`PRAGMA user_version = ${version}`);
    }

    private async runMigrations() {
        if (!this.db) throw new Error('Database not initialized');

        const currentVersion = await this.getSchemaVersion();

        if (currentVersion < 1) {
            await this.db.execute(`
                CREATE TABLE IF NOT EXISTS notes (
                    id TEXT PRIMARY KEY,
                    parent_id TEXT,
                    type TEXT DEFAULT 'page',
                    title TEXT,
                    icon TEXT,
                    cover_image TEXT,
                    content TEXT,
                    content_binary BLOB,
                    properties TEXT,
                    is_deleted BOOLEAN DEFAULT 0,
                    created_at INTEGER,
                    updated_at INTEGER
                );
                CREATE INDEX IF NOT EXISTS idx_parent_id ON notes(parent_id);
            `);

            await this.db.execute(`
                CREATE TABLE IF NOT EXISTS assets (
                    file_hash TEXT PRIMARY KEY,
                    original_name TEXT,
                    mime_type TEXT,
                    size_bytes INTEGER,
                    width INTEGER,
                    height INTEGER,
                    created_at INTEGER,
                    synced_to_cloud BOOLEAN DEFAULT 0
                );
            `);

            await this.setSchemaVersion(1);
        }

        if (currentVersion < 2) {
            const cols = await this.db.select<{ name: string }[]>(
                `PRAGMA table_info(notes)`
            );
            const hasContentBinary = cols.some(c => c.name === 'content_binary');
            if (hasContentBinary) {
                await this.db.execute(`ALTER TABLE notes DROP COLUMN content_binary`);
            }
            await this.setSchemaVersion(2);
        }
    }

    private async ensureDb(): Promise<Database> {
        if (!this.db) await this.init();
        if (!this.db) throw new Error('Database not initialized');
        return this.db;
    }

    async createNote(note: Partial<NoteMetadata> & { id: string }): Promise<void> {
        const db = await this.ensureDb();

        const now = Date.now();
        const {
            id,
            parent_id = null,
            type = 'page',
            title = '',
            icon = null,
            cover_image = null,
            properties = '{}',
        } = note;

        await db.execute(
            `INSERT INTO notes (id, parent_id, type, title, icon, cover_image, content, properties, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [id, parent_id, type, title, icon, cover_image, '{}', properties, now, now]
        );
    }

    async saveNoteContent(id: string, content: any): Promise<void> {
        const db = await this.ensureDb();
        await db.execute(
            `UPDATE notes SET content = $1, updated_at = $2 WHERE id = $3`,
            [JSON.stringify(content), Date.now(), id]
        );
    }

    async updateNoteTitle(id: string, title: string): Promise<void> {
        const db = await this.ensureDb();
        await db.execute(
            `UPDATE notes SET title = $1, updated_at = $2 WHERE id = $3`,
            [title, Date.now(), id]
        );
    }

    async updateNoteIcon(id: string, icon: string): Promise<void> {
        const db = await this.ensureDb();
        await db.execute(
            `UPDATE notes SET icon = $1, updated_at = $2 WHERE id = $3`,
            [icon, Date.now(), id]
        );
    }

    async updateNoteParent(id: string, parentId: string | null): Promise<void> {
        const db = await this.ensureDb();
        await db.execute(
            `UPDATE notes SET parent_id = $1, updated_at = $2 WHERE id = $3`,
            [parentId, Date.now(), id]
        );
    }

    async updateNoteCoverImage(id: string, coverImage: string | null): Promise<void> {
        const db = await this.ensureDb();
        await db.execute(
            `UPDATE notes SET cover_image = $1, updated_at = $2 WHERE id = $3`,
            [coverImage, Date.now(), id]
        );
    }

    async updateNoteProperties(id: string, properties: string): Promise<void> {
        const db = await this.ensureDb();
        await db.execute(
            `UPDATE notes SET properties = $1, updated_at = $2 WHERE id = $3`,
            [properties, Date.now(), id]
        );
    }

    async deleteNote(id: string): Promise<void> {
        const db = await this.ensureDb();
        await db.execute('UPDATE notes SET is_deleted = 1, updated_at = $1 WHERE id = $2', [Date.now(), id]);
    }

    async getNotesMetadata(): Promise<NoteMetadata[]> {
        const db = await this.ensureDb();
        return await db.select<NoteMetadata[]>(
            `SELECT id, parent_id, type, title, icon, cover_image, properties, is_deleted, updated_at, created_at
             FROM notes
             WHERE is_deleted = 0
             ORDER BY updated_at DESC`
        );
    }

    async getNoteContent(id: string): Promise<NoteContent | null> {
        const db = await this.ensureDb();
        const result = await db.select<NoteContent[]>(
            `SELECT id, content FROM notes WHERE id = $1`,
            [id]
        );

        if (result.length === 0) return null;

        const note = result[0];
        if (typeof note.content === 'string') {
            try {
                note.content = JSON.parse(note.content);
            } catch (_e) {
                note.content = {};
            }
        }
        return note;
    }

    async getNoteById(id: string): Promise<(NoteMetadata & { content: any }) | null> {
        const db = await this.ensureDb();
        const result = await db.select<(NoteMetadata & { content: string })[]>(
            `SELECT * FROM notes WHERE id = $1 AND is_deleted = 0`,
            [id]
        );
        if (result.length === 0) return null;
        const row = result[0];
        let parsedContent = {};
        if (typeof row.content === 'string') {
            try { parsedContent = JSON.parse(row.content); } catch (_e) { parsedContent = {}; }
        }
        return { ...row, content: parsedContent };
    }

    async getChildPages(parentId: string): Promise<NoteMetadata[]> {
        const db = await this.ensureDb();
        return await db.select<NoteMetadata[]>(
            `SELECT id, parent_id, type, title, icon, cover_image, properties, is_deleted, updated_at, created_at
             FROM notes
             WHERE parent_id = $1 AND is_deleted = 0
             ORDER BY updated_at DESC`,
            [parentId]
        );
    }
}

export const dbService = new DatabaseService();
