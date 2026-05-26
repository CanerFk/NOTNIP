import { forwardRef, useEffect, useImperativeHandle, useState, useRef } from 'react'
import { Heading1, Heading2, List, Square, Code, Type, FolderPlus } from 'lucide-react'
import { cn } from '../../lib/utils'

export const SlashMenu = forwardRef((props: any, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null) // Ref for the container to handle scrolling
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]) // Refs for items

    const selectItem = (index: number) => {
        const item = props.items[index]
        if (item) {
            props.command(item)
        }
    }

    const upHandler = () => {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
    }

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length)
    }

    const enterHandler = () => {
        selectItem(selectedIndex)
    }

    useEffect(() => setSelectedIndex(0), [props.items])

    // Auto-scroll when selectedIndex changes
    useEffect(() => {
        const row = itemRefs.current[selectedIndex];
        if (row && containerRef.current) {
            // Check if the item is visible
            const container = containerRef.current;
            const itemTop = row.offsetTop;
            const itemBottom = itemTop + row.clientHeight;
            const containerTop = container.scrollTop;
            const containerBottom = containerTop + container.clientHeight;

            if (itemTop < containerTop) {
                container.scrollTop = itemTop;
            } else if (itemBottom > containerBottom) {
                container.scrollTop = itemBottom - container.clientHeight;
            }
        }
    }, [selectedIndex])


    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === 'ArrowUp') {
                upHandler()
                return true
            }

            if (event.key === 'ArrowDown') {
                downHandler()
                return true
            }

            if (event.key === 'Enter') {
                enterHandler()
                return true
            }

            return false
        },
    }))

    return (
        <div
            ref={containerRef}
            className="bg-background border border-border shadow-retro rounded-none p-1 w-64 flex flex-col gap-1 overflow-y-auto max-h-60 animate-in fade-in zoom-in-95 duration-100 custom-scrollbar"
        >
            <div className="text-[10px] uppercase tracking-wider text-muted font-bold px-2 py-1 mb-1 border-b border-border/50 sticky top-0 bg-background z-10">
                Basic Blocks
            </div>
            {props.items.map((item: any, index: number) => (
                <button
                    ref={(el) => { itemRefs.current[index] = el }}
                    className={cn(
                        'flex items-center gap-2 px-2 py-1.5 text-sm w-full text-left transition-all font-mono',
                        index === selectedIndex ? 'bg-accent text-white font-bold shadow-sm' : 'text-main hover:bg-element hover:text-main'
                    )}
                    key={index}
                    onClick={() => selectItem(index)}
                >
                    <div className={cn("p-1 rounded-sm border border-transparent", index === selectedIndex ? "bg-white/20" : "bg-element/50")}>
                        {item.icon}
                    </div>
                    <span className="flex-grow">{item.title}</span>
                </button>
            ))}
        </div>
    )
})

SlashMenu.displayName = 'SlashMenu'

export const SLASH_COMMANDS = [
    {
        title: 'Text',
        icon: <Type size={14} />,
        command: ({ editor, range }: any) => {
            editor.chain().focus().deleteRange(range).setNode('paragraph').run()
        },
    },
    {
        title: 'Heading 1',
        icon: <Heading1 size={14} />,
        command: ({ editor, range }: any) => {
            editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
        },
    },
    {
        title: 'Heading 2',
        icon: <Heading2 size={14} />,
        command: ({ editor, range }: any) => {
            editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
        },
    },
    {
        title: 'Bullet List',
        icon: <List size={14} />,
        command: ({ editor, range }: any) => {
            editor.chain().focus().deleteRange(range).toggleBulletList().run()
        },
    },
    {
        title: 'Task List',
        icon: <Square size={14} />,
        command: ({ editor, range }: any) => {
            editor.chain().focus().deleteRange(range).toggleTaskList().run()
        },
    },
    {
        title: 'Code Block',
        icon: <Code size={14} />,
        command: ({ editor, range }: any) => {
            editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
        },
    },
    {
        title: 'Subpage',
        icon: <FolderPlus size={14} color="#d79921" />, // Gruvbox Yellow
        command: ({ editor, range }: any) => {
            // Import store dynamically or assume global import availability if possible, 
            // but here we are in a pure TS file that exports an object. 
            // We need to use the store to create the page.
            import('../../store/useStore').then(({ useStore }) => {
                const store = useStore.getState();
                if (!store.activePageId) return;

                store.addSubpage(store.activePageId).then((newId) => {
                    // Delete slash command
                    editor.chain().focus().deleteRange(range).run();

                    // Insert Block
                    editor.chain().focus().insertContent({
                        type: 'subpageItem',
                        attrs: { id: newId }
                    }).run();
                });
            });
        },
    }
]
