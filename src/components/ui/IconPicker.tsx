import {
    FileText, Folder, Hash, Bookmark, Star, Heart,
    CheckCircle, Zap, Shield, Crown, Key, Briefcase,
    Camera, Music, Book, MapPin, Flag, Bell, Globe, Sparkles,
    type LucideIcon
} from 'lucide-react';
import { useState, useRef, useEffect, type ComponentType } from 'react';
import { cn } from '../../lib/utils';

export const AVAILABLE_ICONS = [
    'text', 'folder', 'hash', 'bookmark', 'star', 'heart',
    'check', 'zap', 'shield', 'crown', 'key', 'briefcase',
    'camera', 'music', 'book', 'map', 'flag', 'bell', 'globe', 'sparkles'
];

const ICON_MAP: Record<string, LucideIcon> = {
    text: FileText,
    folder: Folder,
    hash: Hash,
    bookmark: Bookmark,
    star: Star,
    heart: Heart,
    check: CheckCircle,
    zap: Zap,
    shield: Shield,
    crown: Crown,
    key: Key,
    briefcase: Briefcase,
    camera: Camera,
    music: Music,
    book: Book,
    map: MapPin,
    flag: Flag,
    bell: Bell,
    globe: Globe,
    sparkles: Sparkles,
};

export const renderIcon = (type: string, size = 16) => {
    const Icon = (ICON_MAP[type] || FileText) as ComponentType<{ size: number }>;
    return <Icon size={size} />;
};

interface IconPickerProps {
    currentIcon?: string;
    onSelect: (icon: string) => void;
    size?: number;
    className?: string;
    popupSide?: 'left' | 'right' | 'bottom';
}

export function IconPicker({ currentIcon = 'text', onSelect, size = 16, className, popupSide = 'bottom' }: IconPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative flex-shrink-0" ref={containerRef} onClick={(e) => e.stopPropagation()}>
            <button
                className={cn("hover:bg-accent/20 rounded transition-colors text-muted hover:text-accent flex items-center justify-center", className)}
                onClick={() => setIsOpen(!isOpen)}
                type="button"
            >
                {renderIcon(currentIcon, size)}
            </button>

            {isOpen && (
                <div className={cn(
                    "absolute z-50 bg-background border-2 border-border p-2 flex flex-wrap w-[220px] gap-1.5 rounded shadow-[4px_4px_0_0_var(--shadow-color)] animate-in fade-in zoom-in-95",
                    popupSide === 'left' ? 'right-0 top-full mt-2' : popupSide === 'right' ? 'left-full top-0 ml-2' : 'left-0 top-full mt-2'
                )}>
                    <div className="w-full text-[10px] uppercase tracking-widest text-muted/60 px-1 pb-1 mb-1 border-b border-border">
                        Select Icon
                    </div>
                    {AVAILABLE_ICONS.map(ic => (
                        <button
                            key={ic}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(ic);
                                setIsOpen(false);
                            }}
                            className={cn(
                                "p-2 rounded transition-all shadow-[2px_2px_0_0_transparent] active:translate-y-px active:shadow-none hover:shadow-[2px_2px_0_0_var(--shadow-color)]",
                                currentIcon === ic
                                    ? "bg-accent/20 text-accent border border-accent/50"
                                    : "bg-element text-muted border border-transparent hover:border-border hover:text-main"
                            )}
                        >
                            {renderIcon(ic, 16)}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
