import { NodeViewContent, NodeViewProps } from '@tiptap/react';
import { Code } from 'lucide-react';
import { BlockWrapper } from './BlockWrapper';
import { cn } from '../../../lib/utils';

const supportedLanguages = ['rust', 'css', 'javascript', 'typescript', 'xml', 'c', 'cpp', 'python'];

export function CodeBlockView(props: NodeViewProps) {
    const { language, lineNumbers, wordWrap } = props.node.attrs;

    return (
        <BlockWrapper
            node={props.node}
            updateAttributes={props.updateAttributes}
            deleteNode={props.deleteNode}
            title={language ? `CODE (${language.toUpperCase()})` : 'CODE BLOCK'}
            icon={<Code size={14} />}
            showAlign={false}
        >
            <select
                contentEditable={false}
                defaultValue={language}
                onChange={event => props.updateAttributes({ language: event.target.value })}
                className="absolute top-10 right-2 z-10 bg-secondary text-main text-xs border-2 border-border rounded-none px-2 py-1 opacity-0 hover:opacity-100 transition-opacity focus:outline-none focus:border-accent shadow-retro-sm cursor-pointer"
            >
                <option value="null">auto</option>
                <option disabled>—</option>
                {supportedLanguages.map((lang, index) => (
                    <option key={index} value={lang}>{lang}</option>
                ))}
            </select>

            <div className="overflow-x-auto p-4 flex">
                {lineNumbers && (
                    <div className="flex-shrink-0 text-right pr-2 mr-2 border-r-2 border-[var(--gruv-yellow)] opacity-50 min-w-[1.5rem] text-[var(--gruv-yellow)] text-[0.875rem] font-mono leading-relaxed select-none pointer-events-none">
                        {props.node.textContent.split('\n').map((_, i) => (
                            <div key={i}>{i + 1}</div>
                        ))}
                    </div>
                )}
                <pre
                    spellCheck={false}
                    className={cn(
                        "bg-transparent border-none p-0 m-0 shadow-none leading-relaxed flex-1",
                        wordWrap ? "whitespace-pre-wrap break-words" : "whitespace-pre"
                    )}
                    style={{ fontFamily: 'var(--font-code), monospace', fontSize: '0.875rem' }}
                >
                    <NodeViewContent />
                </pre>
            </div>
        </BlockWrapper>
    );
}
