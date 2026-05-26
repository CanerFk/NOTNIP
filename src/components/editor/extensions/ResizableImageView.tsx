import { NodeViewProps } from '@tiptap/react';
import { useState, useEffect } from 'react';
import { Image as ImageIcon, AlertTriangle, Link } from 'lucide-react';
import { BlockWrapper } from './BlockWrapper';
import { cn } from '../../../lib/utils';
import { exists } from '@tauri-apps/plugin-fs';
import { convertFileSrc } from '@tauri-apps/api/core';
import { open as openDialog } from '@tauri-apps/plugin-dialog';

export function ResizableImageView(props: NodeViewProps) {
    const { src, alt, fullWidth, hasCaption, caption } = props.node.attrs;
    const isLocalLink = src?.startsWith('local-link:');
    const rawPath = isLocalLink ? src.substring('local-link:'.length) : '';

    const [realSrc, setRealSrc] = useState(isLocalLink ? '' : src);
    const [missingLocal, setMissingLocal] = useState(false);

    useEffect(() => {
        if (!isLocalLink) {
            setRealSrc(src);
            setMissingLocal(false);
            return;
        }

        let isMounted = true;
        async function verifyLocal() {
            try {
                const fileExists = await exists(rawPath);
                if (isMounted) {
                    if (fileExists) {
                        setRealSrc(convertFileSrc(rawPath));
                        setMissingLocal(false);
                    } else {
                        setMissingLocal(true);
                    }
                }
            } catch (e) {
                if (isMounted) setMissingLocal(true);
            }
        }
        verifyLocal();
        return () => { isMounted = false; };
    }, [src, isLocalLink, rawPath]);

    const promptRelink = async () => {
        const selected = await openDialog({
            title: `Please locate the missing '${alt}' image (Local Link)`,
            multiple: false,
            filters: [{ name: 'Resim', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }]
        });
        if (selected) {
            props.updateAttributes({ src: `local-link:${selected}` });
        }
    };

    return (
        <BlockWrapper
            node={props.node}
            updateAttributes={props.updateAttributes}
            deleteNode={props.deleteNode}
            title={alt || 'IMAGE'}
            icon={isLocalLink ? <Link size={14} /> : <ImageIcon size={14} />}
            showAlign={false}
        >
            <div className={cn(
                "min-h-[50px] flex flex-col items-center justify-center bg-background mx-auto transition-all",
                fullWidth ? "w-full" : "max-w-3xl"
            )}>
                {missingLocal ? (
                    <div className="w-full py-12 flex flex-col items-center justify-center gap-4 bg-muted-bg rounded border border-border text-muted">
                        <AlertTriangle size={32} className="text-red-500/80" />
                        <div className="flex flex-col items-center gap-1 text-center max-w-[280px]">
                            <span className="font-mono font-bold text-main">{alt || 'Image'}</span>
                            <span className="text-xs">System searched for this image at <code className="bg-background px-1 rounded">{rawPath}</code> but could not find it.</span>
                        </div>
                        <button
                            onClick={promptRelink}
                            className="flex items-center gap-2 px-4 py-2 bg-accent-yellow text-background font-bold rounded hover:bg-accent-yellow/80 transition-colors mt-2"
                        >
                            <Link size={16} />
                            Relink Path
                        </button>
                    </div>
                ) : (
                    <img
                        src={realSrc}
                        alt={alt}
                        className="w-full h-auto block select-none pointer-events-none rounded border border-border"
                        draggable={false}
                    />
                )}
                {hasCaption && (
                    <input
                        className="w-full text-center text-[0.85rem] text-muted italic bg-transparent border-none focus:outline-none mt-2 placeholder:text-muted/50"
                        placeholder="Write a caption..."
                        value={caption || ''}
                        onChange={(e) => props.updateAttributes({ caption: e.target.value })}
                        onClick={(e) => { e.stopPropagation(); }}
                    />
                )}
            </div>
        </BlockWrapper>
    );
}
