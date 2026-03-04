import type { ThemeName } from "~/types/serverSideTypes";

export const DEFAULT_THEME: ThemeName = "mellan";

export interface Theme {
	name: ThemeName;
	mainBgColor: string;
	mainTextColor: string;
	menuBgColor: string;
	menuTextColor: string;
	primaryColor: string;
	linkColor: string;
	accentColor: string;
	successColor: string;
	dangerColor: string;
	warningColor: string;
	boxBgColor: string;
	blackBackground: string;
	controlBackground: string;
	controlColor: string;
	boxTextColor: string;
}

export const themes: Record<ThemeName, Theme> = {
	minimal: {
		name: "minimal",
		mainBgColor: "#000000",
		mainTextColor: "#ffffff",
		menuBgColor: "#1e1e1e",
		menuTextColor: "#e0e0e0",
		primaryColor: "#bb86fc",
		linkColor: "#9575cd",
		accentColor: "#03dac6",
		successColor: "#28a745",
		dangerColor: "#dc3545",
		warningColor: "#ff9800",
		boxBgColor: "#1e1e1e",
		blackBackground: "#000000",
		controlBackground: "#333333",
		controlColor: "#e0e0e0",
		boxTextColor: "#e0e0e0",
	},
	mellan: {
		name: "mellan",
		mainBgColor: "#000000",
		mainTextColor: "#e0e0e0",
		menuBgColor: "#1e1e1e",
		menuTextColor: "#e0e0e0",
		primaryColor: "#bb86fc",
		linkColor: "#9575cd",
		accentColor: "#03dac6",
		successColor: "#28a745",
		dangerColor: "#dc3545",
		warningColor: "#ff9800",
		boxBgColor: "#1e1e1e",
		blackBackground: "#000000",
		controlBackground: "#333333",
		controlColor: "#e0e0e0",
		boxTextColor: "#e0e0e0",
	},
	cool: {
		name: "cool",
		mainBgColor: "#000000",
		mainTextColor: "#ffd700",
		menuBgColor: "#0057b8",
		menuTextColor: "#ffd700",
		primaryColor: "#e57373",
		linkColor: "#9575cd",
		accentColor: "#0057b8",
		successColor: "#7cb342",
		dangerColor: "#f44336",
		warningColor: "#ff9800",
		boxBgColor: "#0057b8",
		blackBackground: "#000000",
		controlBackground: "#004596",
		controlColor: "#ffd700",
		boxTextColor: "#ffd700",
	},
	varm: {
		name: "varm",
		mainBgColor: "#1a120b",
		mainTextColor: "#f5f5dc",
		menuBgColor: "#3a2e22",
		menuTextColor: "#f5f5dc",
		primaryColor: "#cd853f",
		linkColor: "#daa520",
		accentColor: "#b8860b",
		successColor: "#2e8b57",
		dangerColor: "#8b0000",
		warningColor: "#ff8c00",
		boxBgColor: "#3a2e22",
		blackBackground: "#1a120b",
		controlBackground: "#5c4a3a",
		controlColor: "#f5f5dc",
		boxTextColor: "#f5f5dc",
	},
	livlig: {
		name: "livlig",
		mainBgColor: "#0a0a0a",
		mainTextColor: "#ffffff",
		menuBgColor: "#2a0a4a",
		menuTextColor: "#ffffff",
		primaryColor: "#ff00ff",
		linkColor: "#00ffff",
		accentColor: "#ff00aa",
		successColor: "#00ff88",
		dangerColor: "#ff4444",
		warningColor: "#ffaa00",
		boxBgColor: "#2a0a4a",
		blackBackground: "#0a0a0a",
		controlBackground: "#4a1a6a",
		controlColor: "#ffffff",
		boxTextColor: "#ffffff",
	},
};
