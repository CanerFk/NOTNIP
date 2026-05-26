const SEPARATOR_REGEX = /[\/\\]/;

export function normalizeSeparators(filePath: string): string {
    return filePath.replace(/\\/g, '/');
}

export function extractFilename(filePath: string): string {
    return filePath.split(SEPARATOR_REGEX).pop() || 'file';
}

export function extractDirectory(filePath: string): string {
    const normalized = normalizeSeparators(filePath);
    const lastSlash = normalized.lastIndexOf('/');
    return lastSlash >= 0 ? filePath.substring(0, lastSlash) : filePath;
}

export function joinPath(dir: string, filename: string): string {
    const sep = dir.includes('\\') ? '\\' : '/';
    const trimmedDir = dir.endsWith(sep) ? dir.slice(0, -1) : dir;
    return `${trimmedDir}${sep}${filename}`;
}
