import { dbService } from './database';
import { ExportManifest, ExportedPage } from './page-export';
import { joinPath } from './path-utils';
import { open } from '@tauri-apps/plugin-dialog';
import { readFile, writeFile, exists, mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/core';

export interface ImportResult {
    success: boolean;
    rootPageId: string | null;
    pagesImported: number;
    assetsRestored: number;
    errors: string[];
}

function generateUuidMap(pages: ExportedPage[]): Map<string, string> {
    const map = new Map<string, string>();
    for (const page of pages) {
        map.set(page.id, crypto.randomUUID());
    }
    return map;
}

function remapContent(content: any, uuidMap: Map<string, string>, assetUrlMap: Map<string, string>, importDir: string): any {
    let jsonStr = JSON.stringify(content);

    for (const [oldId, newId] of uuidMap) {
        jsonStr = jsonStr.split(oldId).join(newId);
    }

    for (const [portableUrl, localUrl] of assetUrlMap) {
        jsonStr = jsonStr.split(portableUrl).join(localUrl);
    }

    jsonStr = jsonStr.replace(/"src":"local-link:\.\/([^"]+)"/g, (_match, filename) => {
        const absolutePath = joinPath(importDir, filename);
        const escapedPath = absolutePath.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        return `"src":"local-link:${escapedPath}"`;
    });

    return JSON.parse(jsonStr);
}

function base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

async function ensureAssetsDir(): Promise<void> {
    const dirExists = await exists('assets', { baseDir: BaseDirectory.AppData });
    if (!dirExists) {
        await mkdir('assets', { baseDir: BaseDirectory.AppData, recursive: true });
    }
}

async function restoreAsset(
    _hash: string,
    filename: string,
    data: string
): Promise<string | null> {
    try {
        await ensureAssetsDir();

        const fileExists = await exists(`assets/${filename}`, { baseDir: BaseDirectory.AppData });

        if (!fileExists) {
            const bytes = base64ToUint8Array(data);
            await writeFile(`assets/${filename}`, bytes, { baseDir: BaseDirectory.AppData });
        }

        const appData = await appDataDir();
        const absolutePath = await join(appData, 'assets', filename);
        return convertFileSrc(absolutePath);
    } catch (e) {
        console.error(`Failed to restore asset ${filename}:`, e);
        return null;
    }
}

export async function importFromFile(): Promise<ImportResult> {
    const result: ImportResult = {
        success: false,
        rootPageId: null,
        pagesImported: 0,
        assetsRestored: 0,
        errors: [],
    };

    try {
        const filePath = await open({
            multiple: false,
            filters: [
                { name: 'Notnip Export', extensions: ['notnip'] },
                { name: 'JSON', extensions: ['json'] },
            ],
        });

        if (!filePath) return result;

        const pathStr = typeof filePath === 'string' ? filePath : (filePath as any).path || String(filePath);
        const bytes = await readFile(pathStr);
        const decoder = new TextDecoder();
        const jsonStr = decoder.decode(bytes);

        let manifest: ExportManifest;
        try {
            manifest = JSON.parse(jsonStr);
        } catch (_e) {
            result.errors.push('Invalid JSON format');
            return result;
        }

        if (!manifest.formatVersion || !manifest.pages || !Array.isArray(manifest.pages)) {
            result.errors.push('Invalid Notnip export format');
            return result;
        }

        const importDir = pathStr.substring(0, Math.max(pathStr.lastIndexOf('/'), pathStr.lastIndexOf('\\')));
        return await importManifest(manifest, importDir);
    } catch (e) {
        result.errors.push(`Import failed: ${String(e)}`);
        return result;
    }
}

export async function importManifest(manifest: ExportManifest, importDir: string = ''): Promise<ImportResult> {
    const result: ImportResult = {
        success: false,
        rootPageId: null,
        pagesImported: 0,
        assetsRestored: 0,
        errors: [],
    };

    const uuidMap = generateUuidMap(manifest.pages);
    const assetUrlMap = new Map<string, string>();

    if (manifest.assets && manifest.assets.length > 0) {
        for (const asset of manifest.assets) {
            const localUrl = await restoreAsset(asset.hash, asset.filename, asset.data);
            if (localUrl) {
                assetUrlMap.set(`notnip-asset://${asset.filename}`, localUrl);
                result.assetsRestored++;
            } else {
                result.errors.push(`Failed to restore asset: ${asset.filename}`);
            }
        }
    }

    const sortedPages = topologicalSort(manifest.pages, uuidMap);

    for (const page of sortedPages) {
        try {
            const newId = uuidMap.get(page.id)!;
            const newParentId = page.parent_id ? (uuidMap.get(page.parent_id) || null) : null;
            const remappedContent = remapContent(page.content, uuidMap, assetUrlMap, importDir);

            await dbService.createNote({
                id: newId,
                parent_id: newParentId,
                type: page.type as 'page' | 'collection',
                title: page.title,
                icon: page.icon,
                cover_image: page.cover_image,
                properties: page.properties,
            });

            if (remappedContent && Object.keys(remappedContent).length > 0) {
                await dbService.saveNoteContent(newId, remappedContent);
            }

            result.pagesImported++;
        } catch (e) {
            result.errors.push(`Failed to import page "${page.title}": ${String(e)}`);
        }
    }

    result.rootPageId = uuidMap.get(manifest.rootPageId) || null;
    result.success = result.pagesImported > 0;

    return result;
}

function topologicalSort(
    pages: ExportedPage[],
    _uuidMap: Map<string, string>
): ExportedPage[] {
    const pageMap = new Map<string, ExportedPage>();
    for (const p of pages) {
        pageMap.set(p.id, p);
    }

    const sorted: ExportedPage[] = [];
    const visited = new Set<string>();

    function visit(id: string) {
        if (visited.has(id)) return;
        visited.add(id);

        const page = pageMap.get(id);
        if (!page) return;

        if (page.parent_id && pageMap.has(page.parent_id)) {
            visit(page.parent_id);
        }

        sorted.push(page);
    }

    for (const page of pages) {
        visit(page.id);
    }

    return sorted;
}
