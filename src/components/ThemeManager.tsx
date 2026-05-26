import { useEffect } from 'react';
import { useStore } from '../store/useStore';

export function ThemeManager() {
    const { themePreferences } = useStore();

    useEffect(() => {
        const root = document.documentElement;

        // Colors
        root.style.setProperty('--accent', themePreferences.accentColor);
        // We ensure logo stays pink in the component logic or here if we want to enforce it always
        // But user asked to NOT change logo color, so we keep it static or managed separately
        // root.style.setProperty('--gruv-purple', themePreferences.logoColor); 

        root.style.setProperty('--active-icon-color', themePreferences.activeItemColor);
        root.style.setProperty('--heading-color', themePreferences.headingColor);

        // New Customizations
        root.style.setProperty('--sidebar-hover-bg', themePreferences.sidebarHoverColor);
        root.style.setProperty('--editor-title-color', themePreferences.editorTitleColor);

        // Fonts
        // We assume these font families are loaded via Google Fonts link in index.html or imported in CSS
        root.style.setProperty('--font-body', themePreferences.fontBody === 'Inter' ? "'Inter', sans-serif" : themePreferences.fontBody === 'Retro' ? "'Courier Prime', monospace" : "sans-serif");
        root.style.setProperty('--font-code', themePreferences.fontCode);

    }, [themePreferences]);

    return null;
}
