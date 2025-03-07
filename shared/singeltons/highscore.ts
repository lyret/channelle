import type { SingletonDocument } from "./_singleton";

interface HighscoreEntry {
	name: string;
	points: number;
}

/** The Highscore singleton document that exists as a singleton on the server */
export interface HighscoreDocument extends SingletonDocument {
	name: string;
	entries: Array<HighscoreEntry>;
}
