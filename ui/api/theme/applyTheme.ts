import { DEFAULT_THEME, themes, type ThemeName } from "./themes";


/**
 * Apply the given theme by setting CSS variables on the document root
 */
export function applyTheme(themeName: ThemeName) {
	const theme = themes[themeName] || themes[DEFAULT_THEME];
	const root = document.documentElement;

	root.style.setProperty("--channelle-main-bg-color", theme.mainBgColor);
	root.style.setProperty("--channelle-main-text-color", theme.mainTextColor);
	root.style.setProperty("--channelle-menu-bg-color", theme.menuBgColor);
	root.style.setProperty("--channelle-menu-text-color", theme.menuTextColor);
	root.style.setProperty("--channelle-backstage-bg-color", theme.backstageBgColor);
	root.style.setProperty("--channelle-backstage-text-color", theme.backstageTextColor);
	root.style.setProperty("--bulma-primary", theme.primaryColor);
	root.style.setProperty("--bulma-link", theme.accentColor);
}
