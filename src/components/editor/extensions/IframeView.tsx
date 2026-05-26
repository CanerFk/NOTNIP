import { NodeViewProps } from '@tiptap/react';
import { useState, useEffect } from 'react';
import { FileText, Eye, AlertTriangle, Link } from 'lucide-react';
import { BlockWrapper } from './BlockWrapper';
import { exists } from '@tauri-apps/plugin-fs';
import { convertFileSrc } from '@tauri-apps/api/core';
import { open as openDialog } from '@tauri-apps/plugin-dialog';

export function IframeView(props: NodeViewProps) {
    const { src, title } = props.node.attrs;
    const isLocalLink = src?.startsWith('local-link:');
    const rawPath = isLocalLink ? src.substring('local-link:'.length) : '';

    const [realSrc, setRealSrc] = useState(isLocalLink ? '' : src);
    const [missingLocal, setMissingLocal] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

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
            title: `Please locate the missing '${title}' file (Local Link)`,
            multiple: false,
            filters: [{ name: 'PDF', extensions: ['pdf'] }]
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
            title={title || 'DOCUMENT'}
            icon={isLocalLink ? <Link size={14} /> : <FileText size={14} />}
            showAlign={false}
        >
            <div className="p-1 min-h-[350px] flex flex-col relative bg-background">
                {missingLocal ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background text-muted">
                        <AlertTriangle size={48} className="text-red-500/80" />
                        <div className="flex flex-col items-center gap-1 text-center max-w-[280px]">
                            <span className="font-mono font-bold text-main">{title || 'PDF Document'}</span>
                            <span className="text-xs">System searched for this file at <code className="bg-muted-bg px-1 rounded">{rawPath}</code> but could not find it.</span>
                        </div>
                        <button
                            onClick={promptRelink}
                            className="flex items-center gap-2 px-4 py-2 bg-accent-yellow text-background font-bold rounded hover:bg-accent-yellow/80 transition-colors mt-2"
                        >
                            <Link size={16} />
                            Relink Path
                        </button>
                    </div>
                ) : !isLoaded ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background text-muted">
                        <FileText size={48} className="text-border" />
                        <div className="flex flex-col items-center gap-1">
                            <span className="font-mono font-bold text-main">{title || 'PDF Document'}</span>
                            <span className="text-xs">{isLocalLink ? '(Local Link)' : ''} Saving mode active.</span>
                        </div>
                        <button
                            onClick={() => setIsLoaded(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-accent-yellow text-background font-bold rounded hover:bg-accent-yellow/80 transition-colors cursor-pointer"
                        >
                            <Eye size={16} />
                            Load Preview
                        </button>
                    </div>
                ) : (
                    <iframe
                        src={realSrc}
                        className="w-full h-full min-h-[500px] border-0 bg-white"
                        title={title}
                    />
                )}
            </div>
        </BlockWrapper>
    );
}
