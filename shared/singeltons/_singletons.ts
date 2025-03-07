import type { PromptDocument } from "./prompt";
import type { HighscoreDocument } from "./highscore";

/** A singleton is a type of document that exists as a single json file */
export interface SingletonDocument {}

/**
 * A mapping for all available singleton objects
 * @example { [key : singeltonName ] : SingeltonDocumentType }
 */
export interface SingletonDocuments {
	prompt: PromptDocument;
	highscore: HighscoreDocument;
	"session-highscore": HighscoreDocument;
}

/** An available singleton name */
export type SingletonName = keyof SingletonDocuments;
