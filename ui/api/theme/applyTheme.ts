import { DEFAULT_THEME, themes, type ThemeName } from "./themes";

/**
 * Convert hex color to RGB string
 * @param hex - Hex color string (e.g., "#ffffff" or "ffffff")
 * @returns RGB string (e.g., "255, 255, 255")
 */
function hexToRgb(hex: string): string {
	// Remove # if present
	hex = hex.replace(/^#/, '');

	// Parse hex values
	const r = parseInt(hex.substring(0, 2), 16);
	const g = parseInt(hex.substring(2, 4), 16);
	const b = parseInt(hex.substring(4, 6), 16);

	return `${r}, ${g}, ${b}`;
}

/**
 * Convert hex color to HSL string
 * @param hex - Hex color string (e.g., "#ffffff" or "ffffff")
 * @returns HSL string (e.g., "0, 0%, 100%")
 */
function hexToHsl(hex: string): string {
	// Remove # if present
	hex = hex.replace(/^#/, '');

	// Parse hex values
	const r = parseInt(hex.substring(0, 2), 16) / 255;
	const g = parseInt(hex.substring(2, 4), 16) / 255;
	const b = parseInt(hex.substring(4, 6), 16) / 255;

	// Find max and min values
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);

	// Calculate lightness
	let h, s, l = (max + min) / 2;

	// Calculate saturation
	if (max === min) {
		h = s = 0; // achromatic
	} else {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

		// Calculate hue
		if (max === r) {
			h = (g - b) / d + (g < b ? 6 : 0);
		} else if (max === g) {
			h = (b - r) / d + 2;
		} else {
			h = (r - g) / d + 4;
		}
		h /= 6;
	}

	// Convert to percentages and degrees
	return `${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
}

/**
 * Apply the given theme by setting CSS variables on the document root
 * Supports URL search parameter ?theme=[themeName] for development
 */
export function applyTheme(themeName: ThemeName) {
	// Check for URL search parameter override (development feature)
	const urlParams = new URLSearchParams(window.location.search);
	const urlTheme = urlParams.get("theme") as ThemeName | null;

	// Use URL theme if valid, otherwise use provided themeName
	const themeToApply = themes[urlTheme || themeName] || themes[DEFAULT_THEME];
	const root = document.documentElement;

	root.style.setProperty("--channelle-main-bg-color", themeToApply.mainBgColor);
	root.style.setProperty("--channelle-main-text-color", themeToApply.mainTextColor);
	root.style.setProperty("--bulma-scheme-main-rgb", hexToRgb(themeToApply.menuBgColor));
	root.style.setProperty("--channelle-menu-bg-color", themeToApply.menuBgColor);
	root.style.setProperty("--channelle-menu-text-color", themeToApply.menuTextColor);
	root.style.setProperty("--bulma-primary", themeToApply.primaryColor);
	root.style.setProperty("--bulma-link", themeToApply.linkColor);
	root.style.setProperty("--bulma-success", themeToApply.successColor);
	root.style.setProperty("--bulma-danger", themeToApply.dangerColor);
	root.style.setProperty("--bulma-warning", themeToApply.warningColor);

	// Set HSL variables for Bulma color system
	root.style.setProperty("--bulma-primary-h", hexToHsl(themeToApply.primaryColor).split(',')[0]);
	root.style.setProperty("--bulma-primary-s", hexToHsl(themeToApply.primaryColor).split(',')[1]);
	root.style.setProperty("--bulma-primary-l", hexToHsl(themeToApply.primaryColor).split(',')[2]);

	// Set HSL variables for bulma-link (uses same colors as primary in our theme)
	root.style.setProperty("--bulma-link-h", hexToHsl(themeToApply.primaryColor).split(',')[0]);
	root.style.setProperty("--bulma-link-s", hexToHsl(themeToApply.primaryColor).split(',')[1]);
	root.style.setProperty("--bulma-link-l", hexToHsl(themeToApply.primaryColor).split(',')[2]);

	root.style.setProperty("--bulma-success-h", hexToHsl(themeToApply.successColor).split(',')[0]);
	root.style.setProperty("--bulma-success-s", hexToHsl(themeToApply.successColor).split(',')[1]);
	root.style.setProperty("--bulma-success-l", hexToHsl(themeToApply.successColor).split(',')[2]);

	root.style.setProperty("--bulma-danger-h", hexToHsl(themeToApply.dangerColor).split(',')[0]);
	root.style.setProperty("--bulma-danger-s", hexToHsl(themeToApply.dangerColor).split(',')[1]);
	root.style.setProperty("--bulma-danger-l", hexToHsl(themeToApply.dangerColor).split(',')[2]);

	root.style.setProperty("--bulma-warning-h", hexToHsl(themeToApply.warningColor).split(',')[0]);
	root.style.setProperty("--bulma-warning-s", hexToHsl(themeToApply.warningColor).split(',')[1]);
	root.style.setProperty("--bulma-warning-l", hexToHsl(themeToApply.warningColor).split(',')[2]);
	root.style.setProperty("--channelle-black-background", themeToApply.blackBackground);
	root.style.setProperty("--channelle-box-bg-color", themeToApply.boxBgColor);
	root.style.setProperty("--channelle-box-text-color", themeToApply.boxTextColor);
	root.style.setProperty("--channelle-scene-controls-bg-color", `color-mix(in srgb, ${themeToApply.menuBgColor} 80%, white 20%)`);
	root.style.setProperty("--bulma-text", themeToApply.mainTextColor);
	root.style.setProperty("--channelle-text-placeholder", `color-mix(in srgb, ${themeToApply.mainTextColor} 70%, white 30%)`);
	root.style.setProperty("--channelle-control-background", themeToApply.controlBackground);
	root.style.setProperty("--channelle-control-color", themeToApply.controlColor);

}
