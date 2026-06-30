import { useEffect } from "react";
import { useStore } from "../store/useStore";

export function ThemeManager() {
  const themePreferences = useStore((state) => state.themePreferences);
  const editorAppearance = useStore((state) => state.editorAppearance);

  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty("--accent", themePreferences.accentColor);
    root.style.setProperty(
      "--active-icon-color",
      themePreferences.activeItemColor,
    );
    root.style.setProperty("--heading-color", themePreferences.headingColor);
    root.style.setProperty(
      "--sidebar-hover-bg",
      themePreferences.sidebarHoverColor,
    );
    root.style.setProperty(
      "--editor-title-color",
      themePreferences.editorTitleColor,
    );

    const fontBody = themePreferences.fontBody;
    root.style.setProperty(
      "--font-body",
      fontBody === "Inter"
        ? "'Inter', sans-serif"
        : fontBody === "Retro"
          ? "'Courier New', monospace"
          : fontBody === "VT323"
            ? "'VT323', monospace"
            : fontBody === "IBM Plex Mono"
              ? "'IBM Plex Mono', monospace"
              : "'Inter', sans-serif",
    );
    root.style.setProperty("--font-code", themePreferences.fontCode);
  }, [themePreferences]);

  useEffect(() => {
    const root = document.documentElement;
    const ea = editorAppearance ?? {
      fontSize: 17,
      lineHeight: 1.1,
      paragraphSpacing: 0.4,
      zoom: 100,
      justifyText: false,
    };
    const fontSize = Math.min(24, Math.max(12, ea.fontSize ?? 17));
    const lineHeight = Math.min(2.5, Math.max(1.0, ea.lineHeight ?? 1.1));
    const paragraphSpacing = Math.min(
      2,
      Math.max(0, ea.paragraphSpacing ?? 0.4),
    );
    const zoom = Math.min(150, Math.max(70, ea.zoom ?? 100));

    root.style.setProperty("--editor-font-size", `${fontSize}px`);
    root.style.setProperty("--editor-line-height", String(lineHeight));
    root.style.setProperty(
      "--editor-paragraph-spacing",
      `${paragraphSpacing}em`,
    );
    root.style.setProperty("--editor-zoom", String(zoom / 100));
    root.style.setProperty(
      "--editor-justify",
      ea.justifyText ? "justify" : "left",
    );
  }, [editorAppearance]);

  return null;
}
