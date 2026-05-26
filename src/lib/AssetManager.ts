import { invoke } from '@tauri-apps/api/core';
import { dbService } from './database';
import { convertFileSrc } from '@tauri-apps/api/core';
import { writeFile, BaseDirectory, exists, mkdir, remove } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';

export interface AssetMetadata {
    hash: string;
    path: string;
    filename: string;
    mime_type: string;
    size_bytes: number;
    width?: number;
    height?: number;
}

class AssetManager {
    async uploadFile(file: File): Promise<AssetMetadata | null> {
        try {
            const tempDirExists = await exists('tmp', { baseDir: BaseDirectory.AppData });
            if (!tempDirExists) {
                await mkdir('tmp', { baseDir: BaseDirectory.AppData });
            }

            const buffer = await file.arrayBuffer();
            const bytes = new Uint8Array(buffer);

            const rawFilename = file.name || 'pasted_image.png';
            const tempFilename = `temp_${Date.now()}_${rawFilename.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
            await writeFile(`tmp/${tempFilename}`, bytes, { baseDir: BaseDirectory.AppData });

            const appData = await appDataDir();
            const filePath = await join(appData, 'tmp', tempFilename);

            const result = await this.processPath(filePath);

            try {
                await remove(`tmp/${tempFilename}`, { baseDir: BaseDirectory.AppData });
            } catch (e) {
                console.error("Failed to clean up temp file:", e);
            }

            return result;
        } catch (e) {
            console.error("Upload failed", e);
            return null;
        }
    }

    async processPath(filePath: string): Promise<AssetMetadata | null> {
        try {
            console.log("[AssetManager] Processing:", filePath);
            const metadata = await invoke<AssetMetadata>('process_asset', { filePath });

            console.log("[AssetManager] Processed:", metadata);

            // Record in DB
            await dbService.getDb().execute(
                `INSERT OR IGNORE INTO assets (file_hash, original_name, mime_type, size_bytes, width, height, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    metadata.hash,
                    metadata.filename,
                    metadata.mime_type,
                    metadata.size_bytes,
                    metadata.width || null,
                    metadata.height || null,
                    Date.now()
                ]
            );

            // Convert absolute path to Tauri Asset Protocol URL for the frontend
            const assetUrl = convertFileSrc(metadata.path);

            return {
                ...metadata,
                path: assetUrl // Return the usable URL for <img src>
            };

        } catch (e) {
            console.error("[AssetManager] Failed to process asset:", e);
            return null;
        }
    }
}

export const assetManager = new AssetManager();
