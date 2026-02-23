export type ThemeName = "minimal" | "mellan" | "cool";
export const DEFAULT_THEME: ThemeName = "mellan";

export interface Theme {
	name: ThemeName;
	mainBgColor: string;
	mainTextColor: string;
	menuBgColor: string;
	menuTextColor: string;
	backstageBgColor: string;
	backstageTextColor: string;
	primaryColor: string;
	accentColor: string;
}

export const themes: Record<ThemeName, Theme> = {
	minimal: {
		name: "minimal",
		mainBgColor: "#000000",
		mainTextColor: "#ffffff",
		menuBgColor: "#000000",
		menuTextColor: "#ffffff",
		backstageBgColor: "#1a1a1a",
		backstageTextColor: "#ffffff",
		primaryColor: "#78275b",
		accentColor: "#6c6efc"
	},
	mellan: {
		name: "mellan",
		mainBgColor: "#f5f5f5",
		mainTextColor: "#333333",
		menuBgColor: "#ffffff",
		menuTextColor: "#333333",
		backstageBgColor: "#e0e0e0",
		backstageTextColor: "#333333",
		primaryColor: "#9c27b0",
		accentColor: "#3f51b5"
	},
	cool: {
		name: "cool",
		mainBgColor: "#000000",
		mainTextColor: "#ffff00",
		menuBgColor: "#000000",
		menuTextColor: "#ffff00",
		backstageBgColor: "#1a1a1a",
		backstageTextColor: "#ffff00",
		primaryColor: "#ffeb3b",
		accentColor: "#ff9800"
	}
};
