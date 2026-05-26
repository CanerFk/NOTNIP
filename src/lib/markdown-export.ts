import { JSONContent } from '@tiptap/react';

export interface MarkdownExportContext {
    assetMap?: Map<string, string>; // Maps tauri asset.localhost URLs to relative paths (e.g. ./assets/img.webp)
    pageMap?: Map<string, string>; // Maps page IDs to relative paths (e.g. ./Title.md)
    pageTitleMap?: Map<string, string>; // Maps page IDs to their actual titles
    isSubpage?: boolean; // Controls whether to use ../ or ./ for paths
}

export function jsonToMarkdown(content: JSONContent, context?: MarkdownExportContext): string {
    if (!content || !content.content) return '';
    return content.content.map(node => serializeNode(node, 0, context)).join('\n\n');
}

function serializeNode(node: JSONContent, depth: number, context?: MarkdownExportContext): string {
    switch (node.type) {
        case 'heading': {
            const level = node.attrs?.level || 1;
            return `${'#'.repeat(level)} ${getInlineText(node, context)}`;
        }

        case 'paragraph':
            return getInlineText(node, context);

        case 'codeBlock': {
            const language = node.attrs?.language || '';
            const code = getPlainText(node);
            return '```' + language + '\n' + code + '\n```';
        }

        case 'resizableImage':
        case 'image': {
            let src = node.attrs?.src || '';
            if (src.startsWith('local-link:')) {
                const rawPath = src.substring('local-link:'.length);
                const filename = rawPath.split(/[\/\\]/).pop() || 'image';
                src = context?.isSubpage ? `../${filename}` : `./${filename}`;
            } else if (context?.assetMap && src) {
                // Determine if the src URL has a mapped relative path
                for (const [tauriUrl, relativePath] of context.assetMap.entries()) {
                    if (src.includes(tauriUrl)) {
                        src = context?.isSubpage ? relativePath.replace('./', '../') : relativePath;
                        break;
                    }
                }
            }
            const alt = node.attrs?.alt || '';
            const caption = node.attrs?.caption || '';

            // Clean up backslashes for markdown compatibility inside links
            const safeSrc = src.replace(/\\/g, '/');
            const line = `![${alt}](${safeSrc})`;
            if (caption) return line + '\n*' + caption + '*';
            return line;
        }

        case 'bulletList':
            return (node.content || [])
                .map(li => serializeListItem(li, '-', depth, context))
                .join('\n');

        case 'orderedList':
            return (node.content || [])
                .map((li, i) => serializeListItem(li, `${i + 1}.`, depth, context))
                .join('\n');

        case 'listItem':
            return (node.content || [])
                .map(child => serializeNode(child, depth, context))
                .join('\n');

        case 'taskList':
            return (node.content || [])
                .map(li => serializeNode(li, depth, context))
                .join('\n');

        case 'taskItem': {
            const checked = node.attrs?.checked ? '[x]' : '[ ]';
            const indent = '  '.repeat(depth);
            const text = (node.content || [])
                .map(child => getInlineText(child, context))
                .join(' ');
            return `${indent}- ${checked} ${text}`;
        }

        case 'blockquote': {
            const inner = (node.content || [])
                .map(child => serializeNode(child, depth, context))
                .join('\n');
            return inner.split('\n').map(line => `> ${line}`).join('\n');
        }

        case 'horizontalRule':
            return '---';

        case 'hardBreak':
            return '  \n';

        case 'table': {
            if (!node.content || node.content.length === 0) return '';
            const rows = node.content.filter(r => r.type === 'tableRow');
            if (rows.length === 0) return '';

            const headerRow = rows[0];
            const headerCells = (headerRow.content || []).map(cell =>
                getInlineText(cell, context).trim() || ' '
            );
            const headerLine = '| ' + headerCells.join(' | ') + ' |';
            const separatorLine = '| ' + headerCells.map(() => '---').join(' | ') + ' |';

            const bodyLines = rows.slice(1).map(row => {
                const cells = (row.content || []).map(cell =>
                    getInlineText(cell, context).trim() || ' '
                );
                return '| ' + cells.join(' | ') + ' |';
            });

            return [headerLine, separatorLine, ...bodyLines].join('\n');
        }

        case 'tableBlock': {
            const titleAttr = node.attrs?.title || '';
            const tableNode = (node.content || []).find(c => c.type === 'table');
            const tableMarkdown = tableNode ? serializeNode(tableNode, depth, context) : '';
            if (titleAttr && titleAttr !== 'Untitled Table') {
                return `**${titleAttr}**\n\n${tableMarkdown}`;
            }
            return tableMarkdown;
        }

        case 'tableRow':
        case 'tableCell':
        case 'tableHeader':
            return getInlineText(node, context);

        case 'toggleBlock': {
            const title = node.attrs?.title || 'Toggle';
            const children = (node.content || [])
                .map(child => serializeNode(child, depth, context))
                .join('\n\n');
            return `<details>\n<summary>${title}</summary>\n\n${children}\n</details>`;
        }

        case 'subpageItem': {
            const pageId = node.attrs?.id || '';
            let pageTitle = node.attrs?.title || (context?.pageTitleMap?.get(pageId)) || 'Untitled Subpage';
            let path = context?.pageMap?.get(pageId) || `notnip://page/${pageId}`;
            return `[${pageTitle}](${path})`;
        }

        case 'iframe': {
            let src = node.attrs?.src || '';
            if (src.startsWith('local-link:')) {
                const rawPath = src.substring('local-link:'.length);
                const filename = rawPath.split(/[\/\\]/).pop() || 'document.pdf';
                src = context?.isSubpage ? `../${filename}` : `./${filename}`;
            } else if (context?.assetMap && src) {
                // Determine if the src URL has a mapped relative path
                for (const [tauriUrl, relativePath] of context.assetMap.entries()) {
                    if (src.includes(tauriUrl)) {
                        src = context?.isSubpage ? relativePath.replace('./', '../') : relativePath;
                        break;
                    }
                }
            }
            const title = node.attrs?.title || 'Embed';
            return `[${title}](${src})`;
        }

        default:
            return getInlineText(node, context);
    }
}

function serializeListItem(li: JSONContent, prefix: string, depth: number, context?: MarkdownExportContext): string {
    const indent = '  '.repeat(depth);
    const children = li.content || [];
    if (children.length === 0) return `${indent}${prefix} `;

    const firstBlock = getInlineText(children[0], context);
    const rest = children.slice(1)
        .map(child => {
            if (child.type === 'bulletList') return serializeNode(child, depth + 1, context);
            if (child.type === 'orderedList') return serializeNode(child, depth + 1, context);
            return '  '.repeat(depth + 1) + serializeNode(child, depth + 1, context);
        })
        .join('\n');

    const result = `${indent}${prefix} ${firstBlock}`;
    return rest ? result + '\n' + rest : result;
}

function getInlineText(node: JSONContent, context?: MarkdownExportContext): string {
    if (node.text) {
        let text = node.text;
        if (node.marks) {
            for (const mark of node.marks) {
                switch (mark.type) {
                    case 'bold':
                        text = `**${text}**`;
                        break;
                    case 'italic':
                        text = `_${text}_`;
                        break;
                    case 'strike':
                        text = `~~${text}~~`;
                        break;
                    case 'code':
                        text = `\`${text}\``;
                        break;
                    case 'link':
                        text = `[${text}](${mark.attrs?.href || ''})`;
                        break;
                }
            }
        }
        return text;
    }

    if (node.content) {
        return node.content.map(child => getInlineText(child, context)).join('');
    }

    return '';
}

function getPlainText(node: JSONContent): string {
    if (node.text) return node.text;
    if (node.content) return node.content.map(child => getPlainText(child)).join('');
    return '';
}
