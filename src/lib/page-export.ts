import { dbService } from './database';
import { JSONContent } from '@tiptap/react';
import { jsonToMarkdown, MarkdownExportContext } from './markdown-export';

import { readFile, exists, BaseDirectory, mkdir } from '@tauri-apps/plugin-fs';
import { save, open } from '@tauri-apps/plugin-dialog';
import { appDataDir, join } from '@tauri-apps/api/path';
import { writeFile } from '@tauri-apps/plugin-fs';

const EXPORT_FORMAT_VERSION = 1;

export interface ExportManifest {
    formatVersion: number;
    exportedAt: number;
    rootPageId: string;
    pages: ExportedPage[];
    assets: ExportedAsset[];
}

export interface ExportedPage {
    id: string;
    parent_id: string | null;
    type: string;
    title: string;
    icon?: string;
    cover_image?: string;
    properties?: string;
    created_at: number;
    updated_at: number;
    content: any;
}

export interface ExportedAsset {
    hash: string;
    filename: string;
    mime_type: string;
    data: string;
}

const TAURI_ASSET_REGEX = /https?:\/\/asset\.localhost\/[^\s"')]+/g;
const ASSET_HASH_REGEX = /([a-f0-9]{64})\.\w+/;

function extractAssetHashes(content: any): Set<string> {
    const hashes = new Set<string>();
    const jsonStr = JSON.stringify(content);
    const matches = jsonStr.match(TAURI_ASSET_REGEX);
    if (matches) {
        for (const url of matches) {
            const decodedUrl = decodeURIComponent(url);
            const hashMatch = decodedUrl.match(ASSET_HASH_REGEX);
            if (hashMatch) {
                hashes.add(hashMatch[1]);
            }
        }
    }
    return hashes;
}

function extractSubpageIds(content: any): Set<string> {
    const ids = new Set<string>();
    if (!content) return ids;

    function walk(node: JSONContent) {
        if (node.type === 'subpageItem' && node.attrs?.id) {
            ids.add(node.attrs.id);
        }
        if (node.content) {
            for (const child of node.content) {
                walk(child);
            }
        }
    }

    if (content.content) {
        for (const node of content.content) {
            walk(node);
        }
    } else if (content.type) {
        walk(content);
    }

    return ids;
}

function makeContentPortable(content: any, assetHashToFilename: Map<string, string>): any {
    const jsonStr = JSON.stringify(content);
    let portable = jsonStr;

    for (const [hash, filename] of assetHashToFilename) {
        const regex = new RegExp(
            `https?://asset\\.localhost/[^"'\\s)]*${hash}\\.[a-zA-Z]+`,
            'g'
        );
        portable = portable.replace(regex, `notnip-asset://${filename}`);
    }

    // Sanitize absolute local links (local-link:C:\...) into relative links for portability
    portable = portable.replace(/"src":"local-link:([^"]+)"/g, (_match, pathString) => {
        // Handle escaped JSON backslashes safely
        const safePath = pathString.replace(/\\\\/g, '/').replace(/\\/g, '/');
        const filename = safePath.split('/').pop() || 'file';
        return `"src":"local-link:./${filename}"`;
    });

    return JSON.parse(portable);
}

async function collectPagesRecursive(
    rootId: string,
    visited: Set<string>
): Promise<ExportedPage[]> {
    if (visited.has(rootId)) return [];
    visited.add(rootId);

    const fullNote = await dbService.getNoteById(rootId);
    if (!fullNote) return [];

    const page: ExportedPage = {
        id: fullNote.id,
        parent_id: fullNote.parent_id,
        type: fullNote.type,
        title: fullNote.title,
        icon: fullNote.icon,
        cover_image: fullNote.cover_image,
        properties: fullNote.properties,
        created_at: fullNote.created_at,
        updated_at: fullNote.updated_at,
        content: fullNote.content,
    };

    const result: ExportedPage[] = [page];

    const subpageIds = extractSubpageIds(fullNote.content);
    for (const subId of subpageIds) {
        const subPages = await collectPagesRecursive(subId, visited);
        result.push(...subPages);
    }

    const childPages = await dbService.getChildPages(rootId);
    for (const child of childPages) {
        const childExports = await collectPagesRecursive(child.id, visited);
        result.push(...childExports);
    }

    return result;
}

async function loadAssetData(hash: string): Promise<{ filename: string; data: string; mime_type: string } | null> {
    try {
        const extensions = ['webp', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'pdf', 'mp4', 'mp3', 'bin'];

        for (const ext of extensions) {
            const filename = `${hash}.${ext}`;
            const fileExists = await exists(`assets/${filename}`, { baseDir: BaseDirectory.AppData });

            if (fileExists) {
                const bytes = await readFile(`assets/${filename}`, { baseDir: BaseDirectory.AppData });
                const base64 = uint8ArrayToBase64(bytes);

                let mime = 'application/octet-stream';
                const mimeMap: Record<string, string> = {
                    webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg',
                    jpeg: 'image/jpeg', gif: 'image/gif', svg: 'image/svg+xml',
                    pdf: 'application/pdf', mp4: 'video/mp4', mp3: 'audio/mpeg',
                };
                mime = mimeMap[ext] || mime;

                return { filename, data: base64, mime_type: mime };
            }
        }
        return null;
    } catch (e) {
        console.error(`Failed to load asset ${hash}:`, e);
        return null;
    }
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        for (let j = 0; j < chunk.length; j++) {
            binary += String.fromCharCode(chunk[j]);
        }
    }
    return btoa(binary);
}

export async function exportPageAsJson(
    pageId: string,
    includeAssets: boolean = true
): Promise<ExportManifest> {
    const visited = new Set<string>();
    const pages = await collectPagesRecursive(pageId, visited);

    const allAssetHashes = new Set<string>();
    for (const page of pages) {
        const hashes = extractAssetHashes(page.content);
        for (const h of hashes) allAssetHashes.add(h);
    }

    const assets: ExportedAsset[] = [];
    const assetHashToFilename = new Map<string, string>();

    if (includeAssets) {
        for (const hash of allAssetHashes) {
            const assetData = await loadAssetData(hash);
            if (assetData) {
                assets.push({
                    hash,
                    filename: assetData.filename,
                    mime_type: assetData.mime_type,
                    data: assetData.data,
                });
                assetHashToFilename.set(hash, assetData.filename);
            }
        }
    }

    const portablePages = pages.map(page => ({
        ...page,
        content: makeContentPortable(page.content, assetHashToFilename),
    }));

    return {
        formatVersion: EXPORT_FORMAT_VERSION,
        exportedAt: Date.now(),
        rootPageId: pageId,
        pages: portablePages,
        assets,
    };
}

export async function exportPageToMarkdown(pageId: string): Promise<string> {
    const noteContent = await dbService.getNoteContent(pageId);
    if (!noteContent) return '';
    return jsonToMarkdown(noteContent.content);
}

export async function saveExportToFile(manifest: ExportManifest): Promise<string | null> {
    const rootPage = manifest.pages.find(p => p.id === manifest.rootPageId);
    const defaultName = (rootPage?.title || 'untitled').replace(/[^a-zA-Z0-9_-]/g, '_');

    const filePath = await save({
        defaultPath: `${defaultName}.notnip`,
        filters: [
            { name: 'Notnip Export', extensions: ['notnip'] },
            { name: 'JSON', extensions: ['json'] },
        ],
    });

    if (!filePath) return null;

    const jsonStr = JSON.stringify(manifest, null, 0);
    const encoder = new TextEncoder();
    const bytes = encoder.encode(jsonStr);

    await writeFile(filePath, bytes);
    return filePath;
}

export async function saveMarkdownToFile(pageId: string): Promise<string | null> {
    const visited = new Set<string>();
    const pages = await collectPagesRecursive(pageId, visited);
    if (!pages || pages.length === 0) return null;

    const rootPage = pages.find(p => p.id === pageId);
    if (!rootPage) return null;

    const exportRootName = (rootPage.title || 'untitled').replace(/[^a-zA-Z0-9_\-\u00f6\u00d6\u00e7\u00c7\u015f\u015e\u0131\u0130\u011f\u011e\u00fc\u00dc]/g, '_').replace(/\s+/g, '_');

    // Ask user for directory to output the folder
    const selectedDir = await open({
        directory: true,
        multiple: false,
        title: "Select Folder to Export Markdown Project"
    });

    if (!selectedDir) return null;

    const rootPath = await join(selectedDir as string, exportRootName);

    // Create folders
    await mkdir(rootPath, { recursive: true });
    await mkdir(await join(rootPath, 'assets'), { recursive: true });
    await mkdir(await join(rootPath, 'subpages'), { recursive: true });

    // Prepare Mappings for Assets
    const allAssetHashes = new Set<string>();
    for (const p of pages) {
        const hashes = extractAssetHashes(p.content);
        for (const h of hashes) allAssetHashes.add(h);
    }

    const appData = await appDataDir();
    const assetMap = new Map<string, string>();
    const extensions = ['webp', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'pdf', 'mp4', 'mp3', 'bin'];

    for (const hash of allAssetHashes) {
        for (const ext of extensions) {
            const filename = `${hash}.${ext}`;
            const fileExists = await exists(`assets/${filename}`, { baseDir: BaseDirectory.AppData });
            if (fileExists) {
                const srcPath = await join(appData, 'assets', filename);
                const destPath = await join(rootPath, 'assets', filename);
                try {
                    const bytes = await readFile(srcPath);
                    await writeFile(destPath, bytes);
                    assetMap.set(hash, `./assets/${filename}`);
                } catch (e) {
                    console.error("Failed to export physical asset:", e);
                }
                break; // Found the right extension, move to next hash
            }
        }
    }

    // Prepare Mappings for Pages
    const pageMap = new Map<string, string>();
    const pageTitleMap = new Map<string, string>();
    for (const p of pages) {
        pageTitleMap.set(p.id, p.title || 'Untitled');
        if (p.id === pageId) {
            pageMap.set(p.id, `./index.md`);
        } else {
            const cleanTitle = (p.title || 'Untitled').replace(/[^a-zA-Z0-9_\-]/g, '_');
            const shortId = p.id.substring(0, 6);
            pageMap.set(p.id, `./subpages/${cleanTitle}_${shortId}.md`);
        }
    }

    const context: MarkdownExportContext = { assetMap, pageMap, pageTitleMap };

    // Write all markdown files
    const encoder = new TextEncoder();
    for (const p of pages) {
        const isRoot = p.id === pageId;
        const currentContext = { ...context, isSubpage: !isRoot };

        // Before generating markdown, inject the page title as an H1 for subpages
        // Though they might already have an H1, let's keep it clean
        let md = jsonToMarkdown(p.content, currentContext);
        if (!isRoot) {
            md = `# ${p.title || 'Untitled'}\n\n${md}`;
        }

        let dest = '';
        if (isRoot) {
            dest = await join(rootPath, 'index.md');
        } else {
            const cleanTitle = (p.title || 'Untitled').replace(/[^a-zA-Z0-9_\-]/g, '_');
            const shortId = p.id.substring(0, 6);
            dest = await join(rootPath, 'subpages', `${cleanTitle}_${shortId}.md`);
        }

        await writeFile(dest, encoder.encode(md));
    }

    return rootPath;
}
